# HealBharat Document Verification System - Complete Setup Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Blockchain Deployment](#blockchain-deployment)
6. [OCR Service Configuration](#ocr-service-configuration)
7. [Running the System](#running-the-system)
8. [API Endpoints](#api-endpoints)
9. [Testing & Validation](#testing--validation)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

```bash
# 1. Clone and navigate to project
cd Document-Verification

# 2. Install dependencies
npm run setup

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# 4. Deploy smart contract (if not done)
cd blockchain
npm run deploy:amoy
# Copy the CONTRACT_ADDRESS output to backend/.env

# 5. Start the backend
cd ../backend
npm start

# In another terminal, optionally start OCR service
cd ocr-service
python main.py
```

---

## 📁 Project Structure

```
Document-Verification/
├── backend/                 # Express API server
│   ├── controllers/         # Request handlers
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Auth, upload, validation
│   ├── utils/               # Utilities (OCR, Blockchain, Crypto, etc)
│   ├── scripts/             # Setup and test scripts
│   └── server.js            # Main server file
├── blockchain/              # Hardhat smart contracts
│   ├── contracts/           # Solidity contracts
│   ├── scripts/             # Deployment scripts
│   └── test/                # Contract tests
├── ocr-service/             # Python OCR service
│   ├── main.py              # FastAPI server
│   ├── extractor.py         # OCR extraction logic
│   ├── preprocessor.py      # Image preprocessing
│   └── requirements.txt      # Python dependencies
└── frontend/                # React frontend
    ├── src/
    └── package.json
```

---

## ✅ Prerequisites

### Required:

- **Node.js** v14+ (v16+ recommended)
- **Python 3.8+** (for OCR service)
- **MongoDB** 4.4+ (local or Atlas)
- **npm** or **yarn**

### Blockchain:

- Wallet with MATIC tokens on Polygon Amoy testnet
- Private key for contract deployment

### Python Libraries:

- pytesseract
- opencv-python-headless
- pdf2image
- FastAPI
- uvicorn

---

## 🔧 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Document-Verification
```

### Step 2: Run Automated Setup

```bash
cd backend
npm run setup
```

This script will:

- ✓ Check Node.js and Python versions
- ✓ Install all npm dependencies
- ✓ Install Python OCR dependencies
- ✓ Create `.env` file from `.env.example`
- ✓ Validate project structure

### Step 3: Configure Environment Variables

Create `backend/.env` based on `.env.example`:

```bash
# Database
MONGO_URI=mongodb://localhost:27017/healbharat

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# OCR Service
OCR_MODE=http              # 'http' or 'local'
OCR_SERVICE_URL=http://localhost:8000
PYTHON_PATH=python3

# Blockchain (fill after deployment)
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
CONTRACT_ADDRESS=0x...     # Get from deployment
BLOCKCHAIN_PRIVATE_KEY=0x... # Your wallet private key
```

---

## ⛓️ Blockchain Deployment

### Step 1: Configure Blockchain Environment

Create `blockchain/.env`:

```bash
PRIVATE_KEY=0x...          # Your wallet private key
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
```

### Step 2: Ensure You Have MATIC

You need Polygon Amoy testnet MATIC tokens:

1. Get your wallet address from MetaMask or ethers.js
2. Get free MATIC from: https://faucet.polygon.technology/
3. Verify balance: `npm run check-balance` (if available)

### Step 3: Deploy Smart Contract

```bash
cd blockchain

# Test compilation
npm run compile

# Deploy to Polygon Amoy Testnet
npm run deploy:amoy
```

**Expected Output:**

```
Deploying CertificateValidator with account: 0x...
Account balance: 1000000000000000000
CertificateValidator deployed to: 0x1234567890abcdef1234567890abcdef12345678
Add this to your .env:
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

### Step 4: Update Backend Configuration

Copy the `CONTRACT_ADDRESS` and update `backend/.env`:

```bash
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

---

## 🖼️ OCR Service Configuration

### Option A: HTTP Mode (Separate Service)

Best for production. Run OCR as a separate service:

```bash
# Terminal 1: Start OCR Service
cd ocr-service
pip install -r requirements.txt
python main.py

# Should output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Option B: Local Mode (Embedded)

Run OCR directly in Node.js using Python subprocess:

**In `backend/.env`:**

```bash
OCR_MODE=local
PYTHON_PATH=python3
OCR_SERVICE_PATH=../ocr-service
```

Benefits:

- Single service to run
- No inter-service communication overhead

Drawbacks:

- Requires Python on the server
- Less efficient than HTTP for parallel requests

### Troubleshooting OCR

```bash
# Test OCR HTTP health
curl http://localhost:8000/health

# Test backend OCR integration
curl http://localhost:5000/api/health/ocr

# Run OCR tests
cd backend
npm run ocr:test
```

---

## 🚀 Running the System

### Full Setup (3 Services)

**Terminal 1: MongoDB**

```bash
mongod
# or if using MongoDB Atlas, ensure MONGO_URI in .env is correct
```

**Terminal 2: OCR Service (Optional)**

```bash
cd ocr-service
python main.py
```

**Terminal 3: Backend API**

```bash
cd backend
npm start
```

**Terminal 4: Frontend (Optional)**

```bash
cd frontend
npm run dev
```

### Minimal Setup (Backend Only)

If using `OCR_MODE=local`:

**Terminal 1: Backend API**

```bash
cd backend
npm start
```

This will handle OCR calls internally using Python subprocess.

---

## 📡 API Endpoints

### Health Check

```
GET /api/health              # Full system status
GET /api/health/blockchain   # Blockchain only
GET /api/health/ocr          # OCR service only
```

### Testing

```
GET /api/test/blockchain     # Test blockchain integration
POST /api/test/ocr           # Test OCR service
```

### Certificate Management

```
POST /api/certificates                   # Upload certificate
GET /api/certificates                    # List certificates
GET /api/certificates/:id                # Get certificate
PATCH /api/certificates/:id/revoke       # Revoke certificate
POST /api/certificates/bulk              # Bulk upload
```

### Verification

```
POST /api/verification/by-id             # Verify by certificate ID
POST /api/verification/by-upload         # Verify by uploading image
POST /api/verification/by-qr             # Verify by QR code
GET /api/verification/history            # Get verification history
GET /api/verification/:logId             # Get verification details
```

---

## 🧪 Testing & Validation

### 1. Check System Health

```bash
# All services
curl http://localhost:5000/api/health

# Expected Response:
{
  "success": true,
  "message": "HealBharat API is running",
  "services": {
    "database": { "healthy": true },
    "blockchain": {
      "healthy": true,
      "network": "amoy",
      "chainId": 80002
    },
    "ocr": {
      "healthy": true,
      "mode": "http"
    }
  }
}
```

### 2. Test Blockchain Integration

```bash
curl http://localhost:5000/api/test/blockchain

# Expected Response:
{
  "success": true,
  "txnId": "0x...",
  "isValid": true,
  "message": "Blockchain integration working!"
}
```

### 3. Test OCR Service

```bash
curl -X POST http://localhost:5000/api/test/ocr

# Expected Response:
{
  "success": true,
  "mode": "http",
  "message": "OCR service is ready!"
}
```

### 4. Test Certificate Upload

```bash
curl -X POST http://localhost:5000/api/certificates \
  -H "Authorization: Bearer <token>" \
  -F "studentName=John Doe" \
  -F "rollNumber=2021001" \
  -F "course=B.Tech Computer Science" \
  -F "issueDate=2023-06-15" \
  -F "marks={\"obtained\":85,\"total\":100}"
```

---

## 🔧 Troubleshooting

### MongoDB Connection Failed

```
Error: Cannot connect to MongoDB
```

**Solution:**

```bash
# Ensure MongoDB is running
mongod

# Or update MONGO_URI in .env for Atlas:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/healbharat
```

### Blockchain Configuration Missing

```
Error: Blockchain env vars not configured
```

**Solution:**

1. Deploy smart contract: `cd blockchain && npm run deploy:amoy`
2. Copy CONTRACT_ADDRESS to `backend/.env`
3. Ensure BLOCKCHAIN_PRIVATE_KEY is set
4. Restart backend: `npm start`

### OCR Service Not Available

```
Error: OCR service unavailable
```

**Solution:**

```bash
# Check if running on correct port
curl http://localhost:8000/health

# Or switch to local mode in .env:
OCR_MODE=local

# Ensure Python dependencies installed:
pip install -r ocr-service/requirements.txt
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### Insufficient MATIC Tokens

```
Error: Insufficient balance for transaction
```

**Solution:**

1. Get free MATIC: https://faucet.polygon.technology/
2. Check balance: https://amoy.polygonscan.com/
3. Wait for transaction confirmation

---

## 📝 Environment Variables Reference

| Variable               | Example                              | Description                      |
| ---------------------- | ------------------------------------ | -------------------------------- |
| MONGO_URI              | mongodb://localhost:27017/healbharat | MongoDB connection string        |
| PORT                   | 5000                                 | Backend API port                 |
| JWT_SECRET             | your-secret                          | JWT signing secret               |
| OCR_MODE               | http                                 | OCR execution mode (http/local)  |
| OCR_SERVICE_URL        | http://localhost:8000                | OCR service endpoint             |
| BLOCKCHAIN_RPC_URL     | https://rpc-amoy.polygon.technology/ | Polygon RPC endpoint             |
| CONTRACT_ADDRESS       | 0x...                                | Deployed contract address        |
| BLOCKCHAIN_PRIVATE_KEY | 0x...                                | Wallet private key for contracts |

---

## 🔐 Security Notes

1. **Never commit private keys** - Use `.env` with `.gitignore`
2. **Use strong JWT_SECRET** - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Keep private keys safe** - Rotate regularly in production
4. **Enable HTTPS** - Use in production (nginx/Apache)
5. **Rate limiting** - Already configured in server.js

---

## 📞 Support

For issues or questions:

1. Check this guide's Troubleshooting section
2. Review API endpoint documentation
3. Check server logs: `NODE_ENV=development npm start`
4. Enable verbose logging: `VERBOSE_LOGGING=true`

---

## 🎯 Next Steps

1. **Configure frontend** - Update API endpoint in frontend/.env
2. **Test workflows** - Upload certificates and verify
3. **Deploy to production** - Use Docker and cloud services
4. **Monitor systems** - Set up logging and alerts
5. **Backup data** - Configure MongoDB backups

---

**Version:** 1.0.0  
**Last Updated:** March 2024  
**Maintainer:** HealBharat Team
