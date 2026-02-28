"""
extractor.py
Core extraction logic: OCR + regex/NLP parsing to pull structured
certificate fields from raw text.
"""

import re
import pytesseract
import cv2
import numpy as np
from pathlib import Path
from preprocessor import preprocess_image, pdf_to_images
from typing import Optional


# ── Tesseract config ──────────────────────────────────────────────────────────
TESS_CONFIG = "--oem 3 --psm 6 -l eng"


def extract_certificate_data(file_path: str) -> dict:
    """
    Main entry point. Handles both images and PDFs.
    Returns:
        {
          studentName, rollNumber, course, institution,
          marks, certificateId, issueDate,
          rawText, confidence
        }
    """
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        images = pdf_to_images(file_path)
        raw_texts = [pytesseract.image_to_string(img, config=TESS_CONFIG) for img in images]
        raw_text = "\n".join(raw_texts)
        # Use first page image for confidence
        conf_img = images[0] if images else None
    else:
        processed = preprocess_image(file_path)
        raw_text = pytesseract.image_to_string(processed, config=TESS_CONFIG)
        conf_img = processed

    # Calculate confidence score
    confidence = _get_confidence(conf_img) if conf_img is not None else 0.0

    parsed = _parse_fields(raw_text)
    parsed["rawText"] = raw_text.strip()
    parsed["confidence"] = round(confidence, 2)

    return parsed


# ── Field parsers ─────────────────────────────────────────────────────────────

def _parse_fields(text: str) -> dict:
    return {
        "studentName": _extract_student_name(text),
        "rollNumber":  _extract_roll_number(text),
        "course":      _extract_course(text),
        "institution": _extract_institution(text),
        "marks":       _extract_marks(text),
        "certificateId": _extract_cert_id(text),
        "issueDate":   _extract_date(text),
    }


def _extract_student_name(text: str) -> Optional[str]:
    """
    Looks for patterns like:
      'This is to certify that [NAME]'
      'Name: John Doe'
      'Awarded to: JOHN DOE'
    """
    patterns = [
        r"(?:certify\s+that|awarded\s+to|presented\s+to|this\s+certifies\s+that)[:\s]+([A-Z][a-zA-Z\s]{3,50})",
        r"(?:student['\s]*name|name)[:\s]+([A-Z][a-zA-Z\s]{3,50})",
        r"(?:mr\.|ms\.|mrs\.)\s+([A-Z][a-zA-Z\s]{3,40})",
    ]
    return _first_match(text, patterns)


def _extract_roll_number(text: str) -> Optional[str]:
    patterns = [
        r"(?:roll\s*(?:no|number|num)[.:\s]+)([A-Z0-9]{4,20})",
        r"(?:enrollment\s*(?:no|number)[.:\s]+)([A-Z0-9]{4,20})",
        r"(?:reg(?:istration)?\s*(?:no|number)[.:\s]+)([A-Z0-9]{4,20})",
        r"\b([A-Z]{2,4}[0-9]{4,10})\b",  # e.g. CS2021001
    ]
    return _first_match(text, patterns, flags=re.IGNORECASE)


def _extract_course(text: str) -> Optional[str]:
    patterns = [
        r"(?:course|degree|program(?:me)?|awarded)[:\s]+([A-Za-z\s()]{5,60}?)(?:\n|in\s|\bwith\b)",
        r"\b(Bachelor[s']?\s+of\s+[A-Za-z\s]{3,40})\b",
        r"\b(Master[s']?\s+of\s+[A-Za-z\s]{3,40})\b",
        r"\b(Doctor\s+of\s+[A-Za-z\s]{3,40})\b",
        r"\b(B\.?Tech|M\.?Tech|B\.?Sc|M\.?Sc|MBA|BCA|MCA|B\.?E|M\.?E)\b",
    ]
    return _first_match(text, patterns, flags=re.IGNORECASE)


def _extract_institution(text: str) -> Optional[str]:
    patterns = [
        r"(?:university|institute|college|school|board)[:\s]+([A-Za-z\s,()]{5,80}?)(?:\n|,)",
        r"([A-Z][A-Za-z\s]{3,60}(?:University|Institute|College|Board|School))",
    ]
    return _first_match(text, patterns, flags=re.IGNORECASE)


def _extract_marks(text: str) -> Optional[str]:
    patterns = [
        r"(?:marks?\s*obtained|total\s*marks?|score)[:\s]+([0-9]{1,4}(?:\.[0-9]{1,2})?(?:\s*/\s*[0-9]{1,4})?)",
        r"(?:percentage|percent)[:\s]+([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*%?",
        r"(?:CGPA|GPA)[:\s]+([0-9]{1,2}(?:\.[0-9]{1,2})?)",
        r"(?:grade)[:\s]+([A-F][+-]?)",
    ]
    return _first_match(text, patterns, flags=re.IGNORECASE)


def _extract_cert_id(text: str) -> Optional[str]:
    patterns = [
        r"(?:certificate\s*(?:no|number|id)[.:\s]+)(CERT-[A-Z0-9]{6,12}|[A-Z0-9]{8,20})",
        r"\b(CERT-[A-Z0-9]{6,12})\b",
        r"(?:serial\s*(?:no|number)[.:\s]+)([A-Z0-9-]{6,20})",
    ]
    return _first_match(text, patterns, flags=re.IGNORECASE)


def _extract_date(text: str) -> Optional[str]:
    patterns = [
        r"(?:date[:\s]+|issued[:\s]+|dated[:\s]+)(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
        r"(?:date[:\s]+|issued[:\s]+|dated[:\s]+)(\d{1,2}\s+\w+\s+\d{4})",
        r"\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b",
        r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b",
    ]
    return _first_match(text, patterns, flags=re.IGNORECASE)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _first_match(text: str, patterns: list, flags=0) -> Optional[str]:
    for pattern in patterns:
        m = re.search(pattern, text, flags)
        if m:
            return m.group(1).strip()
    return None


def _get_confidence(image: np.ndarray) -> float:
    """Average word-level confidence from Tesseract."""
    try:
        data = pytesseract.image_to_data(
            image, config=TESS_CONFIG, output_type=pytesseract.Output.DICT
        )
        confs = [int(c) for c in data["conf"] if str(c).isdigit() and int(c) >= 0]
        return sum(confs) / len(confs) if confs else 0.0
    except Exception:
        return 0.0

    