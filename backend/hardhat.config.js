require("@nomicfoundation/hardhat-toolbox");
require("@oasisprotocol/sapphire-hardhat");
require("dotenv").config();

// Helper to validate a hex private key (32 bytes, 0x-prefixed)
const isValidPrivateKey = (key) =>
  typeof key === "string" && /^0x[0-9a-fA-F]{64}$/.test(key.trim());

const collectAccounts = (envVarNames) =>
  envVarNames
    .map((name) => process.env[name])
    .filter((key) => isValidPrivateKey(key));

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Sapphire Testnet
    "sapphire-testnet": {
      url: "https://testnet.sapphire.oasis.dev",
      chainId: 0x5aff,
      accounts: collectAccounts([
        "PRIVATE_KEY",
        "PRIVATE_KEY_REPORTER",
        "PRIVATE_KEY_VERIFIER",
        "PRIVATE_KEY_INVESTIGATOR",
        "PRIVATE_KEY_UNAUTHORIZED",
      ]),
    },
    // Sapphire Mainnet
    "sapphire-mainnet": {
      url: "https://sapphire.oasis.io",
      chainId: 0x5afe,
      accounts: collectAccounts([
        "PRIVATE_KEY",
        "PRIVATE_KEY_REPORTER",
        "PRIVATE_KEY_VERIFIER",
        "PRIVATE_KEY_INVESTIGATOR",
        "PRIVATE_KEY_UNAUTHORIZED",
      ]),
    },
    // Sapphire Localnet (Docker)
    "sapphire-localnet": {
      url: "http://localhost:8545",
      chainId: 0x5afd, // 23293
      accounts: [
        process.env.LOCALNET_PRIVATE_KEY ||
          "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        process.env.LOCALNET_PRIVATE_KEY_REPORTER ||
          "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        process.env.LOCALNET_PRIVATE_KEY_VERIFIER ||
          "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        process.env.LOCALNET_PRIVATE_KEY_INVESTIGATOR ||
          "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
        process.env.LOCALNET_PRIVATE_KEY_UNAUTHORIZED ||
          "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
      ],
      timeout: 40000,
    },
    // For testing with local network
    hardhat: {
      chainId: 1337,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    // Oasis doesn't use Etherscan, but this is kept for future integrations
    apiKey: {
      sapphire: "dummy", // Placeholder
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
