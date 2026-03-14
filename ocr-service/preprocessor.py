import cv2
import numpy as np
from PIL import Image


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Full OpenCV preprocessing pipeline for OCR accuracy.
    Input:  PIL Image
    Output: cleaned PIL Image ready for Tesseract
    """
    # Convert PIL to OpenCV (BGR)
    img = np.array(image.convert("RGB"))
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    # Step 1 -- Upscale if too small (Tesseract needs ~300 DPI equivalent)
    h, w = img.shape[:2]
    if w < 2000:
        scale = 2000 / w
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # Step 2 -- Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Step 3 -- Denoise
    gray = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

    # Step 4 -- Deskew
    gray = _deskew(gray)

    # Step 5 -- Adaptive threshold (handles uneven lighting on photos)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 10
    )

    # Step 6 -- Morphological cleanup (remove noise dots)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    return Image.fromarray(thresh)


def _deskew(gray: np.ndarray) -> np.ndarray:
    """Correct skew up to 45 degrees."""
    coords = np.column_stack(np.where(gray < 128))
    if len(coords) < 10:
        return gray
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    if abs(angle) < 0.5:
        return gray
    h, w = gray.shape
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(gray, M, (w, h),
                          flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REPLICATE)


def pdf_to_images(pdf_path: str) -> list:
    """
    Convert PDF pages to preprocessed PIL Images at 300 DPI.
    300 DPI is critical -- lower DPI causes garbled OCR output.
    """
    try:
        from pdf2image import convert_from_path
    except ImportError:
        raise RuntimeError("pdf2image not installed. Run: pip install pdf2image")

    raw_pages = convert_from_path(
        pdf_path,
        dpi=300,          # DO NOT lower this -- causes garbled text
        fmt="png",
        thread_count=2,
    )

    return [preprocess_image(page) for page in raw_pages]


def load_and_preprocess(file_path: str) -> list:
    """
    Main entry point -- accepts image (jpg/png) or PDF.
    Returns list of preprocessed PIL Images.
    """
    lower = file_path.lower()

    if lower.endswith(".pdf"):
        return pdf_to_images(file_path)

    # Image file
    img = Image.open(file_path)
    if img.mode in ("RGBA", "P", "CMYK"):
        img = img.convert("RGB")
    return [preprocess_image(img)]

