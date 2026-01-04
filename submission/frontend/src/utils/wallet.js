export const connectWallet = async () => {
    if (!window.ethereum) {
        throw new Error("No crypto wallet found. Please install MetaMask.");
    }

    try {
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
        });
        return accounts[0];
    } catch (err) {
        throw new Error(err.message);
    }
};

export const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return null;

    try {
        const accounts = await window.ethereum.request({
            method: "eth_accounts",
        });

        if (accounts.length > 0) {
            return accounts[0];
        } else {
            return null;
        }
    } catch (err) {
        return null;
    }
};
