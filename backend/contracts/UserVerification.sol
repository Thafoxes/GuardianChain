// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

/**
 * @title UserVerification
 * @dev Contract for managing user verification with encrypted data storage on Oasis Sapphire
 */
contract UserVerification {
    
    struct UserMetadata {
        address user;
        bytes encryptedIdentifier; // Encrypted identifier for privacy
        uint256 longevity;
        uint256 createdAt;
        bool isVerified;
        bytes32 verificationHash; // Hash for verification without revealing data
    }
    
    // Mapping from user address to their metadata
    mapping(address => UserMetadata) private userMetadata;
    
    // Mapping to track if a user is registered
    mapping(address => bool) public isRegistered;
    
    // Array to keep track of all registered users (for admin purposes)
    address[] private registeredUsers;
    
    // Admin address for verification purposes
    address public admin;
    
    // Events
    event UserRegistered(address indexed user, uint256 timestamp);
    event UserVerified(address indexed user, uint256 timestamp);
    event UserStatusUpdated(address indexed user, bool isVerified);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyRegisteredUser() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Register a new user with encrypted identifier
     * @param identifier Plain text identifier that will be encrypted
     * @param longevity User's longevity score or tenure
     */
    function registerUser(string memory identifier, uint256 longevity) external {
        require(!isRegistered[msg.sender], "User already registered");
        require(bytes(identifier).length > 0, "Identifier cannot be empty");
        
        // Generate encryption key using deterministic approach
        bytes32 encryptionKey = keccak256(abi.encodePacked(msg.sender, "user_registration_key"));
        
        // Encrypt the identifier
        bytes memory nonceBytes = Sapphire.randomBytes(12, "nonce");
        bytes12 nonce = bytes12(nonceBytes);
        bytes memory encryptedIdentifier = Sapphire.encrypt(
            encryptionKey,
            nonce,
            bytes(identifier),
            abi.encodePacked(msg.sender)
        );
        
        // Create verification hash without revealing the actual identifier
        bytes32 verificationHash = keccak256(abi.encodePacked(identifier, msg.sender, block.timestamp));
        
        // Store user metadata
        userMetadata[msg.sender] = UserMetadata({
            user: msg.sender,
            encryptedIdentifier: abi.encodePacked(nonce, encryptedIdentifier), // Store nonce + encrypted data
            longevity: longevity,
            createdAt: block.timestamp,
            isVerified: false,
            verificationHash: verificationHash
        });
        
        isRegistered[msg.sender] = true;
        registeredUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify a user (only admin)
     * @param userAddress Address of the user to verify
     */
    function verifyUser(address userAddress) external onlyAdmin {
        require(isRegistered[userAddress], "User not registered");
        require(!userMetadata[userAddress].isVerified, "User already verified");
        
        userMetadata[userAddress].isVerified = true;
        
        emit UserVerified(userAddress, block.timestamp);
        emit UserStatusUpdated(userAddress, true);
    }
    
    /**
     * @dev Revoke user verification (only admin)
     * @param userAddress Address of the user to revoke verification
     */
    function revokeUserVerification(address userAddress) external onlyAdmin {
        require(isRegistered[userAddress], "User not registered");
        require(userMetadata[userAddress].isVerified, "User not verified");
        
        userMetadata[userAddress].isVerified = false;
        
        emit UserStatusUpdated(userAddress, false);
    }
    
    /**
     * @dev Get user's own decrypted identifier
     * @return The decrypted identifier string
     */
    function getMyIdentifier() external onlyRegisteredUser returns (string memory) {
        UserMetadata memory metadata = userMetadata[msg.sender];
        
        // Extract nonce and encrypted data
        bytes12 nonce;
        bytes memory encryptedData = new bytes(metadata.encryptedIdentifier.length - 12);
        
        // Extract the 12-byte nonce
        for (uint i = 0; i < 12; i++) {
            nonce |= bytes12(metadata.encryptedIdentifier[i]) >> (i * 8);
        }
        // Extract the encrypted data
        for (uint i = 12; i < metadata.encryptedIdentifier.length; i++) {
            encryptedData[i - 12] = metadata.encryptedIdentifier[i];
        }
        
        // Regenerate the same encryption key (deterministic)
        bytes32 encryptionKey = keccak256(abi.encodePacked(msg.sender, "user_registration_key"));
        
        // Decrypt the identifier
        bytes memory decryptedBytes = Sapphire.decrypt(
            encryptionKey,
            nonce,
            encryptedData,
            abi.encodePacked(msg.sender)
        );
        
        return string(decryptedBytes);
    }
    
    /**
     * @dev Simple test function to verify modifier works
     */
    function testModifier() external onlyRegisteredUser returns (bool) {
        return true;
    }
    
    /**
     * @dev Get registration status without modifier
     */
    function checkMyRegistration() external view returns (bool) {
        return isRegistered[msg.sender];
    }
    
    /**
     * @dev Debug function to see what address is being used
     */
    function debugMsgSender() external returns (address, bool) {
        return (msg.sender, isRegistered[msg.sender]);
    }
    
    /**
     * @dev Get user verification status (public view)
     * @param userAddress Address to check
     * @return isVerified Whether the user is verified
     * @return createdAt When the user was registered
     * @return longevity User's longevity score
     */
    function getUserStatus(address userAddress) 
        external 
        view 
        returns (bool isVerified, uint256 createdAt, uint256 longevity) 
    {
        require(isRegistered[userAddress], "User not registered");
        
        UserMetadata memory metadata = userMetadata[userAddress];
        return (metadata.isVerified, metadata.createdAt, metadata.longevity);
    }
    
    /**
     * @dev Get verification hash for external verification (without revealing identifier)
     * @param userAddress Address to get hash for
     * @return The verification hash
     */
    function getVerificationHash(address userAddress) external view returns (bytes32) {
        require(isRegistered[userAddress], "User not registered");
        return userMetadata[userAddress].verificationHash;
    }
    
    /**
     * @dev Get total number of registered users
     * @return The count of registered users
     */
    function getTotalUsers() external view returns (uint256) {
        return registeredUsers.length;
    }
    
    /**
     * @dev Get all registered users (admin only)
     * @return Array of user addresses
     */
    function getAllUsers() external view onlyAdmin returns (address[] memory) {
        return registeredUsers;
    }
    
    /**
     * @dev Transfer admin role
     * @param newAdmin Address of the new admin
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }
    
    /**
     * @dev Check if a user is verified (commonly used by other contracts)
     * @param userAddress Address to check
     * @return Whether the user is verified
     */
    function isUserVerified(address userAddress) external view returns (bool) {
        if (!isRegistered[userAddress]) {
            return false;
        }
        return userMetadata[userAddress].isVerified;
    }
}
