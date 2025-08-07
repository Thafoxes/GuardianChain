// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./UserVerification.sol";
import "./RewardToken.sol";

/**
 * @title ReportContract
 * @dev Contract for managing encrypted reports with verification and rewards
 */
contract ReportContract {
    
    struct Report {
        uint256 id;
        address reporter;
        bytes encryptedContent; // Encrypted report content for privacy
        uint256 timestamp;
        ReportStatus status;
        address verifiedBy; // Police/Authority who verified
        uint256 verificationTimestamp;
        bytes32 contentHash; // Hash for integrity without revealing content
        bool rewardClaimed;
    }
    
    enum ReportStatus {
        Pending,      // Report submitted, awaiting investigation
        Investigating, // Under investigation
        Verified,     // Verified by authority
        Rejected,     // Report rejected/invalid
        Closed        // Case closed
    }
    
    // State variables
    uint256 private reportCounter;
    mapping(uint256 => Report) private reports;
    mapping(address => uint256[]) private userReports; // User's report IDs
    mapping(address => bool) public authorizedVerifiers; // Police/Authorities
    
    // Contract references
    UserVerification public userVerification;
    RewardToken public rewardToken;
    
    // Reward configuration
    uint256 public constant REPORT_REWARD = 1 * 10 ** 18; // 1 GCR token
    uint256 public constant VERIFICATION_REWARD = 0.5 * 10 ** 18; // 0.5 GCR token for verifier
    
    // Admin
    address public admin;
    
    // Events
    event ReportSubmitted(uint256 indexed reportId, address indexed reporter, uint256 timestamp);
    event ReportStatusUpdated(uint256 indexed reportId, ReportStatus status, address indexed verifier);
    event ReportVerified(uint256 indexed reportId, address indexed reporter, address indexed verifier);
    event RewardClaimed(uint256 indexed reportId, address indexed reporter, uint256 amount);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyVerifiedUser() {
        require(userVerification.isUserVerified(msg.sender), "User must be verified to submit reports");
        _;
    }
    
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender], "Not authorized to verify reports");
        _;
    }
    
    modifier reportExists(uint256 reportId) {
        require(reportId > 0 && reportId <= reportCounter, "Report does not exist");
        _;
    }
    
    constructor(address _userVerification, address _rewardToken) {
        admin = msg.sender;
        userVerification = UserVerification(_userVerification);
        rewardToken = RewardToken(_rewardToken);
        reportCounter = 0;
        
        // Admin is authorized verifier by default
        authorizedVerifiers[msg.sender] = true;
    }
    
    /**
     * @dev Submit a new encrypted report
     * @param content Plain text content that will be encrypted
     */
    function submitReport(string memory content) external onlyVerifiedUser {
        require(bytes(content).length > 0, "Report content cannot be empty");
        require(bytes(content).length <= 10000, "Report content too long"); // Reasonable limit
        
        reportCounter++;
        uint256 reportId = reportCounter;
        
        // Generate encryption key using reporter's address and secure randomness
        bytes memory seed = Sapphire.randomBytes(32, "report_encryption");
        bytes32 encryptionKey = keccak256(abi.encodePacked(msg.sender, reportId, seed));
        
        // Encrypt the report content
        bytes memory nonceBytes = Sapphire.randomBytes(12, "report_nonce");
        bytes12 nonce = bytes12(nonceBytes);
        bytes memory encryptedContent = Sapphire.encrypt(
            encryptionKey,
            nonce,
            bytes(content),
            abi.encodePacked(msg.sender, reportId)
        );
        
        // Create content hash for integrity verification
        bytes32 contentHash = keccak256(abi.encodePacked(content, msg.sender, block.timestamp));
        
        // Store the report
        reports[reportId] = Report({
            id: reportId,
            reporter: msg.sender,
            encryptedContent: abi.encodePacked(nonce, encryptedContent), // Store nonce + encrypted data
            timestamp: block.timestamp,
            status: ReportStatus.Pending,
            verifiedBy: address(0),
            verificationTimestamp: 0,
            contentHash: contentHash,
            rewardClaimed: false
        });
        
        // Add to user's report list
        userReports[msg.sender].push(reportId);
        
        emit ReportSubmitted(reportId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update report status (only authorized verifiers)
     * @param reportId ID of the report to update
     * @param newStatus New status to set
     */
    function updateReportStatus(uint256 reportId, ReportStatus newStatus) 
        external 
        onlyAuthorizedVerifier 
        reportExists(reportId) 
    {
        Report storage report = reports[reportId];
        require(report.status != ReportStatus.Closed, "Cannot update closed report");
        
        ReportStatus oldStatus = report.status;
        report.status = newStatus;
        
        // If verifying the report
        if (newStatus == ReportStatus.Verified && oldStatus != ReportStatus.Verified) {
            report.verifiedBy = msg.sender;
            report.verificationTimestamp = block.timestamp;
            
            emit ReportVerified(reportId, report.reporter, msg.sender);
            
            // Mint reward for verifier
            rewardToken.mint(msg.sender, VERIFICATION_REWARD);
        }
        
        emit ReportStatusUpdated(reportId, newStatus, msg.sender);
    }
    
    /**
     * @dev Claim reward for verified report (only reporter)
     * @param reportId ID of the verified report
     */
    function claimReward(uint256 reportId) external reportExists(reportId) {
        Report storage report = reports[reportId];
        require(report.reporter == msg.sender, "Only reporter can claim reward");
        require(report.status == ReportStatus.Verified, "Report must be verified to claim reward");
        require(!report.rewardClaimed, "Reward already claimed");
        
        report.rewardClaimed = true;
        
        // Mint and transfer reward to reporter
        rewardToken.mint(msg.sender, REPORT_REWARD);
        
        emit RewardClaimed(reportId, msg.sender, REPORT_REWARD);
    }
    
    /**
     * @dev Get decrypted report content (only reporter or authorized verifier)
     * @param reportId ID of the report
     * @return The decrypted content
     */
    function getReportContent(uint256 reportId) 
        external 
        view 
        reportExists(reportId) 
        returns (string memory) 
    {
        Report memory report = reports[reportId];
        require(
            msg.sender == report.reporter || authorizedVerifiers[msg.sender],
            "Not authorized to view report content"
        );
        
        // Extract nonce and encrypted data
        bytes12 nonce;
        bytes memory encryptedData = new bytes(report.encryptedContent.length - 12);
        
        // Extract the 12-byte nonce
        for (uint i = 0; i < 12; i++) {
            nonce |= bytes12(report.encryptedContent[i]) >> (i * 8);
        }
        // Extract the encrypted data
        for (uint i = 12; i < report.encryptedContent.length; i++) {
            encryptedData[i - 12] = report.encryptedContent[i];
        }
        
        // Regenerate the same encryption key
        bytes memory seed = Sapphire.randomBytes(32, "report_encryption");
        bytes32 encryptionKey = keccak256(abi.encodePacked(report.reporter, reportId, seed));
        
        // Decrypt the content
        bytes memory decryptedBytes = Sapphire.decrypt(
            encryptionKey,
            nonce,
            encryptedData,
            abi.encodePacked(report.reporter, reportId)
        );
        
        return string(decryptedBytes);
    }
    
    /**
     * @dev Get public report information (without sensitive content)
     * @param reportId ID of the report
     * @return id The report ID
     * @return reporter The address of the reporter
     * @return timestamp When the report was submitted
     * @return status Current status of the report
     * @return verifiedBy Address of the verifier (if verified)
     * @return verificationTimestamp When the report was verified
     * @return contentHash Hash of the report content for integrity
     * @return rewardClaimed Whether the reward has been claimed
     */
    function getReportInfo(uint256 reportId) 
        external 
        view 
        reportExists(reportId) 
        returns (
            uint256 id,
            address reporter,
            uint256 timestamp,
            ReportStatus status,
            address verifiedBy,
            uint256 verificationTimestamp,
            bytes32 contentHash,
            bool rewardClaimed
        ) 
    {
        Report memory report = reports[reportId];
        return (
            report.id,
            report.reporter,
            report.timestamp,
            report.status,
            report.verifiedBy,
            report.verificationTimestamp,
            report.contentHash,
            report.rewardClaimed
        );
    }
    
    /**
     * @dev Get user's reports
     * @param user Address of the user
     * @return Array of report IDs
     */
    function getUserReports(address user) external view returns (uint256[] memory) {
        return userReports[user];
    }
    
    /**
     * @dev Get total number of reports
     * @return Total report count
     */
    function getTotalReports() external view returns (uint256) {
        return reportCounter;
    }
    
    /**
     * @dev Get reports by status (for authorities)
     * @param status Status to filter by
     * @param limit Maximum number of reports to return
     * @return Array of report IDs with the specified status
     */
    function getReportsByStatus(ReportStatus status, uint256 limit) 
        external 
        view 
        onlyAuthorizedVerifier 
        returns (uint256[] memory) 
    {
        require(limit > 0 && limit <= 100, "Invalid limit");
        
        uint256[] memory filteredReports = new uint256[](limit);
        uint256 count = 0;
        
        for (uint256 i = reportCounter; i >= 1 && count < limit; i--) {
            if (reports[i].status == status) {
                filteredReports[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = filteredReports[i];
        }
        
        return result;
    }
    
    /**
     * @dev Add authorized verifier
     * @param verifier Address to authorize
     */
    function addVerifier(address verifier) external onlyAdmin {
        require(verifier != address(0), "Invalid verifier address");
        authorizedVerifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }
    
    /**
     * @dev Remove authorized verifier
     * @param verifier Address to remove authorization
     */
    function removeVerifier(address verifier) external onlyAdmin {
        authorizedVerifiers[verifier] = false;
        emit VerifierRemoved(verifier);
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
     * @dev Emergency function to update contract references
     */
    function updateContracts(address _userVerification, address _rewardToken) external onlyAdmin {
        if (_userVerification != address(0)) {
            userVerification = UserVerification(_userVerification);
        }
        if (_rewardToken != address(0)) {
            rewardToken = RewardToken(_rewardToken);
        }
    }
}
