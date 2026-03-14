import re
import pytesseract
from PIL import Image
from preprocessor import load_and_preprocess


# Tesseract config -- OEM 3 = LSTM, PSM 3 = fully automatic page segmentation
TESS_CONFIG = "--oem 3 --psm 3 -l eng"


def extract_from_file(file_path: str) -> dict:
    """
    Main entry point.
    Accepts image (jpg/png) or PDF path.
    Returns structured dict of extracted certificate fields.
    """
    pages = load_and_preprocess(file_path)

    # Combine text from all pages
    full_text = ""
    total_conf = 0.0
    page_count = 0

    for page_img in pages:
        text = pytesseract.image_to_string(page_img, config=TESS_CONFIG)
        full_text += text + "\n"

        # Get per-word confidence
        data = pytesseract.image_to_data(
            page_img, config=TESS_CONFIG,
            output_type=pytesseract.Output.DICT
        )
        confs = [int(c) for c in data["conf"] if str(c).isdigit() and int(c) >= 0]
        if confs:
            total_conf += sum(confs) / len(confs)
            page_count += 1

    confidence = round(total_conf / page_count, 2) if page_count > 0 else 0.0

    # Parse fields from combined text
    result = _parse_fields(full_text)
    result["rawText"] = full_text.strip()
    result["confidence"] = confidence

    return result


def _parse_fields(text: str) -> dict:
    """Extract structured fields from raw OCR text using regex."""
    return {
        "studentName":   _extract_student_name(text),
        "rollNumber":    _extract_roll_number(text),
        "course":        _extract_course(text),
        "institution":   _extract_institution(text),
        "issueDate":     _extract_issue_date(text),
        "marks":         _extract_marks(text),
        "certificateId": _extract_certificate_id(text),
    }


# -- Field extractors --

def _extract_student_name(text: str):
    patterns = [
        # "certify that SHUBHAM KUMAR has" -- all caps name between certify and has
        r"certify\s+that\s+([A-Z][A-Z\s]{3,50})\s+has",
        # "Name: Shubham Kumar"
        r"(?:Student\s+)?Name\s*[:\-]\s*([A-Za-z][A-Za-z\s]{2,50}?)(?=\s+(?:Roll|Enrollment|Reg(?:istration)?|Certificate|ID)\b|\n|$)",
        # "Mr./Ms. Shubham Kumar"
        r"(?:Mr|Ms|Mrs|Dr)\.?\s+([A-Za-z][A-Za-z\s]{2,50})(?=\s+(?:Roll|Enrollment|Reg(?:istration)?|Certificate|ID)\b|\n|$)",
        # All-caps line that looks like a name (2-4 words)
        r"\n([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)\n",
    ]
    return _first_match(text, patterns)


def _extract_roll_number(text: str):
    patterns = [
        # Specific pattern (e.g., CS2021001) first
        r"\b([A-Z]{1,4}\d{4,8})\b",
        # Labels, but excluding common noises that OCR might misread as the value
        r"Roll\s*(?:No|Number|#)\.?\s*[:\-]?\s*(?!(?:Certificate|No|Enrollment)\b)([A-Z0-9]{4,20})",
        r"Enrollment\s*(?:No|Number)\.?\s*[:\-]?\s*([A-Z0-9]{6,20})",
        r"Reg(?:istration)?\s*(?:No|Number)\.?\s*[:\-]?\s*([A-Z0-9]{5,20})",
    ]
    return _first_match(text, patterns)


