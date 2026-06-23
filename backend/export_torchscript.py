"""
One-shot helper: load the best raw weights from a previous training run
(palm_vein_model_raw.pth) and export them as TorchScript (palm_vein_model.pt)
for the FastAPI server. Useful when training succeeded but the TorchScript
save step crashed (or when re-exporting after small model code changes).

Run:
    python backend/export_torchscript.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import torch

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from train_model import PalmEmbedder, EMBED_DIM  # noqa: E402

RAW = HERE / "palm_vein_model_raw.pth"
OUT = HERE / "palm_vein_model.pt"


def main() -> None:
    if not RAW.exists():
        sys.exit(f"raw weights not found: {RAW} — train the model first.")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[export] device:        {device}")
    print(f"[export] loading:       {RAW.name}")

    blob = torch.load(str(RAW), map_location=device, weights_only=False)
    state = blob.get("state_dict", blob) if isinstance(blob, dict) else blob
    val_acc = blob.get("val_acc", None) if isinstance(blob, dict) else None
    test_acc = blob.get("test_acc", None) if isinstance(blob, dict) else None
    embed_dim = blob.get("embed_dim", EMBED_DIM) if isinstance(blob, dict) else EMBED_DIM

    model = PalmEmbedder(embed_dim=embed_dim).to(device)
    missing, unexpected = model.load_state_dict(state, strict=False)
    if missing or unexpected:
        print(f"[export] state_dict warnings: missing={len(missing)} unexpected={len(unexpected)}")
    model.eval()

    # Use jit.trace (works around the F.normalize int-vs-float scripting issue).
    example = torch.randn(1, 3, 224, 224, device=device)
    with torch.no_grad():
        scripted = torch.jit.trace(model, example)
        # Round-trip sanity check
        out = scripted(example)
        print(f"[export] embedding shape: {tuple(out.shape)}  norm={out.norm(dim=1).mean().item():.4f}")
    scripted.save(str(OUT))
    print(f"[export] saved TorchScript: {OUT}")
    if val_acc is not None:
        print(f"[export] val_acc:  {val_acc * 100:.2f}%")
    if test_acc is not None:
        print(f"[export] test_acc: {test_acc * 100:.2f}%")


if __name__ == "__main__":
    main()
