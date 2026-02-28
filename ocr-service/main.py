from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import shutil
import os
import tempfile

from extractor import extract_certificate_data
from preprocessor import preprocess_image

app = FastAPI(
    title="HealBharat OCR Service",
    description="Certificate data extraction using OCR and AI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "HealBharat OCR"}


@app.post("/extract")
async def extract(certificate: UploadFile = File(...)):
    """
    Accept a certificate image (JPG/PNG) or PDF.
    Returns extracted fields.
    """

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
    }

    # ✅ FIX: use certificate instead of file
    if certificate.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, PDF allowed."
        )

    # Save to temp file
    suffix = os.path.splitext(certificate.filename)[1] or ".png"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(certificate.file, tmp)
        tmp_path = tmp.name

    try:
        result = extract_certificate_data(tmp_path)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR failed: {str(e)}"
        )

    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)