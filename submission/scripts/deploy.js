const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting deployment...");

    // 1. Deploy Token
    const Token = await hre.ethers.getContractFactory("FaucetToken");
    const token = await Token.deploy("SepoliaFaucetToken", "SFT");
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`Token deployed to: ${tokenAddress}`);

    // 2. Deploy Faucet
    const Faucet = await hre.ethers.getContractFactory("TokenFaucet");
    const faucet = await Faucet.deploy(tokenAddress);
    await faucet.waitForDeployment();
    const faucetAddress = await faucet.getAddress();
    console.log(`Faucet deployed to: ${faucetAddress}`);

    // 3. Grant minting role to faucet
    console.log("Setting faucet in token contract...");
    const tx = await token.setFaucet(faucetAddress);
    await tx.wait();
    console.log("Faucet set as minter.");

    // Save addresses for frontend
    const envPath = path.join(__dirname, "../frontend/.env");
    const envContent = `VITE_RPC_URL=${process.env.VITE_RPC_URL}\nVITE_TOKEN_ADDRESS=${tokenAddress}\nVITE_FAUCET_ADDRESS=${faucetAddress}\n`;

    // Also append to root .env for reference/docker
    const rootEnvPath = path.join(__dirname, "../.env");
    // We won't overwrite, just log them or maybe create a deployment-address file
    console.log("Deployment complete.");
    console.log("----------------------------------------------------");
    console.log(`VITE_TOKEN_ADDRESS=${tokenAddress}`);
    console.log(`VITE_FAUCET_ADDRESS=${faucetAddress}`);
    console.log("----------------------------------------------------");

    // Verify contracts
    if (process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting for block confirmations...");
        await token.deploymentTransaction().wait(5);
        await faucet.deploymentTransaction().wait(5);

        console.log("Verifying Token...");
        try {
            await hre.run("verify:verify", {
                address: tokenAddress,
                constructorArguments: ["SepoliaFaucetToken", "SFT"],
            });
        } catch (e) {
            console.log("Verification failed for Token:", e.message);
        }

        console.log("Verifying Faucet...");
        try {
            await hre.run("verify:verify", {
                address: faucetAddress,
                constructorArguments: [tokenAddress],
            });
        } catch (e) {
            console.log("Verification failed for Faucet:", e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
