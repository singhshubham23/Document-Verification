const { ethers } = require("ethers");

// ABI matching CertificateValidator.sol
const CONTRACT_ABI = [
  "function storeCertificate(string calldata certId, string calldata certHash) external",
  "function verifyCertificate(string calldata certId) external view returns (string memory, bool isValid, bool isRevoked)",
  "function validateHash(string calldata certId, string calldata certHash) external view returns (bool)",
  "function revokeCertificate(string calldata certId, string calldata reason) external",
  "function setInstitutionAuth(address _institution, bool _auth) external",
  "event CertificateStored(string certId, string certHash, address indexed institution, uint256 timestamp)",
  "event CertificateRevoked(string certId)"
];

let provider;
let contract;
let blockchainEnabled = false;

const initializeBlockchain = () => {
  if (
    !process.env.BLOCKCHAIN_RPC_URL ||
    !process.env.CONTRACT_ADDRESS ||
    !process.env.BLOCKCHAIN_PRIVATE_KEY
  ) {
    console.warn(
      "[Blockchain] Configuration incomplete. Blockchain features will be disabled.",
    );
    blockchainEnabled = false;
    return false;
  }

  try {
    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(
      process.env.BLOCKCHAIN_PRIVATE_KEY,
      provider,
    );
    contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      wallet,
    );
    blockchainEnabled = true;
    console.log(
      "[Blockchain] Successfully initialized. Contract:",
      process.env.CONTRACT_ADDRESS,
    );
    return true;
  } catch (error) {
    console.error("[Blockchain] Initialization failed:", error.message);
    blockchainEnabled = false;
    return false;
  }
};

const getContract = () => {
  if (!contract) {
    if (!initializeBlockchain()) {
      throw new Error(
        "Blockchain not configured. Set BLOCKCHAIN_RPC_URL, CONTRACT_ADDRESS, and BLOCKCHAIN_PRIVATE_KEY.",
      );
    }
  }
  return contract;
};

/**
 * Check if blockchain is properly configured
 */
const isBlockchainEnabled = () => {
  if (!blockchainEnabled) {
    blockchainEnabled = !!contract;
  }
  return blockchainEnabled;
};

/**
 * Health check for blockchain connection
 */
const checkBlockchainHealth = async () => {
  try {
    if (!isBlockchainEnabled()) {
      return { healthy: false, message: "Blockchain not configured" };
    }

    const networkInfo = await provider.getNetwork();
    const balance = await provider.getBalance(
      new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY).address,
    );

    return {
      healthy: true,
      network: networkInfo.name,
      chainId: networkInfo.chainId,
      balance: ethers.formatEther(balance) + " tokens",
    };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
};

/**
 * Verify a certificate hash against the blockchain.
 * Returns true if the on-chain hash matches and cert is not revoked.
 */
const verifyBlockchainHash = async (certId, expectedHash) => {
  if (!isBlockchainEnabled()) {
    console.warn("[Blockchain] Verification skipped - blockchain not enabled");
    return null;
  }

  try {
    const c = getContract();
    const isMatch = await c.validateHash(certId, expectedHash);
    return isMatch;
  } catch (error) {
    console.error("[Blockchain] Verification error:", error.message);
    throw error;
  }
};

/**
 * Store a new certificate hash on the blockchain.
 * Returns the transaction hash (txnId).
 */
const storeCertificateOnChain = async (certId, hash) => {
  if (!isBlockchainEnabled()) {
    console.warn("[Blockchain] Storage skipped - blockchain not enabled");
    return null;
  }

  try {
    const c = getContract();

    // Validate inputs
    if (!certId || typeof certId !== "string") {
      throw new Error("Invalid certId");
    }
    if (!hash || hash.length !== 64) {
      throw new Error("Hash must be 64 characters (SHA-256 hex)");
    }

    const tx = await c.storeCertificate(certId, hash);
    const receipt = await tx.wait();

    console.log(
      `[Blockchain] Certificate ${certId} stored. TxHash: ${receipt.hash}`,
    );
    return receipt.hash;
  } catch (error) {
    console.error("[Blockchain] Storage error:", error.message);
    throw error;
  }
};

/**
 * Revoke a certificate on-chain.
 */
const revokeCertificateOnChain = async (certId, reason = "") => {
  if (!isBlockchainEnabled()) {
    console.warn("[Blockchain] Revocation skipped - blockchain not enabled");
    return null;
  }

  try {
    const c = getContract();
    const tx = await c.revokeCertificate(certId, reason);
    await tx.wait();

    console.log(`[Blockchain] Certificate ${certId} revoked.`);
    return true;
  } catch (error) {
    console.error("[Blockchain] Revocation error:", error.message);
    throw error;
  }
};

/**
 * Authorize an institution wallet address on-chain.
 */
const authorizeInstitution = async (walletAddress, status = true) => {
  if (!isBlockchainEnabled()) {
    console.warn("[Blockchain] Authorization skipped - blockchain not enabled");
    return null;
  }

  try {
    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Invalid wallet address");
    }

    const c = getContract();
    const tx = await c.setInstitutionAuth(walletAddress, status);
    await tx.wait();

    console.log(
      `[Blockchain] Institution ${walletAddress} ${status ? "authorized" : "revoked"}.`,
    );
    return true;
  } catch (error) {
    console.error("[Blockchain] Authorization error:", error.message);
    throw error;
  }
};

/**
 * Get certificate details from blockchain
 */
const getCertificateDetails = async (certId) => {
  if (!isBlockchainEnabled()) {
    console.warn("[Blockchain] Details fetch skipped - blockchain not enabled");
    return null;
  }

  try {
    const c = getContract();
    // Try basic verification
    const result = await c.verifyCertificate(certId);
    return {
      hash: result[0],
      isValid: result[1],
      isRevoked: result[2],
    };
  } catch (error) {
    console.error("[Blockchain] Details fetch error:", error.message);
    throw error;
  }
};

// Initialize blockchain on module load
if (process.env.BLOCKCHAIN_RPC_URL && process.env.CONTRACT_ADDRESS) {
  initializeBlockchain();
}

module.exports = {
  verifyBlockchainHash,
  storeCertificateOnChain,
  revokeCertificateOnChain,
  authorizeInstitution,
  getCertificateDetails,
  isBlockchainEnabled,
  checkBlockchainHealth,
  initializeBlockchain,
};
