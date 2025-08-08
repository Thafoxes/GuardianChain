# Test User Credentials for GuardianChain

## Verified Test User
- **Address**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Private Key**: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
- **Status**: ✅ Registered and Verified
- **Can Submit Reports**: Yes

## How to Test
1. Connect MetaMask to localhost:8545 (Hardhat Network)
2. Import the above private key into MetaMask
3. Switch to this account in MetaMask
4. Navigate to Submit Report page
5. The verification check should pass and allow report submission

## Other Test Accounts
- **Admin Account (First Hardhat)**: 
  - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

- **Second Hardhat Account**:
  - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
  - Status: ❌ Not verified (can be used to test verification modal)

## Notes
- The verification modal will appear if you connect with an unverified account
- Only verified users can submit reports to the blockchain
- Private keys are only needed for testing in development environment
