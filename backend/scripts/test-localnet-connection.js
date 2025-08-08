const http = require('http');

const data = JSON.stringify({
  jsonrpc: "2.0",
  method: "eth_blockNumber",
  params: [],
  id: 1
});

const options = {
  hostname: 'localhost',
  port: 8545,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔍 Testing connection to Oasis Sapphire Localnet...');
console.log('📡 Endpoint: http://localhost:8545');

const req = http.request(options, (res) => {
  console.log(`✅ Connection successful! Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      console.log('📊 Response:', parsed);
      
      if (parsed.result) {
        const blockNumber = parseInt(parsed.result, 16);
        console.log(`🏗️  Current block: ${blockNumber}`);
        console.log('🎉 Localnet is running and accessible!');
      }
    } catch (error) {
      console.log('❌ Failed to parse response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Connection failed:', error.message);
  console.log('💡 Make sure your Docker container is running on port 8545');
  console.log('🐳 Check Docker Desktop to see if the container is active');
});

req.write(data);
req.end();
