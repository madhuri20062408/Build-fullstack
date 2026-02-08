import { ethers } from "ethers";
import TokenABI from "../abis/TokenABI.json";
import FaucetABI from "../abis/FaucetABI.json";

const getTokenAddress = () => import.meta.env.VITE_TOKEN_ADDRESS;
const getFaucetAddress = () => import.meta.env.VITE_FAUCET_ADDRESS;

export const getProvider = () => {
    if (!window.ethereum) throw new Error("No crypto wallet found");
    return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
    const provider = getProvider();
    return await provider.getSigner();
};

export const getTokenContract = async (signerOrProvider) => {
    const address = getTokenAddress();
    if (!address) throw new Error("Token address not set");
    return new ethers.Contract(address, TokenABI.abi, signerOrProvider);
};

export const getFaucetContract = async (signerOrProvider) => {
    const address = getFaucetAddress();
    if (!address) throw new Error("Faucet address not set");
    return new ethers.Contract(address, FaucetABI.abi, signerOrProvider);
};

export const formatUnits = (value) => ethers.formatUnits(value, 18);
export const parseUnits = (value) => ethers.parseUnits(value, 18);
