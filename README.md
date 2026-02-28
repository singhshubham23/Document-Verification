# 🛡️ HealBharat — Academic Certificate Verification System

<div align="center">

![HealBharat Banner](https://img.shields.io/badge/HealBharat-Certificate%20Validator-34d399?style=for-the-badge&logo=shield&logoColor=white)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat-square&logo=solidity&logoColor=white)](https://soliditylang.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**Instantly verify academic certificates using OCR + AI Anomaly Detection + Blockchain Immutability**

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Docs](#-api-reference) · [Blockchain Setup](#-blockchain-setup)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [How It Works](#-how-it-works)
- [API Reference](#-api-reference)
- [Blockchain Setup](#-blockchain-setup)
- [OCR Service](#-ocr-service)
- [User Roles](#-user-roles)
- [Common Issues](#-common-issues)

---

## 🎯 About the Project

**HealBharat** is a full-stack academic certificate verification platform built for employers, institutions, and government agencies to instantly authenticate educational certificates.

The system combines three independent verification layers:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **OCR** | Tesseract + OpenCV | Extract data from certificate images/PDFs |
| **AI Anomaly Detection** | Node.js Engine | Cross-check data, flag inconsistencies |
| **Blockchain** | Polygon + Solidity | Immutable hash storage — tamper-proof |

Fraudulent certificates are automatically detected, logged, and reported to administrators in real time via email alerts.

---

## ✨ Features

### Verifiers (Employers / Agencies)
- Verify certificates by **Certificate ID**, **file upload (OCR)**, or **QR code scan**
- View confidence score and anomaly breakdown for every verification
- Full verification history with timestamps
- Manually report suspicious certificates

### Institutions
- Upload certificates individually or **bulk upload via JSON**
- Auto-generated **QR codes** for every certificate
- Revoke certificates with reason + audit trail
- Search, filter, and paginate all issued certificates

### Admins
- Live dashboard — stats, fraud trend chart, verification breakdown pie chart
- Manage users — enable/disable accounts
- Blacklist fraudulent institutions
- Review and action fraud reports (confirm / dismiss)
- Full audit logs of every verification event

### System
- JWT authentication + OTP email verification on registration
- Role-based access control (verifier / institution / admin)
- Rate limiting (100 req / 45 min per IP) + Helmet.js security headers
- Input validation on every API endpoint (express-validator)
- Docker Compose — spin up all 4 services with one command

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     React Frontend                        │
│           Verifier / Institution / Admin UI               │
└───────────────────────┬──────────────────────────────────┘
                        │  REST API (JWT)
┌───────────────────────▼──────────────────────────────────┐
│                Node.js / Express API                      │
│      Auth · Certificates · Verification · Admin           │
└─────┬───────────────────┬──────────────────┬─────────────┘
      │                   │                  │
┌─────▼──────┐  ┌─────────▼──────┐  ┌───────▼────────┐
│  MongoDB   │  │  Python OCR    │  │ Polygon Chain  │
│            │  │  FastAPI +     │  │ Smart Contract │
│  Database  │  │  Tesseract +   │  │ (Hash Store)   │
│            │  │  OpenCV        │  │                │
└────────────┘  └────────────────┘  └────────────────┘
```

### Verification Flow

```
Input (ID / File / QR)
        │
        ├─[File]──→ OCR Service → Extract fields
        │
        ▼
   Database Lookup
        │
        ▼
   Anomaly Detection
   ├── Revoked?              → HIGH
   ├── Duplicate?            → HIGH
   ├── Blockchain mismatch?  → CRITICAL
   ├── Name mismatch (OCR)?  → HIGH
   └── Roll no mismatch?     → HIGH
        │
        ▼
   Confidence Score = 100 - (anomalies × 20) - (critical × 15)
        │
        ▼
   Result: valid / suspicious / fake / not_found
        │
        ├── Save VerificationLog
        ├── Update certificate status
        └── [fake/suspicious] → FraudReport + Email Alert
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Tailwind CSS, Recharts, Axios |
| Backend | Node.js 18, Express.js, Mongoose ODM, JWT, Multer |
| Database | MongoDB 7 |
| OCR Service | Python 3.11, FastAPI, Tesseract OCR, OpenCV, pdf2image |
| Blockchain | Solidity 0.8.20, Hardhat, Ethers.js v6, Polygon |
| Validation | express-validator |
| Email | Nodemailer (Gmail SMTP) |
| QR Codes | qrcode (npm) |
| DevOps | Docker, Docker Compose |

---

## 📁 Folder Structure

```
healbharat/
│
├── 📂 backend/                       # Node.js + Express REST API
│   ├── 📂 controllers/
│   │   ├── AdminController.js        # Stats, user/institution management
│   │   ├── AuthController.js         # Register, OTP, login, password reset
│   │   ├── CertificateController.js  # Upload, bulk, revoke, QR generation
│   │   ├── InstitutionController.js  # CRUD, API key management
│   │   └── VerificationController.js # Core verification engine
│   │
│   ├── 📂 middleware/
│   │   ├── AuthMiddleware.js         # JWT protect + role authorize
│   │   ├── UploadMiddleware.js       # Multer file upload config
│   │   └── ValidationMiddleware.js  # Input validation for all routes
│   │
│   ├── 📂 models/
│   │   ├── UserModel.js              # Users with roles
│   │   ├── InstitutionModel.js       # Institution registry
│   │   ├── CertificateModel.js       # Certificate records + hash + QR
│   │   ├── VerificationlogModel.js   # Verification attempt logs
│   │   └── FraudReport.js            # Fraud reports (auto + manual)
│   │
│   ├── 📂 routes/
│   │   ├── AuthRoutes.js
│   │   ├── CertificateRoutes.js
│   │   ├── VerificationRoutes.js
│   │   ├── AdminRoutes.js
│   │   └── institutionRoutes.js      # Institutions + fraud reports
│   │
│   ├── 📂 utils/
│   │   ├── BlockchainUtil.js         # Store/verify on Polygon
│   │   ├── CryptoUtil.js             # SHA-256 certificate hashing
│   │   ├── EmailUtil.js              # Nodemailer SMTP
│   │   ├── NotificationsUtil.js      # Fraud alerts + verification emails
│   │   ├── OcrUtil.js                # Calls Python OCR service
│   │   └── QrUtil.js                 # QR code generation
│   │
│   ├── server.js                     # Express app entry point
│   ├── db.js                         # MongoDB connection
│   ├── .env.example                  # Environment variable template ← copy this
│   └── package.json
│
├── 📂 ocr-service/                   # Python FastAPI OCR Microservice
│   ├── main.py                       # FastAPI app — POST /extract endpoint
│   ├── preprocessor.py               # OpenCV pipeline (denoise, deskew, threshold)
│   ├── extractor.py                  # Tesseract + regex field parser
│   ├── requirements.txt
│   └── Dockerfile
│
├── 📂 blockchain/                    # Solidity Smart Contract
│   ├── 📂 contracts/
│   │   └── CertificateValidator.sol  # On-chain certificate hash registry
│   ├── 📂 scripts/
│   │   └── deploy.js                 # Hardhat deployment script
│   ├── 📂 test/
│   │   └── CertificateValidator.test.js # 11 contract unit tests
│   ├── hardhat.config.js             # Networks: local / amoy / polygon / sepolia
│   └── package.json
│
├── 📂 frontend/                      # React.js Web Portal
│   ├── 📂 public/
│   │   ├── index.html
│   │   └── manifest.json
│   │
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── Layout.jsx            # Auth wrapper + sidebar layout
│   │   │   ├── Sidebar.jsx           # Role-aware navigation
│   │   │   └── UI.jsx                # Design system components
│   │   │
│   │   ├── 📂 context/
│   │   │   └── AuthContext.jsx       # Global auth state
│   │   │
│   │   ├── 📂 pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx          # Register + OTP step
│   │   │   ├── VerifyPage.jsx        # Verify by ID / upload / QR
│   │   │   ├── HistoryPage.jsx       # Verification history
│   │   │   ├── FraudReportPage.jsx   # Report + view fraud
│   │   │   ├── InstitutionDashboard.jsx
│   │   │   ├── AdminDashboard.jsx    # Stats + charts
│   │   │   ├── AdminInstitutions.jsx
│   │   │   ├── AdminLogs.jsx         # Audit logs
│   │   │   └── AdminPages.jsx        # Users + Fraud management
│   │   │
│   │   ├── 📂 utils/
│   │   │   └── api.js                # Axios + all API calls
│   │   │
│   │   ├── App.jsx                   # Routes + role guards
│   │   ├── index.js
│   │   └── index.css                 # Tailwind + design tokens
│   │
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
│
└── docker-compose.yml                # Run all 4 services at once
```

---

## 🚀 Quick Start

### Option A — Docker (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/healbharat.git
cd healbharat

# 2. Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env — see Environment Variables section below

# 3. Start everything
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| OCR Service | http://localhost:8000 |
| MongoDB | mongodb://localhost:27017 |

---

### Option B — Manual Setup

**Prerequisites:** Node.js 18+, Python 3.11+, MongoDB, Tesseract OCR

#### Step 1 — Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in .env (see below)
npm run dev
```

#### Step 2 — OCR Service
```bash
# Ubuntu/Debian — install system deps
sudo apt-get install -y tesseract-ocr tesseract-ocr-eng poppler-utils libgl1-mesa-glx

# macOS
brew install tesseract poppler

# Start service
cd ocr-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Step 3 — Blockchain (local)
```bash
cd blockchain
npm install

# Terminal 1 — local blockchain
npx hardhat node

# Terminal 2 — deploy
npx hardhat run scripts/deploy.js --network localhost
# → Copy CONTRACT_ADDRESS into backend/.env
```

#### Step 4 — Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

---

## 🔧 Environment Variables

### `backend/.env`

```env
# ─── Server ──────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# ─── MongoDB ─────────────────────────────────────────────
# Local MongoDB
MONGO_URI=mongodb://localhost:27017/healbharat
# OR MongoDB Atlas (free tier available at mongodb.com/atlas)
# MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/healbharat

# ─── JWT ─────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_super_secret_key_min_32_characters_long
JWT_EXPIRES_IN=7d

# ─── Email (Gmail SMTP) ───────────────────────────────────
# Use an App Password — NOT your real Gmail password
# Create at: myaccount.google.com → Security → 2FA → App Passwords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=xxxx_xxxx_xxxx_xxxx

# ─── File Uploads ────────────────────────────────────────
UPLOAD_PATH=./uploads
MAX_FILE_SIZE_MB=10

# ─── OCR Microservice ────────────────────────────────────
OCR_SERVICE_URL=http://localhost:8000

# ─── Blockchain ──────────────────────────────────────────
# Local Hardhat (for development/testing):
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0xPasteAddressFromDeployScript

# Polygon Amoy Testnet (free — recommended for staging):
# BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
# BLOCKCHAIN_PRIVATE_KEY=0xYourMetaMaskExportedPrivateKey
# CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Where to get each value

| Variable | Source | Cost |
|----------|--------|------|
| `MONGO_URI` | [MongoDB Atlas](https://www.mongodb.com/atlas) or local install | Free |
| `JWT_SECRET` | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Free |
| `EMAIL_PASS` | Google Account → Security → App Passwords | Free |
| `BLOCKCHAIN_RPC_URL` | [Alchemy](https://alchemy.com) or public RPC | Free |
| `BLOCKCHAIN_PRIVATE_KEY` | MetaMask → Account Details → Export Private Key | Free |
| `CONTRACT_ADDRESS` | Run `npx hardhat run scripts/deploy.js --network amoy` | Free |

> ⚠️ **Never commit `.env` to GitHub.** Add it to `.gitignore`.

---

## ⚙️ How It Works

### Certificate Registration

```
Institution fills upload form
        ↓
Backend generates SHA-256 hash of certificate data
        ↓
Checks for duplicates using hash
        ↓
Generates QR code → { certificateId, hash }
        ↓
Stores hash on Polygon blockchain (background, non-blocking)
        ↓
Saves to MongoDB with blockchainTxnId
```

### Anomaly Scoring

| Anomaly | Severity | Score Impact |
|---------|----------|-------------|
| `not_found` | Critical | -35 |
| `blockchain_mismatch` | Critical | -35 |
| `revoked_certificate` | High | -20 |
| `duplicate_submission` | High | -20 |
| `name_mismatch` | High | -20 |
| `roll_mismatch` | High | -20 |

**Formula:** `Confidence = 100 - (anomalies × 20) - (critical_count × 15)`

**Result rules:**
- `valid` → 0 anomalies
- `suspicious` → 1 anomaly
- `fake` → 2+ high/critical anomalies
- `not_found` → certificate doesn't exist

---

## 📡 API Reference

### Auth

| Method | Endpoint | Body | Access |
|--------|----------|------|--------|
| POST | `/api/auth/register` | `{name, email, password, role}` | Public |
| POST | `/api/auth/verify-otp` | `{userId, otp}` | Public |
| POST | `/api/auth/login` | `{email, password}` | Public |
| GET | `/api/auth/me` | — | JWT |
| POST | `/api/auth/forgot-password` | `{email}` | Public |
| POST | `/api/auth/reset-password` | `{email, otp, newPassword}` | Public |

### Verification

| Method | Endpoint | Body | Access |
|--------|----------|------|--------|
| POST | `/api/verification/by-id` | `{certificateId}` | JWT |
| POST | `/api/verification/by-upload` | `form-data: file` | JWT |
| POST | `/api/verification/by-qr` | `{qrPayload}` | JWT |
| GET | `/api/verification/history` | `?page&limit` | JWT |

### Certificates

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/certificates` | Institution |
| POST | `/api/certificates/bulk` | Institution |
| GET | `/api/certificates` | Institution, Admin |
| GET | `/api/certificates/:id` | JWT |
| PATCH | `/api/certificates/:id/revoke` | Institution, Admin |

### Admin

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id/toggle` | Admin |
| PATCH | `/api/admin/institutions/:id/blacklist` | Admin |
| GET | `/api/admin/fraud` | Admin |
| PATCH | `/api/admin/fraud/:id` | Admin |
| GET | `/api/admin/logs` | Admin |

---

## ⛓️ Blockchain Setup

### Run Tests (No wallet needed)

```bash
cd blockchain
npm install
npx hardhat test

# Expected output:
# CertificateValidator
#   ✔ owner is authorized by default
#   ✔ admin can authorize an institution
#   ✔ unauthorized address cannot store certificates
#   ✔ owner can store a certificate
#   ✔ cannot store the same certId twice
#   ✔ rejects hash that is not 64 chars
#   ✔ verifyCertificate returns isValid=true for stored cert
#   ✔ validateHash returns true for correct hash
#   ✔ validateHash returns false for wrong hash
#   ✔ owner can revoke a certificate
#   ✔ cannot revoke an already revoked certificate
#   11 passing
```

### Deploy to Testnet (Free)

```bash
# 1. Get free test MATIC
#    → https://faucet.polygon.technology → Polygon Amoy → paste your wallet address

# 2. Set in backend/.env:
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=0xYourMetaMaskPrivateKey

# 3. Deploy
cd blockchain
npx hardhat run scripts/deploy.js --network amoy

# 4. Copy output into backend/.env:
CONTRACT_ADDRESS=0xPastedFromOutput
```

---

## 🤖 OCR Service

**Test the service:**

```bash
# Health check
curl http://localhost:8000/health
# → {"status":"ok","service":"HealBharat OCR"}

# Extract from image
curl -X POST http://localhost:8000/extract \
  -F "file=@/path/to/certificate.jpg"
```

**Response:**

```json
{
  "studentName": "Shubham Kumar",
  "rollNumber": "CS2021001",
  "course": "B.Tech Computer Science",
  "institution": "XYZ University",
  "marks": "450/500",
  "certificateId": "CERT-AB12CD34",
  "issueDate": "15 June 2024",
  "rawText": "...",
  "confidence": 87.4
}
```

---

## 👤 User Roles

| Role | Capabilities |
|------|-------------|
| `verifier` | Verify certificates (ID/upload/QR), view history, report fraud |
| `institution` | Upload/manage/revoke certificates, verify, view history |
| `admin` | Full access — users, institutions, fraud reports, audit logs, stats |

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT** tokens with 7-day expiry
- **OTP email verification** on every new account
- **Rate limiting** — 100 requests / 45 min per IP
- **Helmet.js** — security headers (XSS, CSRF, etc.)
- **express-validator** — input sanitization on every route
- **SHA-256 hashing** — detect any tampering with certificate data
- **Blockchain immutability** — stored hashes cannot be modified

---

## 🐛 Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `MongoDB connection failed` | MongoDB not running | Run `mongod` locally or check Atlas URI |
| `OCR service unavailable` | Python service not started | Run `uvicorn main:app --port 8000` in `ocr-service/` |
| `Blockchain env vars not configured` | Missing `.env` values | Add all 3 blockchain vars to `backend/.env` |
| `private key too short` | Empty or short key in `.env` | Comment out the line or use the full 64-char Hardhat test key |
| `EMAIL authentication failed` | Wrong email password | Use Gmail App Password, not your account password |
| `Port already in use` | Another process on same port | Change `PORT=5001` in `.env` or kill the process |
| `Cannot find module` | Dependencies not installed | Run `npm install` in the relevant folder |

---

## 📄 License

Distributed under the MIT License.

---

<div align="center">

Made with ❤️ for **HealBharat Services**

**[⬆ Back to top](#️-healbharat--academic-certificate-verification-system)**

</div>