const { ethers } = require("ethers");

console.log("🔑 Generating 4 new testnet private keys for GuardianChain:");
console.log("⚠️  IMPORTANT: These are for TESTNET ONLY - Never use on mainnet!\n");

const roles = ["REPORTER", "VERIFIER", "INVESTIGATOR", "UNAUTHORIZED"];

roles.forEach((role, index) => {
  const wallet = ethers.Wallet.createRandom();
  console.log(`${index + 1}. ${role} Account:`);
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}`);
  console.log(`   .env variable: PRIVATE_KEY_${role}=${wallet.privateKey}`);
  console.log();
});

console.log("📋 Copy the private keys above and paste them into your .env file");
console.log("💰 Remember to fund each address with TEST tokens from:");
console.log("   https://faucet.testnet.oasis.dev/");
console.log("\n🔒 Security Reminder:");
console.log("   - Never commit these keys to version control");
console.log("   - Only use these for testnet");
console.log("   - Generate new keys for production");
