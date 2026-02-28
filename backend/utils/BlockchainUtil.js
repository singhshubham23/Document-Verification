const { ethers } = require('ethers');

// ABI matching CertificateValidator.sol
const CONTRACT_ABI = [
  'function storeCertificate(string calldata certId, string calldata hash) external returns (bool)',
  'function verifyCertificate(string calldata certId) external view returns (string memory storedHash, bool isValid, bool isRevoked, uint256 timestamp)',
  'function validateHash(string calldata certId, string calldata expectedHash) external view returns (bool)',
  'function revokeCertificate(string calldata certId, string calldata reason) external',
  'function setInstitutionAuth(address institution, bool status) external',
  'function getCertificateRecord(string calldata certId) external view returns (string memory hash, address storedBy, uint256 timestamp, bool isRevoked, string memory revokeReason)',
  'event CertificateStored(string indexed certId, string hash, address indexed storedBy, uint256 timestamp)',
  'event CertificateRevoked(string indexed certId, string reason, address indexed revokedBy, uint256 timestamp)',
];

let provider;
let contract;

const getContract = () => {
  if (!contract) {
    if (!process.env.BLOCKCHAIN_RPC_URL || !process.env.CONTRACT_ADDRESS) {
      throw new Error('Blockchain env vars not configured.');
    }
    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  }
  return contract;
};

/**
 * Verify a certificate hash against the blockchain.
 * Returns true if the on-chain hash matches and cert is not revoked.
 */
const verifyBlockchainHash = async (certId, expectedHash) => {
  try {
    const c = getContract();
    const isMatch = await c.validateHash(certId, expectedHash);
    return isMatch;
  } catch (error) {
    console.error('Blockchain verification error:', error.message);
    throw error;
  }
};

/**
 * Store a new certificate hash on the blockchain.
 * Returns the transaction hash (txnId).
 */
const storeCertificateOnChain = async (certId, hash) => {
  try {
    const c = getContract();
    const tx = await c.storeCertificate(certId, hash);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error('Blockchain storage error:', error.message);
    throw error;
  }
};

/**
 * Revoke a certificate on-chain.
 */
const revokeCertificateOnChain = async (certId, reason) => {
  try {
    const c = getContract();
    const tx = await c.revokeCertificate(certId, reason);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Blockchain revoke error:', error.message);
    throw error;
  }
};

/**
 * Authorize an institution wallet address on-chain.
 */
const authorizeInstitution = async (walletAddress, status = true) => {
  try {
    const c = getContract();
    const tx = await c.setInstitutionAuth(walletAddress, status);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Blockchain auth error:', error.message);
    throw error;
  }
};

module.exports = {
  verifyBlockchainHash,
  storeCertificateOnChain,
  revokeCertificateOnChain,
  authorizeInstitution,
};