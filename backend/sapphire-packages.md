# Oasis Sapphire Packages Reference

This document provides a reference for the packages needed to work with Oasis Sapphire in different programming environments. These packages enable developers to interact with Sapphire's privacy-preserving features and integrate with various frameworks.

## Related Services

### Filecoin Integration

[Filecoin](https://filecoin.io/) is a decentralized storage network that can be used alongside Sapphire to create fully decentralized applications with both privacy and storage capabilities:

```bash
# JavaScript/TypeScript SDK for Filecoin
npm install @glif/filecoin-address
npm install @glif/filecoin-message
npm install @glif/filecoin-wallet-provider

# Web3.Storage - Filecoin-backed storage service
npm install web3.storage

# Lotus JS Client
npm install @filecoin-shipyard/lotus-client-rpc
npm install @filecoin-shipyard/lotus-client-schema
```

Filecoin integration enables:
- Storing encrypted data off-chain while maintaining privacy with Sapphire
- Decentralized storage of larger study materials or resources
- Content-addressable linking between on-chain hashes and off-chain storage
- Verifiable storage proofs to ensure data availability

### Related Sapphire Demo Projects

#### 1. Sapphire Starter Project

The [Oasis Sapphire Demo Starter](https://github.com/oasisprotocol/demo-starter) provides a complete foundation for building applications with Sapphire's privacy features:

**Key Features:**
- Basic project structure with Hardhat configuration for Sapphire
- Sample contracts demonstrating Sapphire's cryptographic features
- Frontend integration examples with ethers.js
- Working deployment scripts for Sapphire testnet and mainnet

This starter project is especially relevant for our study session implementation as it demonstrates:
- Proper contract structuring for privacy-preserving applications
- Frontend integration patterns for handling encrypted data
- Testing strategies for privacy-focused smart contracts

#### 2. Sapphire Quiz Demo

The [Oasis Sapphire Quiz Demo](https://github.com/oasisprotocol/demo-quiz) showcases advanced privacy features that can be adapted for secure study session tracking.

## JavaScript/TypeScript Environment

### Core Packages

```bash
# Sapphire Solidity contracts - Core contracts with privacy features
npm i -D @oasisprotocol/sapphire-contracts

# TypeScript wrappers for Sapphire ParaTime
npm i -D @oasisprotocol/sapphire-paratime
```

### Framework Integrations

```bash
# Hardhat integration for Sapphire
npm i -D @oasisprotocol/sapphire-hardhat

# Viem v2 wrapper for Sapphire
npm i -D @oasisprotocol/sapphire-viem-v2

# Wagmi v2 hooks for Sapphire integration
npm i -D @oasisprotocol/sapphire-wagmi-v2
```

## Python Environment

```bash
# Python wrapper for Sapphire
pip install oasis-sapphire-py
```

## Go Environment

```bash
# Go client for Sapphire
go get github.com/oasisprotocol/sapphire-paratime/clients/go
```

## Use Cases

These packages are useful for:

1. **Smart Contract Development**: Using Sapphire's privacy features in your Solidity contracts
2. **Frontend Integration**: Building web applications that interact with Sapphire-based contracts
3. **Development & Testing**: Creating development environments and test suites for Sapphire
4. **Framework Compatibility**: Working with Sapphire using popular Ethereum development frameworks

## Documentation Resources

- [Official Sapphire API Documentation](https://api.docs.oasis.io/sol/sapphire-contracts/)
- [Sapphire Smart Contract Cheatsheet](#sapphire-solidity-cheatsheet)

## Sapphire Solidity Cheatsheet

```solidity
// Import Sapphire features
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

// Random Number Generator
bytes memory seed = Sapphire.randomBytes(32, "");
favoriteNumber = uint256(keccak256(abi.encodePacked(msg.sender, seed))) % 100;

// On-chain key generation
Sapphire.SigningAlg alg = Sapphire.SigningAlg.Secp256k1PrehashedKeccak256;
(bytes memory pk, bytes memory sk) = Sapphire.generateSigningKeyPair(alg, seed); // Public/Secret key

// On-chain encryption/decryption
bytes memory encrypted = Sapphire.encrypt(sk, nonce, "plain text", "context");
bytes memory decrypted = Sapphire.decrypt(sk, nonce, encrypted, "context");

// On-chain signing/verification
bytes memory digest = abi.encodePacked(keccak256("signed message"));
bytes memory signature = Sapphire.sign(alg, sk, digest, "context");
require(Sapphire.verify(alg, pk, digest, "context", signature));

// On-chain TX Signing
import {EIP155Signer} from "@oasisprotocol/sapphire-contracts/contracts/EIP155Signer.sol";
bytes memory gaslessTx = EIP155Signer.sign(addr, sk,
  EIP155Signer.EthTx({ 
    nonce: nonce, 
    gasPrice: 100_000_000_000, 
    gasLimit: 250_000,
    to: address(this), 
    value: 50_000_000_000_000_000_000, 
    chainId: block.chainid,
    data: abi.encodeCall(this.myPayableFunc, abi.encode("param1", "param2")),
  })
);
```

## Frontend Integration Example

When using Sapphire with ethers.js in a frontend application:

```javascript
import { sapphire } from '@oasisprotocol/sapphire-paratime';

// Wrap your ethers provider with Sapphire
const provider = sapphire.wrap(new ethers.BrowserProvider(window.ethereum));
const signer = await provider.getSigner();

// Now use the wrapped signer to interact with contracts on Sapphire
const contractInstance = new ethers.Contract(
  contractAddress,
  ContractABI,
  signer
);

// Call methods as usual
const tx = await contractInstance.yourMethod();
```

## Best Practices

1. **Provider Wrapping**: Always wrap your Ethereum provider with the Sapphire provider to handle the encryption/decryption automatically
2. **Gas Management**: Be aware that privacy features consume more gas than standard operations
3. **Key Management**: Store keys securely and never expose secret keys in client-side code
4. **Testing**: Test thoroughly on Sapphire Testnet before deploying to mainnet

## Implementation Ideas for Study Notes Privacy

Inspired by the [Oasis Sapphire Demo Projects](#related-sapphire-demo-projects), we can implement similar privacy features for study notes and subjects:

### 1. Encrypted Study Notes

```solidity
// In your smart contract
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

struct PrivateStudySession {
    uint256 id;
    address student;
    uint256 startTime;
    uint256 endTime;
    bytes encryptedSubject;
    bytes encryptedNotes;
    uint256 duration;
    bool isActive;
}

mapping(address => PrivateStudySession[]) private studentSessions;

// Function to start a session with encrypted subject
function startPrivateStudySession(bytes calldata encryptedSubject) public {
    // Generate a session ID using Sapphire's secure randomness
    bytes memory seed = Sapphire.randomBytes(32, "");
    uint256 sessionId = uint256(keccak256(abi.encodePacked(msg.sender, seed)));
    
    PrivateStudySession memory session = PrivateStudySession({
        id: sessionId,
        student: msg.sender,
        startTime: block.timestamp,
        endTime: 0,
        encryptedSubject: encryptedSubject,
        encryptedNotes: new bytes(0),
        duration: 0,
        isActive: true
    });
    
    studentSessions[msg.sender].push(session);
    emit StudySessionStarted(sessionId, msg.sender, block.timestamp);
}

// Function to end a session with encrypted notes
function endPrivateStudySession(bytes calldata encryptedNotes) public {
    // Find active session and update it
    // ...
}
```

### 2. Frontend Implementation

```javascript
import { sapphire } from '@oasisprotocol/sapphire-paratime';
import { ethers } from 'ethers';

// Generate encryption keys (could be derived from user's wallet)
async function generateEncryptionKey() {
    const provider = sapphire.wrap(new ethers.BrowserProvider(window.ethereum));
    const signer = await provider.getSigner();
    
    // Create a deterministic seed based on the user's address
    const address = await signer.getAddress();
    const message = `encryption-key-${address}`;
    const signature = await signer.signMessage(message);
    
    // Use the signature as seed for Sapphire's key generation
    return ethers.utils.arrayify(signature);
}

// Encrypt subject before sending to blockchain
async function startEncryptedStudySession(subject) {
    const key = await generateEncryptionKey();
    const nonce = ethers.utils.randomBytes(12); // 12-byte nonce
    
    // Encrypt the subject
    const encoder = new TextEncoder();
    const subjectBytes = encoder.encode(subject);
    
    // In a real implementation, you would:
    // 1. Use the key and nonce with a proper encryption algorithm
    // 2. Send the encrypted data to the contract
    
    // Example pseudocode:
    // const encryptedSubject = await encrypt(key, nonce, subjectBytes);
    // await contract.startPrivateStudySession(encryptedSubject);
}
```

### 3. Decryption Process and Data Handling

```javascript
// Decrypt study session data when retrieved from blockchain
async function decryptStudySessionData(encryptedSession) {
  const key = await generateEncryptionKey(); // Same function as before
  
  // Extract the encrypted data from the session
  const { encryptedSubject, encryptedNotes } = encryptedSession;
  
  // In a real implementation, you would:
  // 1. Extract the nonce (typically stored with the encrypted data)
  // 2. Use the key and nonce with the appropriate decryption algorithm
  
  // Example pseudocode:
  // const decryptedSubject = await decrypt(key, nonce, encryptedSubject);
  // const decryptedNotes = await decrypt(key, nonce, encryptedNotes);
  
  // Convert decrypted bytes back to strings
  const decoder = new TextDecoder();
  const subject = decoder.decode(decryptedSubject);
  const notes = decoder.decode(decryptedNotes);
  
  return { ...encryptedSession, subject, notes };
}

// Function to fetch and decrypt all user sessions
async function fetchUserSessions() {
  // Get the wrapped provider and signer
  const provider = sapphire.wrap(new ethers.BrowserProvider(window.ethereum));
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
  // Get encrypted sessions from contract
  const encryptedSessions = await contract.getUserSessions();
  
  // Decrypt each session
  const decryptedSessions = await Promise.all(
    encryptedSessions.map(decryptStudySessionData)
  );
  
  return decryptedSessions;
}
```

### 4. React Frontend Integration

Here's how to integrate encrypted study sessions in your React application:

```jsx
import React, { useState, useEffect } from 'react';
import { sapphire } from '@oasisprotocol/sapphire-paratime';
import { ethers } from 'ethers';

function PrivateStudySessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  
  // Load user's sessions on component mount
  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        const decryptedSessions = await fetchUserSessions();
        setSessions(decryptedSessions);
        
        // Check if user has an active session
        const active = decryptedSessions.find(s => s.isActive);
        if (active) {
          setActiveSession(active);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (window.ethereum) {
      loadSessions();
    }
  }, []);
  
  // Start a new encrypted study session
  async function handleStartSession(e) {
    e.preventDefault();
    
    if (!subject.trim()) return;
    
    setLoading(true);
    try {
      // Create a wrapped provider
      const provider = sapphire.wrap(new ethers.BrowserProvider(window.ethereum));
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      // Generate key and encrypt subject
      const key = await generateEncryptionKey();
      const nonce = ethers.utils.randomBytes(12);
      
      // Encrypt the subject (in a real implementation)
      const encoder = new TextEncoder();
      const subjectBytes = encoder.encode(subject);
      // const encryptedSubject = await encrypt(key, nonce, subjectBytes);
      
      // For demo, assume we have an encryption function
      const encryptedSubject = `0x${Buffer.from(subjectBytes).toString('hex')}`;
      
      // Send transaction to contract
      const tx = await contract.startPrivateStudySession(encryptedSubject);
      await tx.wait();
      
      // Reload sessions
      const decryptedSessions = await fetchUserSessions();
      setSessions(decryptedSessions);
      
      // Find and set active session
      const active = decryptedSessions.find(s => s.isActive);
      if (active) {
        setActiveSession(active);
      }
      
      // Clear form
      setSubject('');
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setLoading(false);
    }
  }
  
  // End the current study session
  async function handleEndSession(e) {
    e.preventDefault();
    
    if (!activeSession) return;
    
    setLoading(true);
    try {
      // Similar process to encrypt notes
      // const encryptedNotes = ... (encryption process)
      
      // For demo, assume we have an encryption function
      const encoder = new TextEncoder();
      const notesBytes = encoder.encode(notes);
      const encryptedNotes = `0x${Buffer.from(notesBytes).toString('hex')}`;
      
      // Send transaction to contract
      const provider = sapphire.wrap(new ethers.BrowserProvider(window.ethereum));
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      const tx = await contract.endPrivateStudySession(encryptedNotes);
      await tx.wait();
      
      // Reload sessions
      const decryptedSessions = await fetchUserSessions();
      setSessions(decryptedSessions);
      setActiveSession(null);
      setNotes('');
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="private-study-sessions">
      <h2>Private Study Sessions</h2>
      
      {loading && <div className="loading">Loading...</div>}
      
      {!activeSession ? (
        <form onSubmit={handleStartSession}>
          <h3>Start New Private Session</h3>
          <div className="form-group">
            <label htmlFor="subject">Subject (encrypted on-chain):</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What will you study?"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            Start Encrypted Session
          </button>
          <p className="privacy-note">
            <small>
              Note: Your subject will be encrypted before being stored on-chain.
              Only you will be able to decrypt and read it.
            </small>
          </p>
        </form>
      ) : (
        <form onSubmit={handleEndSession}>
          <h3>End Current Session</h3>
          <div className="active-session-info">
            <p><strong>Subject:</strong> {activeSession.subject}</p>
            <p><strong>Started:</strong> {new Date(activeSession.startTime * 1000).toLocaleString()}</p>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes (encrypted on-chain):</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn? (Will be encrypted)"
              rows={4}
            />
          </div>
          <button type="submit" disabled={loading}>
            End Session & Save Encrypted Notes
          </button>
        </form>
      )}
      
      <div className="session-history">
        <h3>Session History</h3>
        {sessions.length === 0 ? (
          <p>No sessions found.</p>
        ) : (
          <ul>
            {sessions.filter(s => !s.isActive).map(session => (
              <li key={session.id.toString()}>
                <h4>{session.subject}</h4>
                <p><strong>Date:</strong> {new Date(session.startTime * 1000).toLocaleString()}</p>
                <p><strong>Duration:</strong> {formatDuration(session.duration)}</p>
                {session.notes && (
                  <div className="session-notes">
                    <strong>Notes:</strong>
                    <p>{session.notes}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

export default PrivateStudySessions;
```

### 5. Full-Stack Architecture for Private Study Notes

To implement this fully, you'll need:

1. **Smart Contract Layer**:
   - Encrypted storage for subject and notes
   - Public verification of session duration and completion
   - Functions for starting/ending encrypted sessions

2. **Middleware Layer**:
   - Sapphire provider wrapping for automatic cryptographic operations
   - Key management and persistence
   - Error handling for failed cryptographic operations

3. **UI Layer**:
   - Forms for encrypted data input
   - Session history with decrypted content
   - Visual indicators for encrypted vs. public data

### 6. Key Benefits

- **Privacy**: Study subjects and notes are encrypted and only readable by the user
- **On-chain Verification**: Session timing and completion can still be verified publicly
- **Data Ownership**: Users maintain control over their learning data
- **Selective Disclosure**: Users can choose to share specific sessions or stats
- **Seamless UX**: The encryption/decryption happens behind the scenes with minimal user friction

For a complete implementation, check out the [Oasis Sapphire Demo Projects](#related-sapphire-demo-projects) as references.

For more detailed information and updates, refer to the [official Oasis Sapphire documentation](https://docs.oasis.io/dapp/sapphire/).
