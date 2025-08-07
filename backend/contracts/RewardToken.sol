// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RewardToken
 * @dev Simple ERC20-like token for rewarding users
 */
contract RewardToken {
    string public constant name = "GuardianChain Reward Token";
    string public constant symbol = "GCR";
    uint8 public constant decimals = 18;
    
    uint256 public totalSupply;
    address public owner;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Authorized contracts that can mint/burn tokens
    mapping(address => bool) public authorizedMinters;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender], "Not authorized to mint tokens");
        _;
    }
    
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply * 10 ** decimals;
        balanceOf[msg.sender] = totalSupply;
        authorizedMinters[msg.sender] = true; // Owner is authorized minter by default
        
        emit Transfer(address(0), msg.sender, totalSupply);
        emit MinterAdded(msg.sender);
    }
    
    /**
     * @dev Transfer tokens
     * @param to Address to transfer tokens to
     * @param value Amount of tokens to transfer
     * @return success Whether the transfer was successful
     */
    function transfer(address to, uint256 value) external returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    /**
     * @dev Approve spending
     * @param spender Address to approve for spending
     * @param value Amount to approve for spending
     * @return success Whether the approval was successful
     */
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    /**
     * @dev Transfer from approved amount
     * @param from Address to transfer tokens from
     * @param to Address to transfer tokens to
     * @param value Amount of tokens to transfer
     * @return success Whether the transfer was successful
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        
        emit Transfer(from, to, value);
        return true;
    }
    
    /**
     * @dev Mint new tokens (only authorized minters)
     */
    function mint(address to, uint256 value) external onlyAuthorizedMinter {
        require(to != address(0), "Cannot mint to zero address");
        
        totalSupply += value;
        balanceOf[to] += value;
        
        emit Transfer(address(0), to, value);
    }
    
    /**
     * @dev Burn tokens
     */
    function burn(uint256 value) external {
        require(balanceOf[msg.sender] >= value, "Insufficient balance to burn");
        
        balanceOf[msg.sender] -= value;
        totalSupply -= value;
        
        emit Transfer(msg.sender, address(0), value);
    }
    
    /**
     * @dev Add authorized minter
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove authorized minter
     */
    function removeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner address");
        owner = newOwner;
    }
}
