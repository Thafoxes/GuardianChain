import { ethers } from 'ethers';
import { wrap } from '@oasisprotocol/sapphire-paratime';

async function exploreLocalnet() {
  // Connect to localnet
  const provider = wrap(new ethers.JsonRpcProvider('http://localhost:8545'));
  
  try {
    console.log('🔍 Oasis Sapphire Localnet Explorer');
    console.log('=====================================');
    
    // Network info
    const network = await provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Latest block
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Latest Block: ${blockNumber}`);
    
    // Get latest block details
    const block = await provider.getBlock('latest');
    console.log(`⏰ Block Timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
    console.log(`🏭 Block Hash: ${block.hash}`);
    console.log(`📊 Transaction Count: ${block.transactions.length}`);
    
    // Show recent transactions
    if (block.transactions.length > 0) {
      console.log('\n📋 Recent Transactions:');
      for (let i = 0; i < Math.min(5, block.transactions.length); i++) {
        const txHash = block.transactions[i];
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        console.log(`\n🔗 Transaction ${i + 1}:`);
        console.log(`  Hash: ${tx.hash}`);
        console.log(`  From: ${tx.from}`);
        console.log(`  To: ${tx.to}`);
        console.log(`  Value: ${ethers.formatEther(tx.value || 0)} ROSE`);
        console.log(`  Gas Used: ${receipt?.gasUsed?.toString() || 'N/A'}`);
        console.log(`  Status: ${receipt?.status === 1 ? '✅ Success' : '❌ Failed'}`);
      }
    }
    
    // Contract addresses from your deployment
    console.log('\n📄 Deployed Contracts:');
    console.log(`🏆 RewardToken: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9`);
    console.log(`👤 UserVerification: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`);
    console.log(`📊 ReportContract: 0x0165878A594ca255338adfa4d48449f69242Eb8F`);
    
  } catch (error) {
    console.error('❌ Error exploring localnet:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exploreLocalnet();
}

export { exploreLocalnet };
