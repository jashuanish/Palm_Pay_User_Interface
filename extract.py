import torch

print("Torch Version:", torch.__version__)
print("CUDA Available:", torch.cuda.is_available())

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))

import os

print(os.getcwd())

import os

for root, dirs, files in os.walk('/kaggle/input'):
    if dirs:
        print(root, dirs[:5])



import os
import cv2
import numpy as np
import pandas as pd

HAND_PATH = r"C:\Users\jashu\Downloads\dataset\Hand_Dataset"
VEIN_PATH = r"C:\Users\jashu\Downloads\dataset\Veins_Dataset"

import os

print("Hand subjects:", len(os.listdir(HAND_PATH)))
print("Vein subjects:", len(os.listdir(VEIN_PATH)))

subjects = sorted([
    s for s in os.listdir(HAND_PATH)
    if os.path.isdir(os.path.join(HAND_PATH, s))
])

print("Total Subjects:", len(subjects))

sizes = []

for subject in subjects:

    folder = os.path.join(HAND_PATH, subject)

    for img_name in os.listdir(folder):

        path = os.path.join(folder, img_name)

        img = cv2.imread(path, 0)

        sizes.append(img.shape)

print(pd.Series(sizes).value_counts())

import cv2
import numpy as np
import matplotlib.pyplot as plt

sample_path = f"{HAND_PATH}/s1/1.bmp"

img = cv2.imread(
    sample_path,
    cv2.IMREAD_GRAYSCALE
)

print("Shape:", img.shape)

plt.figure(figsize=(8,6))
plt.imshow(img,cmap='gray')
plt.title("Original Image")
plt.axis('off')
plt.show()

def segment_hand(img):

    blur = cv2.GaussianBlur(
        img,
        (5,5),
        0
    )

    _, mask = cv2.threshold(
        blur,
        20,
        255,
        cv2.THRESH_BINARY
    )

    kernel = np.ones((5,5),np.uint8)

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        kernel
    )

    return mask

mask = segment_hand(img)

plt.figure(figsize=(8,6))
plt.imshow(mask,cmap='gray')
plt.title("Hand Mask")
plt.axis('off')
plt.show()

def get_largest_contour(mask):

    contours,_ = cv2.findContours(
        mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    largest = max(
        contours,
        key=cv2.contourArea
    )

    return largest

contour = get_largest_contour(mask)

rgb = cv2.cvtColor(
    img,
    cv2.COLOR_GRAY2RGB
)

cv2.drawContours(
    rgb,
    [contour],
    -1,
    (255,0,0),
    3
)

plt.figure(figsize=(8,6))
plt.imshow(rgb)
plt.title("Largest Hand Contour")
plt.axis('off')
plt.show()

def get_palm_center(contour):

    M = cv2.moments(contour)

    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])

    return cx,cy

cx,cy = get_palm_center(contour)

rgb = cv2.cvtColor(
    img,
    cv2.COLOR_GRAY2RGB
)

cv2.circle(
    rgb,
    (cx,cy),
    10,
    (255,0,0),
    -1
)

plt.figure(figsize=(8,6))
plt.imshow(rgb)
plt.title("Palm Center")
plt.axis('off')
plt.show()

