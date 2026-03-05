# 🚀 Quick Reference - OCR + Blockchain Integration

## 30-Second Overview

Your HealBharat system now has **fully integrated OCR + Blockchain**:

| Component         | Status        | How to Use                                       |
| ----------------- | ------------- | ------------------------------------------------ |
| **OCR Service**   | ✅ Integrated | Extracts data from certificate images/PDFs       |
| **Blockchain**    | ✅ Integrated | Stores certificate hashes on Polygon (immutable) |
| **Health Checks** | ✅ Added      | `GET /api/health` shows all service status       |
| **Setup Tool**    | ✅ Automated  | `npm run setup` installs everything              |

---

## 🎯 Get Running in 3 Steps

### Step 1: Setup

```bash
cd backend
npm run setup
```

### Step 2: Configure

```bash
cp .env.example .env
# Edit .env - Set MONGO_URI, OCR_MODE, blockchain vars
```

### Step 3: Run

```bash
npm start
```

✅ **Done!** API is at `http://localhost:5000`

---

## 📊 What Changed

### New Files Added

- `backend/utils/OcrService.js` - OCR integration wrapper
- `backend/scripts/setup.js` - Automated setup
- `backend/scripts/test-ocr.js` - OCR testing
- `ocr-service/extract_local.py` - Local OCR extraction
- `SETUP_GUIDE.md` - Complete guide
- `INTEGRATION_SUMMARY.md` - What was merged
- `blockchain/BLOCKCHAIN_SETUP.md` - Blockchain guide

### Files Updated

- `backend/utils/BlockchainUtil.js` - Enhanced with better error handling
- `backend/utils/OcrUtil.js` - Now uses OcrService wrapper
- `backend/server.js` - Added health check endpoints
- `backend/controllers/CertificateController.js` - Uses improved blockchain
- `backend/package.json` - Added setup scripts

---

## 🔧 Configuration

### Minimal (.env)

```bash
MONGO_URI=mongodb://localhost:27017/healbharat
PORT=5000
JWT_SECRET=your-secret-key
OCR_MODE=local
```

### Full (.env) with Blockchain

```bash
MONGO_URI=mongodb://localhost:27017/healbharat
PORT=5000
JWT_SECRET=your-secret-key

OCR_MODE=http                          # or 'local'
OCR_SERVICE_URL=http://localhost:8000

BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/
CONTRACT_ADDRESS=0x...          # Get from blockchain deployment
BLOCKCHAIN_PRIVATE_KEY=0x...     # Your wallet private key
```

See `backend/.env.example` for all options.

---

## 🧪 Test Everything

```bash
# Health check - see all services
curl http://localhost:5000/api/health

# Test OCR integration
curl -X POST http://localhost:5000/api/test/ocr

# Test Blockchain integration
curl http://localhost:5000/api/test/blockchain
```

---

## 🎛️ OCR Modes

### HTTP Mode (External Service)

```bash
# In .env:
OCR_MODE=http
OCR_SERVICE_URL=http://localhost:8000

# Start OCR service:
cd ocr-service && python main.py
```

### Local Mode (Embedded)

```bash
# In .env:
OCR_MODE=local

# No separate service needed - OCR runs in Python subprocess
```

---

## ⛓️ Blockchain Setup (One-time)

```bash
cd blockchain

# Create .env
cp .env.example .env
# Edit with your MetaMask private key

# Deploy to Polygon Amoy Testnet
npm run deploy:amoy

# Copy CONTRACT_ADDRESS output to backend/.env
```

Get free MATIC: https://faucet.polygon.technology/

---

## 📡 API Endpoints

### Health & Status

```
GET /api/health                 → Full system status
GET /api/health/blockchain      → Blockchain only
GET /api/health/ocr             → OCR service only
```

### Certificate Management

```
POST /api/certificates          → Upload certificate
GET  /api/certificates          → List certificates
PATCH /api/certificates/:id/revoke → Revoke certificate
```

### Verification (Main Feature)

```
POST /api/verification/by-id    → Verify by certificate ID
POST /api/verification/by-upload → Verify by uploading image (OCR)
POST /api/verification/by-qr    → Verify by QR scan
```

---

## 🔒 What's Protected

All protected. All routes except health checks need JWT token in header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🐛 Common Issues & Fixes

| Issue                       | Fix                                                                       |
| --------------------------- | ------------------------------------------------------------------------- |
| `Cannot connect to MongoDB` | Check MONGO_URI in .env, ensure MongoDB is running                        |
| `OCR service unavailable`   | If HTTP mode: start `ocr-service`. If local mode: ensure Python installed |
| `Blockchain auth failed`    | Ensure BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS set in .env               |
| `Port 5000 in use`          | Change PORT in .env or kill process: `lsof -i :5000`                      |

---

## 📚 Full Guides

- **Complete Setup**: See `SETUP_GUIDE.md`
- **Blockchain Details**: See `blockchain/BLOCKCHAIN_SETUP.md`
- **Integration Details**: See `INTEGRATION_SUMMARY.md`
- **API Reference**: See main `README.md`

---

## ✨ Key Features Now Working

✅ **Certificate Upload** - Single or bulk, auto-hash, QR code, blockchain storage
✅ **OCR Extraction** - Extract data from images/PDFs (HTTP or local mode)
✅ **Verification** - By ID, upload, or QR code with OCR/blockchain checks
✅ **Blockchain** - Immutable hash storage on Polygon
✅ **Health Checks** - See status of all services
✅ **Automation** - Setup script does all the work

---

## 🎯 Next Steps

1. **Run setup**:

   ```bash
   cd backend && npm run setup
   ```

2. **Configure**:

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start**:

   ```bash
   npm start
   ```

4. **Test**:

   ```bash
   curl http://localhost:5000/api/health
   ```

5. **Deploy blockchain** (optional, one-time):
   ```bash
   cd blockchain && npm run deploy:amoy
   # Add CONTRACT_ADDRESS to backend/.env
   ```

---

## 📊 Architecture Overview

```
Frontend (Upload/Verify)
        ↓
Backend (Express API)
   ├── OCR Service (HTTP or Local)
   ├── Blockchain (Polygon)
   └── Database (MongoDB)
```

Simple, clean, fully integrated! 🎉

---

**For detailed instructions, see SETUP_GUIDE.md**
