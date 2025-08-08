# Oasis Sapphire Localnet Docker Setup Guide

## 🐳 Correct Docker Command

Make sure you're running the Oasis Sapphire localnet with proper port mapping:

```bash
docker run -it -p8544-8548:8544-8548 ghcr.io/oasisprotocol/sapphire-localnet
```

### Port Mapping Explanation:
- `-p 8544:8544` - GRPC endpoint
- `-p 8545:8545` - **Web3 RPC endpoint (this is what Hardhat needs)**
- `-p 8546:8546` - Alternative endpoint
- `-p 8548:8548` - Localnet Explorer

### Alternative Command (if ports are busy):
```bash
docker run -it -p 9544:8544 -p 9545:8545 -p 9546:8546 -p 9548:8548 ghcr.io/oasisprotocol/sapphire-localnet -test-mnemonic -n 5
```

If you use alternative ports, update hardhat.config.js:
```javascript
"sapphire-localnet": {
  url: "http://localhost:9545",  // Changed to 9545
  chainId: 0x5afd,
  // ... rest of config
}
```

## 🔧 Troubleshooting

### 1. Check Container Status
```bash
docker ps
```

### 2. Check Container Logs
```bash
docker logs <container-name>
```

### 3. Test RPC Endpoint
Once running, test with:
```bash
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545
```

### 4. Check Windows Firewall
Make sure Windows Firewall isn't blocking Docker ports.

## 🎯 Expected Output When Working

You should see something like:
```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 TEST)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 TEST)
...

Private Keys
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...

WARNING: The chain is running in ephemeral mode. State will be lost after restart!

* GRPC listening on http://localhost:8544
* Web3 RPC listening on http://localhost:8545 and ws://localhost:8546
* Local API listening on http://localhost:8547
* Localnet Explorer available at http://localhost:8548
* Container start-up took 71 seconds, node log level is set to warn.
```

The key line is: **"Web3 RPC listening on http://localhost:8545"**

## 🚀 Next Steps

1. Stop your current container if running
2. Run the correct Docker command above
3. Wait for "Web3 RPC listening" message
4. Run: `npm run localnet-deploy`
