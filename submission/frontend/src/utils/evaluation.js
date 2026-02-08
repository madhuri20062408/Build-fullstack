import { connectWallet } from './wallet';
import { getProvider, getSigner, getTokenContract, getFaucetContract, formatUnits } from './contracts';

export const setupEvaluation = () => {
    const evalInterface = {
        connectWallet: async () => {
            return await connectWallet();
        },
        requestTokens: async () => {
            const signer = await getSigner();
            const faucet = await getFaucetContract(signer);
            const tx = await faucet.requestTokens();
            return await tx.wait();
        },
        getBalance: async (address) => {
            const provider = getProvider();
            const token = await getTokenContract(provider);
            const balance = await token.balanceOf(address);
            return formatUnits(balance);
        },
        canClaim: async (address) => {
            const provider = getProvider();
            const faucet = await getFaucetContract(provider);
            return await faucet.canClaim(address);
        },
        getRemainingAllowance: async (address) => {
            const provider = getProvider();
            const faucet = await getFaucetContract(provider);
            const allowance = await faucet.remainingAllowance(address);
            return formatUnits(allowance);
        },
        getContractAddresses: () => {
            return {
                token: import.meta.env.VITE_TOKEN_ADDRESS,
                faucet: import.meta.env.VITE_FAUCET_ADDRESS
            };
        }
    };
    window.__EVAL__ = evalInterface;
    window.EVAL = evalInterface;
};
