"""
train_model.py — Palm Vein Biometric Embedding Model Trainer

Architecture:
    MobileNetV2 backbone (grayscale input replicated to 3ch)
    + Global Average Pool
    + Projection head → 128-d L2-normalized embedding

Loss:
    Online Hard Triplet Loss (Hermans et al. 2017)
    Better than softmax for open-set biometric 1:N matching.

Dataset:
    Hand-Veins-Dataset — 60 subjects × 10 BMP images each.
    Split: subjects 1-42 train | 43-51 val | 52-60 test (same as notebook).

Output:
    backend/palm_vein_model.pt  (TorchScript, ready for FastAPI serving)
    backend/palm_vein_model_raw.pth (raw state_dict, for fine-tuning)
"""
from __future__ import annotations

import os
import random
import time
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import models
from torchvision.models import MobileNet_V2_Weights

# ─────────────────────────── CONFIGURATION ───────────────────────────────────

DATASET_ROOT = Path(r"C:\Users\jashu\Downloads\archive\Hand-Veins-Dataset\Hand_Dataset")
OUTPUT_DIR   = Path(__file__).parent        # backend/
MODEL_PT     = OUTPUT_DIR / "palm_vein_model.pt"
MODEL_PTH    = OUTPUT_DIR / "palm_vein_model_raw.pth"

IMAGE_SIZE  = 224
EMBED_DIM   = 128
BATCH_SIZE  = 32       # P subjects × K images per subject per batch
P_SUBJECTS  = 8        # subjects per batch  (P × K = batch)
K_IMAGES    = 4        # images per subject per batch
EPOCHS      = 60
LR          = 1e-3
LR_MIN      = 1e-5
PATIENCE    = 12       # early-stop patience
MARGIN      = 0.3      # triplet loss margin

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ─────────────────────────── PREPROCESSING ───────────────────────────────────

