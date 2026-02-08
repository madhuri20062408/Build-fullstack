// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FaucetToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    address public faucet;

    error FaucetToken__NotFaucet();
    error FaucetToken__MaxSupplyExceeded();

    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}

    function setFaucet(address _faucet) external onlyOwner {
        faucet = _faucet;
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != faucet) revert FaucetToken__NotFaucet();
        if (totalSupply() + amount > MAX_SUPPLY) revert FaucetToken__MaxSupplyExceeded();
        _mint(to, amount);
    }
}