def extract_palm_roi(img):

    mask = segment_hand(img)

    contour = get_largest_contour(mask)

    cx,cy = get_palm_center(contour)

    roi_size = 220

    x1 = max(cx - roi_size//2,0)
    y1 = max(cy - roi_size//2,0)

    x2 = min(cx + roi_size//2,img.shape[1])
    y2 = min(cy + roi_size//2,img.shape[0])

    roi = img[y1:y2,x1:x2]

    roi = cv2.resize(
        roi,
        (224,224)
    )

    return roi

roi = extract_palm_roi(img)

plt.figure(figsize=(6,6))
plt.imshow(
    roi,
    cmap='gray'
)

plt.title("Palm ROI")
plt.axis('off')
plt.show()

samples = [
    ("s1","1.bmp"),
    ("s10","1.bmp"),
    ("s20","1.bmp"),
    ("s30","1.bmp")
]

plt.figure(figsize=(12,12))

for i,(subject,image) in enumerate(samples):

    path = f"{HAND_PATH}/{subject}/{image}"

    img = cv2.imread(
        path,
        cv2.IMREAD_GRAYSCALE
    )

    roi = extract_palm_roi(img)

    plt.subplot(2,2,i+1)
    plt.imshow(roi,cmap='gray')
    plt.title(subject)
    plt.axis('off')

plt.tight_layout()
plt.show()

def denoise_image(img):

    denoised = cv2.medianBlur(
        img,
        5
    )

    return denoised

denoised = denoise_image(roi)

plt.figure(figsize=(6,6))

plt.imshow(
    denoised,
    cmap='gray'
)

plt.title(
    "Denoised ROI"
)

plt.axis('off')
plt.show()

def apply_clahe(img):

    clahe = cv2.createCLAHE(
        clipLimit=3.0,
        tileGridSize=(8,8)
    )

    enhanced = clahe.apply(img)

    return enhanced

clahe_img = apply_clahe(
    denoised
)

plt.figure(figsize=(6,6))

plt.imshow(
    clahe_img,
    cmap='gray'
)

plt.title(
    "CLAHE Enhanced"
)

plt.axis('off')
plt.show()

def gaussian_normalization(img):

    blur = cv2.GaussianBlur(
        img,
        (5,5),
        0
    )

    normalized = cv2.addWeighted(
        img,
        1.5,
        blur,
        -0.5,
        0
    )

    return normalized

gaussian_img = gaussian_normalization(
    clahe_img
)

plt.figure(figsize=(6,6))

plt.imshow(
    gaussian_img,
    cmap='gray'
)

plt.title(
    "Gaussian Normalized"
)

plt.axis('off')
plt.show()

def normalize_image(img):

    normalized = cv2.normalize(
        img,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    )

    return normalized.astype(
        np.uint8
    )

normalized_img = normalize_image(
    gaussian_img
)

plt.figure(figsize=(6,6))

plt.imshow(
    normalized_img,
    cmap='gray'
)

plt.title(
    "Intensity Normalized"
)

plt.axis('off')
plt.show()

def gamma_correction(
    image,
    gamma=1.5
):

    image = image / 255.0

    corrected = np.power(
        image,
        gamma
    )

    corrected = corrected * 255

    return corrected.astype(
        np.uint8
    )

enhanced_roi = gamma_correction(
    normalized_img,
    gamma=1.5
)

plt.figure(figsize=(6,6))

plt.imshow(
    enhanced_roi,
    cmap='gray'
)

plt.title(
    "Final Enhanced ROI"
)

plt.axis('off')
plt.show()

plt.figure(figsize=(18,5))

plt.subplot(1,5,1)
plt.imshow(
    roi,
    cmap='gray'
)
plt.title("ROI")
plt.axis('off')

plt.subplot(1,5,2)
plt.imshow(
    denoised,
    cmap='gray'
)
plt.title("Denoised")
plt.axis('off')

plt.subplot(1,5,3)
plt.imshow(
    clahe_img,
    cmap='gray'
)
plt.title("CLAHE")
plt.axis('off')

plt.subplot(1,5,4)
plt.imshow(
    gaussian_img,
    cmap='gray'
)
plt.title("Gaussian")
plt.axis('off')

plt.subplot(1,5,5)
plt.imshow(
    enhanced_roi,
    cmap='gray'
)
plt.title("Enhanced ROI")
plt.axis('off')

plt.tight_layout()
plt.show()

final_roi = enhanced_roi

print(
    "Final ROI Shape:",
    final_roi.shape
)

import os
import cv2
import numpy as np
import pandas as pd
from tqdm import tqdm

pairs = []

subjects = sorted(
    [
        s for s in os.listdir(HAND_PATH)
        if os.path.isdir(
            os.path.join(HAND_PATH,s)
        )
    ]
)

for subject in subjects:

    hand_subject = os.path.join(
        HAND_PATH,
        subject
    )

    vein_subject = os.path.join(
        VEIN_PATH,
        subject
    )

    images = sorted(
        [
            f for f in os.listdir(hand_subject)
            if f.endswith(".bmp")
        ]
    )

    for img_name in images:

        image_path = os.path.join(
            hand_subject,
            img_name
        )

        mask_path = os.path.join(
            vein_subject,
            img_name
        )

        if os.path.exists(mask_path):

            pairs.append(
                [
                    subject,
                    image_path,
                    mask_path
                ]
            )

df = pd.DataFrame(
    pairs,
    columns=[
        "subject",
        "image_path",
        "mask_path"
    ]
)

print(df.shape)

df.head()

print(df.iloc[0]["image_path"])

print(df.iloc[0]["mask_path"])

subjects = sorted(
    df.subject.unique()
)

train_subjects = subjects[:42]

val_subjects = subjects[42:51]

test_subjects = subjects[51:]

train_df = df[
    df.subject.isin(
        train_subjects
    )
]

val_df = df[
    df.subject.isin(
        val_subjects
    )
]

test_df = df[
    df.subject.isin(
        test_subjects
    )
]

print(
    len(train_df),
    len(val_df),
    len(test_df)
)

print(
    "Train Subjects:",
    len(train_subjects)
)

print(
    "Val Subjects:",
    len(val_subjects)
)

print(
    "Test Subjects:",
    len(test_subjects)
)

def preprocess_image(img):

    roi = extract_palm_roi(img)

    denoised = denoise_image(
        roi
    )

    clahe_img = apply_clahe(
        denoised
    )

    gaussian_img = gaussian_normalization(
        clahe_img
    )

    normalized_img = normalize_image(
        gaussian_img
    )

    enhanced_roi = gamma_correction(
        normalized_img,
        gamma=1.5
    )

    return enhanced_roi

sample_img = cv2.imread(
    train_df.iloc[0]["image_path"],
    cv2.IMREAD_GRAYSCALE
)

processed = preprocess_image(
    sample_img
)

plt.figure(figsize=(10,5))

plt.subplot(1,2,1)
plt.imshow(
    sample_img,
    cmap='gray'
)
plt.title("Original")

plt.subplot(1,2,2)
plt.imshow(
    processed,
    cmap='gray'
)
plt.title("Processed")

plt.show()

mask = cv2.imread(
    train_df.iloc[0]["mask_path"],
    cv2.IMREAD_GRAYSCALE
)

mask = cv2.resize(
    mask,
    (224,224)
)

plt.figure(figsize=(6,6))

plt.imshow(
    mask,
    cmap='gray'
)

plt.title(
    "Ground Truth Mask"
)

plt.axis('off')
plt.show()

plt.figure(figsize=(12,5))

plt.subplot(1,2,1)
plt.imshow(
    processed,
    cmap='gray'
)
plt.title(
    "Enhanced ROI"
)

plt.subplot(1,2,2)
plt.imshow(
    mask,
    cmap='gray'
)
plt.title(
    "Ground Truth Vein Mask"
)

plt.show()

import os

BASE_PATH = r"C:\Users\jashu\Downloads\dataset"

print(os.listdir(BASE_PATH))

import os

for root, dirs, files in os.walk(BASE_PATH):
    print(root)
    print("Folders:", dirs[:5])
    print("Files:", files[:5])
    print("-"*50)

    if root.count(os.sep) > BASE_PATH.count(os.sep) + 2:
        break

