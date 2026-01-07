# ERC-20 Token Faucet DApp

## Overview
A decentralized application (DApp) featuring an ERC-20 token faucet with 24-hour rate limiting and lifetime claim caps. Built with Solidity, Hardhat, React, and Docker.

## Architecture
- **Smart Contracts**: 
  - `Token.sol`: ERC-20 token with restricted minting.
  - `TokenFaucet.sol`: Faucet logic with cooldowns and limits.
- **Frontend**: React application with Ethers.js for blockchain interaction.
- **Infrastructure**: Dockerized setup for easy deployment.

## Prerequisites
1.  **Node.js**: v18+
2.  **Docker**: Desktop/Engine installed and running.
3.  **MetaMask**: Installed in browser.
4.  **Sepolia ETH**: Required for deployment (get from [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)).

## Setup & Deployment

1.  **Environment Variables**:
    Copy the example file:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and fill in:
    - `VITE_RPC_URL`: Your Sepolia RPC URL (e.g., from Infura or Alchemy).
    - `PRIVATE_KEY`: Your wallet private key (exported from MetaMask). **Keep this secret!**
    - `ETHERSCAN_API_KEY`: For contract verification (optional).

2.  **Deploy Smart Contracts**:
    Navigate to the `submission` directory and run:
    ```bash
    npm install
    npx hardhat run scripts/deploy.js --network sepolia
    ```
    *This will output the `VITE_TOKEN_ADDRESS` and `VITE_FAUCET_ADDRESS`. Check the console output.*

3.  **Update Deployment Environment**:
    Update your `.env` file (or `frontend/.env` if running locally without docker) with the new contract addresses.

4.  **Run Application**:
    ```bash
    docker compose up
    ```
    Access the app at `http://localhost:3000`.

## Testing
- **Smart Contracts**: 
  ```bash
  npx hardhat test
  ```
- **Frontend Build Verification**:
  ```bash
  cd frontend
  npm install
  npm run build
  ```

## Evaluation Interface
The app exposes `window.__EVAL__` for automated testing:
- `connectWallet()`
- `requestTokens()`
- `getBalance(address)`
- `canClaim(address)`
- `getRemainingAllowance(address)`
- `getContractAddresses()`

## License
MIT
