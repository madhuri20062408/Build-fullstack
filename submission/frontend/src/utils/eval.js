import { ethers } from "ethers";
import { connectWallet } from "./wallet";
import { getProvider, getSigner, getTokenContract, getFaucetContract, formatUnits } from "./contracts";

window.__EVAL__ = {
    connectWallet: async () => {
        try {
            const account = await connectWallet();
            return account;
        } catch (e) {
            throw new Error("Wallet connection failed: " + e.message);
        }
    },

    requestTokens: async () => {
        try {
            const signer = await getSigner();
            const faucet = await getFaucetContract(signer);
            const tx = await faucet.requestTokens();
            await tx.wait();
            return tx.hash;
        } catch (e) {
            // Try to extract internal error message
            let msg = e.message;
            if (e.reason) msg = e.reason;
            if (e.info?.error?.message) msg = e.info.error.message;
            throw new Error(msg);
        }
    },

    getBalance: async (address) => {
        try {
            const provider = getProvider();
            const token = await getTokenContract(provider);
            const bal = await token.balanceOf(address);
            return bal.toString();
        } catch (e) {
            throw new Error("Get Balance failed: " + e.message);
        }
    },

    canClaim: async (address) => {
        try {
            const provider = getProvider();
            const faucet = await getFaucetContract(provider);
            return await faucet.canClaim(address);
        } catch (e) {
            throw new Error("canClaim failed: " + e.message);
        }
    },

    getRemainingAllowance: async (address) => {
        try {
            const provider = getProvider();
            const faucet = await getFaucetContract(provider);
            const allowance = await faucet.remainingAllowance(address);
            return allowance.toString();
        } catch (e) {
            throw new Error("getRemainingAllowance failed: " + e.message);
        }
    },

    getContractAddresses: async () => {
        return {
            token: import.meta.env.VITE_TOKEN_ADDRESS,
            faucet: import.meta.env.VITE_FAUCET_ADDRESS
        };
    }
};