def extract_palm_roi(gray: np.ndarray, roi_size: int = 220, out: int = IMAGE_SIZE) -> np.ndarray:
    """Mirror of the notebook's ROI extractor + enhancement pipeline."""
    std = cv2.resize(gray, (640, 480), interpolation=cv2.INTER_AREA)
    blur = cv2.GaussianBlur(std, (5, 5), 0)
    _, mask = cv2.threshold(blur, 20, 255, cv2.THRESH_BINARY)
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cx, cy = 320, 240
    if contours:
        best = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(best)
        frame_area = 640 * 480
        coverage = area / frame_area
        if 0.06 < coverage < 0.97:
            M = cv2.moments(best)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])

    x1 = max(cx - roi_size // 2, 0)
    y1 = max(cy - roi_size // 2, 0)
    x2 = min(cx + roi_size // 2, 640)
    y2 = min(cy + roi_size // 2, 480)
    roi = std[y1:y2, x1:x2]
    roi = cv2.resize(roi, (out, out), interpolation=cv2.INTER_LINEAR)
    return roi


def full_preprocess(gray: np.ndarray) -> np.ndarray:
    """Complete preprocessing pipeline (identical to opencv-worker.js)."""
    roi   = extract_palm_roi(gray)
    d     = cv2.medianBlur(roi, 5)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    c     = clahe.apply(d)
    blur  = cv2.GaussianBlur(c, (5, 5), 0)
    g     = cv2.addWeighted(c, 1.5, blur, -0.5, 0)
    n     = cv2.normalize(g, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    gamma = 1.5
    lut   = np.array([min(255, int((i / 255.0) ** gamma * 255)) for i in range(256)], dtype=np.uint8)
    e     = cv2.LUT(n, lut)
    return e  # shape: (224, 224) uint8


# ─────────────────────────── DATASET ─────────────────────────────────────────

class PalmVeinDataset(Dataset):
    """Returns (image_tensor, subject_label) pairs."""

    def __init__(self, subject_dirs: List[Path], augment: bool = False):
        self.samples: List[Tuple[Path, int]] = []
        self.augment = augment
        for label, d in enumerate(sorted(subject_dirs)):
            for bmp in sorted(d.glob("*.bmp")):
                self.samples.append((bmp, label))
        self.n_classes = len(subject_dirs)

    def __len__(self) -> int:
        return len(self.samples)

    def _load(self, path: Path) -> np.ndarray:
        gray = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
        return full_preprocess(gray)

    def _augment(self, img: np.ndarray) -> np.ndarray:
        # Random horizontal flip
        if random.random() > 0.5:
            img = cv2.flip(img, 1)
        # Random rotation ±10°
        angle = random.uniform(-10, 10)
        M = cv2.getRotationMatrix2D((IMAGE_SIZE // 2, IMAGE_SIZE // 2), angle, 1.0)
        img = cv2.warpAffine(img, M, (IMAGE_SIZE, IMAGE_SIZE), borderMode=cv2.BORDER_REFLECT)
        # Brightness jitter ±15%
        factor = random.uniform(0.85, 1.15)
        img = np.clip(img.astype(np.float32) * factor, 0, 255).astype(np.uint8)
        return img

    def __getitem__(self, idx: int):
        path, label = self.samples[idx]
        img = self._load(path)
        if self.augment:
            img = self._augment(img)
        # Grayscale → 3-channel float32 tensor, normalized [0, 1]
        t = torch.from_numpy(img).float() / 255.0
        t = t.unsqueeze(0).repeat(3, 1, 1)  # (3, 224, 224)
        return t, label


class PKSampler(torch.utils.data.Sampler):
    """Samples P subjects × K images per batch for triplet mining."""

    def __init__(self, dataset: PalmVeinDataset, p: int, k: int):
        self.p, self.k = p, k
        # Build label → list of indices
        from collections import defaultdict
        self.label_to_indices: dict[int, list] = defaultdict(list)
        for idx, (_, lbl) in enumerate(dataset.samples):
            self.label_to_indices[lbl].append(idx)
        self.labels = list(self.label_to_indices.keys())

    def __iter__(self):
        while True:
            selected = random.sample(self.labels, min(self.p, len(self.labels)))
            batch = []
            for lbl in selected:
                indices = self.label_to_indices[lbl]
                chosen = random.choices(indices, k=self.k)
                batch.extend(chosen)
            yield from batch
            return  # one batch per call

    def __len__(self):
        return self.p * self.k


# ─────────────────────────── MODEL ───────────────────────────────────────────

class PalmEmbedder(nn.Module):
    """MobileNetV2 backbone + L2-normalized projection head."""

    def __init__(self, embed_dim: int = EMBED_DIM):
        super().__init__()
        base = models.mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V1)
        # Use ImageNet pre-trained features — domain adaptation via fine-tuning
        self.features = base.features  # outputs (B, 1280, 7, 7) for 224 input
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.head = nn.Sequential(
            nn.Flatten(),
            nn.Linear(1280, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, embed_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.pool(x)
        x = self.head(x)
        return F.normalize(x, p=2.0, dim=1)  # L2-normalize → unit sphere


# ─────────────────────────── LOSS ────────────────────────────────────────────

def online_hard_triplet_loss(
    embeddings: torch.Tensor,
    labels: torch.Tensor,
    margin: float = MARGIN,
) -> torch.Tensor:
    """
    Online Hard Triplet Mining (Hermans et al. 2017).
    For each anchor: pick hardest positive (furthest same-class) and
    hardest negative (closest different-class).
    """
    # Pairwise squared L2 distances
    pairwise = torch.cdist(embeddings, embeddings, p=2).pow(2)

    mask_pos = labels.unsqueeze(0) == labels.unsqueeze(1)  # (B, B)
    mask_neg = ~mask_pos

    # Hardest positive: largest distance among same-class pairs (exclude self)
    eye = torch.eye(embeddings.size(0), dtype=torch.bool, device=DEVICE)
    mask_pos = mask_pos & ~eye
    # Set non-positives to -inf before max
    pos_dist = pairwise.clone()
    pos_dist[~mask_pos] = -1e9
    hardest_pos = pos_dist.max(dim=1).values

    # Hardest negative: smallest distance among different-class pairs
    neg_dist = pairwise.clone()
    neg_dist[~mask_neg] = 1e9
    hardest_neg = neg_dist.min(dim=1).values

    loss = F.relu(hardest_pos - hardest_neg + margin)
    # Only average over valid anchors (those with at least one positive)
    valid = mask_pos.any(dim=1)
    if valid.sum() == 0:
        return loss.mean()
    return loss[valid].mean()


# ─────────────────────────── BATCH LOADER ────────────────────────────────────

def pk_loader(dataset: PalmVeinDataset, p: int, k: int, num_workers: int = 0):
    """Create a DataLoader that yields P*K batches."""
    from collections import defaultdict
    label_to_indices: dict[int, list] = defaultdict(list)
    for idx, (_, lbl) in enumerate(dataset.samples):
        label_to_indices[lbl].append(idx)
    labels = list(label_to_indices.keys())

    def collate():
        while True:
            selected = random.sample(labels, min(p, len(labels)))
            batch_imgs, batch_lbls = [], []
            for lbl in selected:
                indices = random.choices(label_to_indices[lbl], k=k)
                for i in indices:
                    img, l = dataset[i]
                    batch_imgs.append(img)
                    batch_lbls.append(l)
            yield torch.stack(batch_imgs), torch.tensor(batch_lbls)

    return collate


# ─────────────────────────── EVALUATION ──────────────────────────────────────

@torch.no_grad()
def rank1_accuracy(
    model: nn.Module,
    gallery_loader: DataLoader,
    probe_loader: DataLoader,
) -> float:
    """Compute Rank-1 recognition accuracy (gallery = first 5 images, probe = last 5)."""
    model.eval()

    # Build gallery
    g_embs, g_labels = [], []
    for imgs, lbls in gallery_loader:
        imgs = imgs.to(DEVICE)
        embs = model(imgs)
        g_embs.append(embs.cpu())
        g_labels.extend(lbls.tolist())
    G = torch.cat(g_embs, 0)   # (N, 128)
    gl = torch.tensor(g_labels)

    # Probe
    correct = 0
    total   = 0
    for imgs, lbls in probe_loader:
        imgs = imgs.to(DEVICE)
        embs = model(imgs).cpu()  # (B, 128)
        sims = embs @ G.T         # (B, N) cosine sim (both L2-normed)
        preds = gl[sims.argmax(dim=1)]
        correct += (preds == lbls).sum().item()
        total   += lbls.size(0)

    model.train()
    return correct / total if total > 0 else 0.0


# ─────────────────────────── TRAINING LOOP ───────────────────────────────────

def train():
    print(f"🚀 Device: {DEVICE}")
    if DEVICE.type == "cuda":
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print(f"   Dataset: {DATASET_ROOT}")

    # ── Discover subjects ──────────────────────────────────────────────────
    all_subjects = sorted([d for d in DATASET_ROOT.iterdir() if d.is_dir()])
    print(f"   Subjects found: {len(all_subjects)}")

    train_dirs = all_subjects[:42]
    val_dirs   = all_subjects[42:51]
    test_dirs  = all_subjects[51:]

    train_ds = PalmVeinDataset(train_dirs, augment=True)
    val_ds   = PalmVeinDataset(val_dirs,   augment=False)
    test_ds  = PalmVeinDataset(test_dirs,  augment=False)

    print(f"   Train: {len(train_ds)} imgs ({len(train_dirs)} subjects)")
    print(f"   Val:   {len(val_ds)} imgs ({len(val_dirs)} subjects)")
    print(f"   Test:  {len(test_ds)} imgs ({len(test_dirs)} subjects)")

    # For val/test rank-1: gallery = images 0-4, probe = images 5-9
    def split_gallery_probe(ds: PalmVeinDataset):
        from torch.utils.data import Subset
        gallery_idx = [i for i, (_, l) in enumerate(ds.samples) if i % 10 < 5]
        probe_idx   = [i for i, (_, l) in enumerate(ds.samples) if i % 10 >= 5]
        return (
            DataLoader(Subset(ds, gallery_idx), batch_size=32, shuffle=False),
            DataLoader(Subset(ds, probe_idx),   batch_size=32, shuffle=False),
        )

    val_gal,  val_prb  = split_gallery_probe(val_ds)
    test_gal, test_prb = split_gallery_probe(test_ds)

    # ── Model ─────────────────────────────────────────────────────────────
    model = PalmEmbedder(embed_dim=EMBED_DIM).to(DEVICE)

    optimizer = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=EPOCHS, eta_min=LR_MIN
    )

    get_batches = pk_loader(train_ds, P_SUBJECTS, K_IMAGES)

    # How many batches per epoch? Aim to see each image ~2x
    batches_per_epoch = max(1, (len(train_ds) * 2) // (P_SUBJECTS * K_IMAGES))

    best_val_acc = 0.0
    patience_cnt = 0
    best_state   = None

    print(f"\n{'='*60}")
    print(f" Training: {EPOCHS} epochs, {batches_per_epoch} batches/epoch")
    print(f" Batch: P={P_SUBJECTS} subjects × K={K_IMAGES} images = {P_SUBJECTS*K_IMAGES} samples")
    print(f"{'='*60}\n")

    gen = get_batches()  # generator
    for epoch in range(1, EPOCHS + 1):
        model.train()
        epoch_loss = 0.0
        t0 = time.time()

        for _ in range(batches_per_epoch):
            imgs, lbls = next(gen)
            imgs = imgs.to(DEVICE, non_blocking=True)
            lbls = lbls.to(DEVICE, non_blocking=True)

            optimizer.zero_grad()
            embs = model(imgs)
            loss = online_hard_triplet_loss(embs, lbls)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            epoch_loss += loss.item()

        scheduler.step()
        avg_loss = epoch_loss / batches_per_epoch
        elapsed  = time.time() - t0

        # Validate every 5 epochs
        if epoch % 5 == 0 or epoch == 1:
            val_acc = rank1_accuracy(model, val_gal, val_prb)
            marker  = " ★ BEST" if val_acc > best_val_acc else ""
            print(f"Epoch {epoch:3d}/{EPOCHS} | loss={avg_loss:.4f} | "
                  f"val_rank1={val_acc*100:.1f}% | {elapsed:.1f}s{marker}")

            if val_acc > best_val_acc:
                best_val_acc = val_acc
                best_state   = {k: v.cpu().clone() for k, v in model.state_dict().items()}
                patience_cnt = 0
            else:
                patience_cnt += 5
                if patience_cnt >= PATIENCE:
                    print(f"\n⚡ Early stop — no improvement for {PATIENCE} epochs.")
                    break
        else:
            print(f"Epoch {epoch:3d}/{EPOCHS} | loss={avg_loss:.4f} | {elapsed:.1f}s")

    # ── Restore best & evaluate on test ───────────────────────────────────
    if best_state:
        model.load_state_dict(best_state)
    test_acc = rank1_accuracy(model, test_gal, test_prb)
    print(f"\n✅ Test Rank-1 Accuracy: {test_acc*100:.2f}%")
    print(f"   Best Val Rank-1:      {best_val_acc*100:.2f}%")

    # ── Save ──────────────────────────────────────────────────────────────
    # Raw state dict (for future fine-tuning)
    torch.save({
        "state_dict": model.state_dict(),
        "embed_dim": EMBED_DIM,
        "val_acc": best_val_acc,
        "test_acc": test_acc,
    }, str(MODEL_PTH))
    print(f"\n💾 Saved raw weights: {MODEL_PTH}")

    # TorchScript (for FastAPI serving — no class definition needed at runtime)
    model.eval()
    scripted = torch.jit.script(model)
    scripted.save(str(MODEL_PT))
    print(f"💾 Saved TorchScript: {MODEL_PT}")

    print("\n🎉 Training complete!")
    return test_acc


if __name__ == "__main__":
    train()
