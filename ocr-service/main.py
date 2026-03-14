import os
import shutil
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from extractor import extract_from_file

app = FastAPI(title="HealBharat OCR Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {
    "image/jpeg", "image/jpg", "image/png",
    "application/pdf",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "HealBharat OCR"}


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    # Validate file type
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: jpg, png, pdf"
        )
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_TYPES and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported content type '{content_type}'. Allowed: jpg, png, pdf"
        )

    # Save to temp file preserving extension (pdf2image needs the .pdf extension)
    suffix = ext if ext else ".tmp"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        result = extract_from_file(tmp_path)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {str(e)}")

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
