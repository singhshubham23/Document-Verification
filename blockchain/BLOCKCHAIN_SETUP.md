# Blockchain Deployment Guide

## Quick Start

```bash
cd blockchain

# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Add your private key
# Edit .env and add your wallet's private key

# 4. Deploy contract
npm run deploy:amoy

# 5. Copy the contract address to backend/.env
```

## Prerequisites

### 1. Get a Wallet

- Create a MetaMask wallet: https://metamask.io/
- Or use any Ethereum wallet
- Export the private key (hex format starting with 0x)

### 2. Get Testnet MATIC

Visit Polygon Faucet: https://faucet.polygon.technology/

- Select "Polygon Amoy" network
- Enter your wallet address
- Receive free MATIC tokens

### 3. Verify Balance

Check your balance on Amoy Explorer:
https://amoy.polygonscan.com/

## Configuration

### Create blockchain/.env

```bash
# Your wallet's private key (hex format)
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# RPC URL (public endpoint, no key required)
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology/

# Optional: Polygon scan API key for verification
POLYGONSCAN_API_KEY=your_api_key_here
```

## Deployment

### Test the Setup

```bash
npm run compile
```

Should output:

```
Successfully compiled 1 Solidity file
✓ CertificateValidator
```

### Deploy to Amoy Testnet

```bash
npm run deploy:amoy
```

Expected output:

```
Deploying CertificateValidator with account: 0x...
Account balance: 1000000000000000000
CertificateValidator deployed to: 0xabcd1234...
Add this to your .env:
CONTRACT_ADDRESS=0xabcd1234...
```

### Save the Contract Address

Copy the `CONTRACT_ADDRESS` from deployment output and add to `backend/.env`:

```bash
CONTRACT_ADDRESS=0xabcd1234efgh5678ijkl9012mnop3456qrst7890
```

## Smart Contract Functions

### storeCertificate

```solidity
storeCertificate(string certId, string hash)
```

- Stores a certificate hash on-chain
- Only authorized institutions can call
- Emits CertificateStored event

### verifyCertificate

```solidity
verifyCertificate(string certId) -> (hash, isValid, isRevoked, timestamp)
```

- Retrieves certificate data from blockchain
- Returns validation status

### validateHash

```solidity
validateHash(string certId, string expectedHash) -> bool
```

- Verifies if on-chain hash matches provided hash
- Used for certificate verification

### revokeCertificate

```solidity
revokeCertificate(string certId, string reason)
```

- Marks certificate as revoked
- Only authorized institutions can call

### setInstitutionAuth

```solidity
setInstitutionAuth(address institution, bool status)
```

- Authorizes/deauthorizes an institution
- Only callable by contract owner

## Testing

```bash
# Run contract tests
npm run test

# Deploy locally for testing
npm run node  # in one terminal
npm run deploy:local  # in another
```

## Security Notes

1. **Never commit private keys**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use secure private key storage**
   - Consider hardware wallets (Ledger, Trezor)
   - Use environment variable management services

3. **Test on Amoy first**
   - Always test on testnet before mainnet
   - Free to experiment with fake MATIC

## Mainnet Deployment (When Ready)

For Polygon Mainnet (real transactions):

```bash
# Update blockchain/hardhat.config.js to include mainnet
# Then run:
npm run deploy:polygon

# Requires:
# - Real MATIC tokens for gas fees
# - Wallet with Polygon mainnet balance
```

## Verification on Explorer

After deployment, verify contract on Polygon Scan:

1. Go to: https://amoy.polygonscan.com/
2. Paste your contract address
3. Click "Verify and Publish" if not auto-verified
4. Select Solidity version: 0.8.20
5. Paste contract code

## Gas Optimization

Current contract is optimized with:

- `optimizer: { enabled: true, runs: 200 }`
- Efficient storage usage
- Minimized function complexity

## Troubleshooting

### Insufficient Balance

```
Error: insufficient balance
```

Solution: Get more MATIC from faucet

### Invalid Private Key Format

```
Error: Invalid private key
```

Solution: Private key must start with `0x` and be hex format

### RPC Connection Failed

```
Error: could not detect network
```

Solution: Check RPC URL and internet connection

### Contract Address Not Found

```
Error: Contract address not defined
```

Solution: Ensure deployment completed and contract address is in backend/.env

## Additional Resources

- Smart Contract Code: [CertificateValidator.sol](../blockchain/contracts/CertificateValidator.sol)
- Hardhat Docs: https://hardhat.org/
- Polygon Docs: https://polygon.technology/
- Ethers.js Docs: https://docs.ethers.org/

## Support

For blockchain-specific issues, refer to:

- Hardhat Documentation
- Polygon Documentation
- Solidity Documentation
