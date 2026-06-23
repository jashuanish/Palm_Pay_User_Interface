"""
embed.py — Palm biometric inference + analysis helper.

Loads the trained TorchScript model once (singleton) and exposes:
  - analyze_from_base64()  → embedding + print/vein classification + the
                             preprocessed "identity pattern" image (for display).

Called by the FastAPI endpoints in main.py. All heavy work (the notebook
preprocessing pipeline + the CNN forward pass) runs here on the GPU, so the
browser only has to POST a palm crop and render the result.
"""
from __future__ import annotations

import base64
from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np
import torch

MODEL_PATH = Path(__file__).parent / "palm_vein_model.pt"
IMAGE_SIZE = 224

_model: Optional[torch.jit.ScriptModule] = None
_device: Optional[torch.device] = None


def get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_model() -> torch.jit.ScriptModule:
    global _model, _device
    if _model is not None:
        return _model
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_PATH}. Run: python backend/train_model.py"
        )
    _device = get_device()
    _model = torch.jit.load(str(MODEL_PATH), map_location=_device)
    _model.eval()
    print(f"[embed] Model loaded from {MODEL_PATH} on {_device}")
    return _model


# ---------------------------------------------------------------------------
# preprocessing — identical to train_model.py / the notebook
# ---------------------------------------------------------------------------
def _extract_roi(gray: np.ndarray) -> np.ndarray:
    std = cv2.resize(gray, (640, 480), interpolation=cv2.INTER_AREA)
    blur = cv2.GaussianBlur(std, (5, 5), 0)
    _, mask = cv2.threshold(blur, 20, 255, cv2.THRESH_BINARY)
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cx, cy, roi_size = 320, 240, 220
    if contours:
        best = max(contours, key=cv2.contourArea)
        coverage = cv2.contourArea(best) / (640 * 480)
        if 0.06 < coverage < 0.97:
            m = cv2.moments(best)
            if m["m00"] != 0:
                cx = int(m["m10"] / m["m00"])
                cy = int(m["m01"] / m["m00"])
    x1 = max(cx - roi_size // 2, 0)
    y1 = max(cy - roi_size // 2, 0)
    x2 = min(cx + roi_size // 2, 640)
    y2 = min(cy + roi_size // 2, 480)
    roi = std[y1:y2, x1:x2]
    return cv2.resize(roi, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_LINEAR)


def _enhance(roi: np.ndarray) -> np.ndarray:
    d = cv2.medianBlur(roi, 5)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    c = clahe.apply(d)
    b2 = cv2.GaussianBlur(c, (5, 5), 0)
    g = cv2.addWeighted(c, 1.5, b2, -0.5, 0)
    n = cv2.normalize(g, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    lut = np.array([min(255, int((i / 255.0) ** 1.5 * 255)) for i in range(256)], dtype=np.uint8)
    return cv2.LUT(n, lut)


def _preprocess_gray(gray: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Return (roi, enhanced) — roi is the cropped palm, enhanced is the final pattern."""
    roi = _extract_roi(gray)
    enhanced = _enhance(roi)
    return roi, enhanced


# ---------------------------------------------------------------------------
# print-vs-vein classification
# ---------------------------------------------------------------------------
def classify_image_type(gray: np.ndarray) -> Tuple[str, bool]:
    """
    Distinguish an EXTERNAL palm print (RGB/visible-light — what a normal camera
    sees) from an INTERNAL palm-vein scan (near-infrared — dark frame with sparse
    bright vascular ridges).

    Returns (image_type, secure):
      - 'print'  → external surface only. NOT liveness-safe on its own.  secure=False
      - 'vein'   → internal vascular pattern (NIR). Spoof-resistant.       secure=True
    """
    g = gray if gray.ndim == 2 else cv2.cvtColor(gray, cv2.COLOR_BGR2GRAY)
    mean = float(g.mean())
    dark_frac = float((g < 40).mean())
    # NIR vein captures are overwhelmingly dark with thin bright veins.
    is_vein = mean < 55.0 and dark_frac > 0.70
    return ("vein", True) if is_vein else ("print", False)


# ---------------------------------------------------------------------------
# inference
# ---------------------------------------------------------------------------
def _embed_enhanced(enhanced: np.ndarray) -> list[float]:
    model = load_model()
    t = torch.from_numpy(enhanced).float() / 255.0
    t = t.unsqueeze(0).repeat(3, 1, 1).unsqueeze(0).to(_device)  # (1,3,224,224)
    with torch.no_grad():
        emb = model(t)
    return emb.squeeze(0).cpu().tolist()


def _png_data_url(gray: np.ndarray) -> str:
    ok, buf = cv2.imencode(".png", gray)
    if not ok:
        return ""
    return "data:image/png;base64," + base64.b64encode(buf.tobytes()).decode()


def _decode_gray(b64: str) -> np.ndarray:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    raw = base64.b64decode(b64)
    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Could not decode image from base64 data.")
    return img


def analyze_from_base64(b64: str) -> dict:
    """
    Full analysis of a palm image:
      embedding (128-d), print/vein type, security flag, and the preprocessed
      'identity pattern' image for the UI.
    """
    gray = _decode_gray(b64)
    image_type, secure = classify_image_type(gray)
    roi, enhanced = _preprocess_gray(gray)
    embedding = _embed_enhanced(enhanced)
    return {
        "embedding": embedding,
        "dim": len(embedding),
        "image_type": image_type,
        "secure": secure,
        "pattern": _png_data_url(enhanced),  # final identity pattern
        "roi": _png_data_url(roi),           # cropped palm ROI (pre-enhancement)
    }


# Back-compat: simple embedding only.
def embed_from_base64(b64: str) -> list[float]:
    gray = _decode_gray(b64)
    _, enhanced = _preprocess_gray(gray)
    return _embed_enhanced(enhanced)


def model_status() -> dict:
    loaded = _model is not None
    pth = MODEL_PATH.with_suffix(".pth")
    meta: dict = {}
    if pth.exists():
        try:
            data = torch.load(str(pth), map_location="cpu", weights_only=True)
            meta = {
                "val_acc": round(float(data.get("val_acc", 0)) * 100, 2),
                "test_acc": round(float(data.get("test_acc", 0)) * 100, 2),
                "embed_dim": int(data.get("embed_dim", 128)),
            }
        except Exception:
            pass
    return {
        "model_loaded": loaded,
        "model_path": str(MODEL_PATH),
        "model_exists": MODEL_PATH.exists(),
        "device": str(_device) if _device else ("cuda" if torch.cuda.is_available() else "cpu"),
        **meta,
    }
