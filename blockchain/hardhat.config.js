require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "0x" + "0".repeat(64);
const RPC_URL     = process.env.BLOCKCHAIN_RPC_URL     || "https://polygon-rpc.com";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    // ── Local development ──────────────────────────────
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // ── Polygon Mainnet ────────────────────────────────
    polygon: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 137,
      gasPrice: "auto",
    },

    // ── Polygon Amoy Testnet (replaces Mumbai) ─────────
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      gasPrice: "auto",
    },

    // ── Ethereum Sepolia Testnet ───────────────────────
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID || ""}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },

  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonAmoy: POLYGONSCAN_API_KEY,
    },
  },

  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};