require("@nomicfoundation/hardhat-toolbox");
require("@oasisprotocol/sapphire-hardhat");
require("dotenv").config();

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
      accounts: [
        process.env.PRIVATE_KEY,
        process.env.PRIVATE_KEY_REPORTER,
        process.env.PRIVATE_KEY_VERIFIER,
        process.env.PRIVATE_KEY_INVESTIGATOR,
        process.env.PRIVATE_KEY_UNAUTHORIZED
      ].filter(Boolean), // Remove undefined values
    },
    // Sapphire Mainnet
    "sapphire-mainnet": {
      url: "https://sapphire.oasis.io",
      chainId: 0x5afe,
      accounts: [
        process.env.PRIVATE_KEY,
        process.env.PRIVATE_KEY_REPORTER,
        process.env.PRIVATE_KEY_VERIFIER,
        process.env.PRIVATE_KEY_INVESTIGATOR,
        process.env.PRIVATE_KEY_UNAUTHORIZED
      ].filter(Boolean),
    },
    // Sapphire Localnet
    "sapphire-localnet": {
      url: "http://localhost:8545",
      chainId: 0x5afd,
      accounts: [
        process.env.PRIVATE_KEY,
        process.env.PRIVATE_KEY_REPORTER,
        process.env.PRIVATE_KEY_VERIFIER,
        process.env.PRIVATE_KEY_INVESTIGATOR,
        process.env.PRIVATE_KEY_UNAUTHORIZED
      ].filter(Boolean),
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
