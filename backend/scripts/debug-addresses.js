const hre = require("hardhat");
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🔍 === Address Mismatch Debug ===");
    
    // Get signers from Hardhat
    const signers = await ethers.getSigners();
    console.log("\n🔑 Hardhat Signers:");
    for (let i = 0; i < Math.min(5, signers.length); i++) {
        console.log(`   [${i}] ${await signers[i].getAddress()}`);
    }
    
    // Get addresses from private keys manually
    console.log("\n🔑 Manual Wallet Creation from .env:");
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    
    const envKeys = [
        process.env.LOCALNET_PRIVATE_KEY,
        process.env.LOCALNET_PRIVATE_KEY_REPORTER,
        process.env.LOCALNET_PRIVATE_KEY_VERIFIER,
        process.env.LOCALNET_PRIVATE_KEY_INVESTIGATOR,
        process.env.LOCALNET_PRIVATE_KEY_UNAUTHORIZED
    ];
    
    for (let i = 0; i < envKeys.length; i++) {
        if (envKeys[i]) {
            const wallet = new ethers.Wallet(envKeys[i], provider);
            console.log(`   [${i}] ${wallet.address} (from LOCALNET_PRIVATE_KEY${i > 0 ? '_' + ['', 'REPORTER', 'VERIFIER', 'INVESTIGATOR', 'UNAUTHORIZED'][i] : ''})`);
        } else {
            console.log(`   [${i}] MISSING PRIVATE KEY`);
        }
    }
    
    // Test if they're the same
    console.log("\n🔍 Comparison:");
    const signer1 = await signers[1].getAddress();
    const manual1 = new ethers.Wallet(process.env.LOCALNET_PRIVATE_KEY_REPORTER, provider).address;
    
    console.log("   Hardhat signer[1]:", signer1);
    console.log("   Manual wallet[1]:", manual1);
    console.log("   Match:", signer1 === manual1);
    
    // Test calling a contract with both
    console.log("\n🔍 Testing Contract Calls:");
    
    // Deploy a simple test contract
    const testContractCode = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.19;
        
        contract AddressTest {
            function whoAmI() external view returns (address) {
                return msg.sender;
            }
        }
    `;
    
    // Write the contract temporarily
    const fs = require('fs');
    const path = require('path');
    const contractPath = path.join(__dirname, '../contracts/AddressTest.sol');
    fs.writeFileSync(contractPath, testContractCode);
    
    try {
        const TestContract = await ethers.getContractFactory("AddressTest");
        const testContract = await TestContract.deploy();
        await testContract.waitForDeployment();
        
        console.log("   Contract deployed at:", await testContract.getAddress());
        
        // Call with Hardhat signer
        const resultSigner = await testContract.connect(signers[1]).whoAmI();
        console.log("   whoAmI via Hardhat signer:", resultSigner);
        
        // Call with manual wallet
        const manualWallet = new ethers.Wallet(process.env.LOCALNET_PRIVATE_KEY_REPORTER, provider);
        const resultManual = await testContract.connect(manualWallet).whoAmI();
        console.log("   whoAmI via manual wallet:", resultManual);
        
        console.log("   Results match:", resultSigner === resultManual);
        
    } finally {
        // Clean up
        if (fs.existsSync(contractPath)) {
            fs.unlinkSync(contractPath);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Debug failed:", error);
        process.exit(1);
    });
