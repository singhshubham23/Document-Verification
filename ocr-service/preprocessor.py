"""
preprocessor.py
OpenCV-based image preprocessing pipeline to enhance OCR accuracy.
"""

import cv2
import numpy as np
from pathlib import Path


def preprocess_image(image_path: str) -> np.ndarray:
    """
    Full preprocessing pipeline:
    1. Load and convert to grayscale
    2. Denoise
    3. Deskew (rotate to straighten text)
    4. Adaptive threshold (binarization)
    5. Remove borders / noise
    Returns a clean numpy array ready for Tesseract.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot read image: {image_path}")

    # ── 1. Grayscale ──────────────────────────────────────
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ── 2. Denoise ────────────────────────────────────────
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # ── 3. Deskew ─────────────────────────────────────────
    deskewed = _deskew(denoised)

    # ── 4. Adaptive threshold ─────────────────────────────
    binary = cv2.adaptiveThreshold(
        deskewed,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=10,
    )

    # ── 5. Morphological cleanup ──────────────────────────
    kernel = np.ones((1, 1), np.uint8)
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    return cleaned


def _deskew(image: np.ndarray) -> np.ndarray:
    """Detect skew angle and rotate to correct it."""
    coords = np.column_stack(np.where(image > 0))
    if len(coords) < 10:
        return image

    angle = cv2.minAreaRect(coords)[-1]

    # cv2 minAreaRect returns angles in [-90, 0)
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    # Only correct if skew is significant
    if abs(angle) < 0.5:
        return image

    h, w = image.shape
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
    )
    return rotated


def pdf_to_images(pdf_path: str) -> list:
    """
    Convert each page of a PDF to a preprocessed image.
    Requires pdf2image + poppler.
    """
    from pdf2image import convert_from_path
    import tempfile

    pages = convert_from_path(pdf_path, dpi=300)
    images = []
    for page in pages:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            page.save(tmp.name, "PNG")
            processed = preprocess_image(tmp.name)
            images.append(processed)
    return images