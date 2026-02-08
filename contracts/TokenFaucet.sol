// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Token.sol";

contract TokenFaucet {
    FaucetToken public token;
    address public admin;
    bool public paused;

    uint256 public constant FAUCET_AMOUNT = 100 * 10**18;
    uint256 public constant COOLDOWN_TIME = 1 days;
    uint256 public constant MAX_CLAIM_AMOUNT = 1000 * 10**18;

    mapping(address => uint256) public lastClaimAt;
    mapping(address => uint256) public totalClaimed;

    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetPaused(bool paused);

    error Faucet__Paused();
    error Faucet__CooldownNotElapsed(uint256 timeRemaining);
    error Faucet__MaxClaimLimitReached();
    error Faucet__Unauthorized();
    error Faucet__InsufficientAllowance();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Faucet__Unauthorized();
        _;
    }

    constructor(address _token) {
        token = FaucetToken(_token);
        admin = msg.sender;
        paused = false;
    }

    function requestTokens() external {
        if (paused) revert Faucet__Paused();
        
        if (!canClaim(msg.sender)) {
             if (totalClaimed[msg.sender] >= MAX_CLAIM_AMOUNT) revert Faucet__MaxClaimLimitReached();
             revert Faucet__CooldownNotElapsed(lastClaimAt[msg.sender] + COOLDOWN_TIME - block.timestamp);
        }

        uint256 allowance = remainingAllowance(msg.sender);
        if (allowance < FAUCET_AMOUNT) revert Faucet__InsufficientAllowance();

        lastClaimAt[msg.sender] = block.timestamp;
        totalClaimed[msg.sender] += FAUCET_AMOUNT;

        token.mint(msg.sender, FAUCET_AMOUNT);

        emit TokensClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }

    function canClaim(address user) public view returns (bool) {
        if (paused) return false;
        if (totalClaimed[user] >= MAX_CLAIM_AMOUNT) return false;
        if (block.timestamp < lastClaimAt[user] + COOLDOWN_TIME) return false;
        return true;
    }

    function remainingAllowance(address user) public view returns (uint256) {
        if (totalClaimed[user] >= MAX_CLAIM_AMOUNT) return 0;
        return MAX_CLAIM_AMOUNT - totalClaimed[user];
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit FaucetPaused(_paused);
    }

    function isPaused() external view returns (bool) {
        return paused;
    }
}
