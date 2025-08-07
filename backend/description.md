I will be using Oasis Sapphire Blockchain to create a simple smart contract that allows users to store and retrieve a message. The contract will have two functions: one for setting the message and another for getting the message.


refer to saphire-packages.md for the necessary packages and setup instructions.

I want to make a smart contract for user verification that allows users to register, verify their identity, and retrieve their verification status. The contract will have functions for registering a user, verifying a user, and checking the verification status.

for userVerficiation.sol

```solidity
struct UserMetadata {
        address user;
        string identifier; 
        uint256 longevity;
        uint256 createdAt;
        bool isVerified;
    }
```

more from here
https://github.com/Webxspark/ethbangkok-dev/blob/main/contracts/UserVerification.sol


for the report contract, I want to create a simple contract that allows users to submit reports and retrieve them. The contract will have functions for submitting a report and getting a report by its ID.

the report will contain the following fields:
```solidity
struct Report {
    uint256 id;
    address reporter;
    string content;
    uint256 timestamp;
}
```

for the report contract that is verified by the police report and investigated, it will reward the user with a token for their contribution. The contract will have functions for submitting a verified report and checking the reward status.
the reward will be a simple token transfer to the user's address upon successful verification of the report.

```solidity
function rewardUser(address user) internal {
    uint256 rewardAmount = 1 * 10 ** 18; // 1 token reward
    token.transfer(user, rewardAmount);
}

project idea based on this 
https://github.com/Webxspark/ethbangkok-dev/blob/main/contracts/ReportContract.sol

I want to work on
Blockchain: Oasis Sapphire Network.
Role: Manages user verification and sensitive data using encrypted storage.

Public Reporting Platform
Blockchain: Multichain system implemented on various L2 chains.
Role: Allows users to submit reports, which are verified and rewarded.
Highlights:
High scalability for frequent interactions.
Cost-effective operations with low transaction fees.
Polygon zkEVM Cardona Sepolia, Sapphire, Base Sepolia, Zircuit, Scroll Sepolia.


No decentralized storage of sensitive data. as it will be only description text and will be encrypted on the blockchain.

decryption will be manage by the sapphire network. if possible