def _extract_course(text: str):
    patterns = [
        # "Bachelor of Technology (B.Tech) in Computer Science"
        r"(Bachelor\s+of\s+Technology[^\n]{0,80})",
        r"(Master\s+of\s+Technology[^\n]{0,80})",
        r"(Bachelor\s+of\s+(?:Science|Arts|Commerce|Engineering)[^\n]{0,80})",
        r"(Master\s+of\s+(?:Science|Arts|Business|Engineering)[^\n]{0,80})",
        r"(Doctor\s+of\s+Philosophy[^\n]{0,80})",
        # Abbreviations
        r"\b(B\.?\s*Tech[^\n]{0,60})",
        r"\b(M\.?\s*Tech[^\n]{0,60})",
        r"\b(B\.?\s*Sc[^\n]{0,40})",
        r"\b(MBA[^\n]{0,40})",
        r"\b(MCA[^\n]{0,40})",
        r"\b(BCA[^\n]{0,40})",
        # "degree of ..."
        r"degree\s+of\s+([^\n]{5,80})",
        r"programme\s+of\s+([^\n]{5,80})",
    ]
    return _first_match(text, patterns)


def _extract_institution(text: str):
    # Filter out lines that look like signatures (e.g., "Vice Chancellor", "Registrar")
    lines = text.split("\n")
    signature_words = ["Controller", "Registrar", "Chancellor", "Bear", "Rations"]
    filtered_lines = [line for line in lines if not any(word in line for word in signature_words)]
    filtered_text = "\n".join(filtered_lines)

    patterns = [
        r"([A-Z][A-Za-z\s]{5,60}(?:University|Institute|College|Academy|School)[A-Za-z\s]{0,30})",
        r"([A-Z][A-Za-z\s]{5,60}(?:UNIVERSITY|INSTITUTE|COLLEGE)[A-Za-z\s]{0,30})",
    ]
    # Try with filtered text first
    result = _first_match(filtered_text, patterns)
    if not result:
        result = _first_match(text, patterns)
    return result


def _extract_issue_date(text: str):
    patterns = [
        # "15th June 2025" or "15 June 2025"
        r"(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})",
        # "15/06/2025" or "15-06-2025"
        r"(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})",
        # "June 2025"
        r"((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})",
        # "2025-06-15"
        r"(\d{4}[\/\-]\d{2}[\/\-]\d{2})",
        r"(?:Awarded|Issued|Date)\s*(?:on|:)?\s*[:\-]?\s*([^\n]{5,30})",
    ]
    return _first_match(text, patterns)


def _extract_marks(text: str):
    patterns = [
        # "456 / 500" or "456/500"
        r"(?:Marks?\s*Obtained|Marks?)\s*[:\-]?\s*(\d+\s*[\/]\s*\d+)",
        r"(\d{2,4}\s*\/\s*\d{2,4})",
        # "Percentage: 91.20 %" or "91.20%"
        r"(?:Percentage|Percent)\s*[:\-]?\s*(\d+\.?\d*\s*%?)",
        r"(\d{2,3}\.\d{1,2}\s*%)",
        # "CGPA: 9.12 / 10"
        r"CGPA\s*[:\-]?\s*(\d+\.\d+\s*(?:\/\s*10)?)",
        r"Grade\s*[:\-]?\s*([A-Z][+\-]?)",
    ]
    return _first_match(text, patterns)


def _extract_certificate_id(text: str):
    patterns = [
        # Our format: CERT-AB12CD34
        r"\b(CERT[-\s][A-Z0-9]{6,12})\b",
        r"Certificate\s*(?:No|Number|ID|#)\.?\s*[:\-]?\s*([A-Z0-9\-]{6,20})",
        r"Cert(?:ificate)?\s*(?:No|ID)\.?\s*[:\-]?\s*([A-Z0-9\-]{6,20})",
        r"Serial\s*(?:No|Number)\.?\s*[:\-]?\s*([A-Z0-9\-]{6,20})",
        # Standalone code pattern
        r"\b([A-Z]{2,6}[-\/][A-Z0-9]{4,12})\b",
    ]
    return _first_match(text, patterns)


# -- Helper --

def _first_match(text: str, patterns: list):
    """Try each pattern, return first match stripped, or None."""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            value = match.group(1).strip()
            # Remove trailing punctuation/noise
            value = re.sub(r"[,;:\.\s]+$", "", value).strip()
            if len(value) >= 2:
                return value
    return None

