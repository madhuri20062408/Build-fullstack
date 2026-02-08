import { useState, useEffect } from 'react'
import { connectWallet, checkIfWalletIsConnected } from './utils/wallet'
import { getProvider, getSigner, getTokenContract, getFaucetContract, formatUnits } from './utils/contracts'
import { ethers } from "ethers";
import { setupEvaluation } from './utils/evaluation'

function App() {
    const [currentAccount, setCurrentAccount] = useState("")
    const [balance, setBalance] = useState("0")
    const [isLoading, setIsLoading] = useState(false)
    const [lastClaimAt, setLastClaimAt] = useState(0)
    const [cooldown, setCooldown] = useState(0)
    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [lifetimeAllowance, setLifetimeAllowance] = useState("0")

    const FAUCET_COOLDOWN = 24 * 60 * 60 // 24 hours in seconds

    const fetchData = async (account) => {
        try {
            const provider = getProvider();
            const token = await getTokenContract(provider);
            const faucet = await getFaucetContract(provider);

            const bal = await token.balanceOf(account);
            setBalance(formatUnits(bal));

            const lastClaim = await faucet.lastClaimAt(account);
            setLastClaimAt(Number(lastClaim));

            const allowance = await faucet.remainingAllowance(account);
            setLifetimeAllowance(formatUnits(allowance));

            updateCooldown(Number(lastClaim));
        } catch (err) {
            console.error(err);
            // setError("Failed to fetch data. Check if connected to Sepolia.");
        }
    }

    const updateCooldown = (lastClaimTimestamp) => {
        const now = Math.floor(Date.now() / 1000);
        const nextClaimTime = lastClaimTimestamp + FAUCET_COOLDOWN;
        const remaining = nextClaimTime - now;
        setCooldown(remaining > 0 ? remaining : 0);
    }

    useEffect(() => {
        setupEvaluation();
        checkIfWalletIsConnected().then(account => {
            if (account) {
                setCurrentAccount(account);
                fetchData(account);
            }
        });

        const interval = setInterval(() => {
            if (lastClaimAt > 0) updateCooldown(lastClaimAt);
        }, 1000);

        return () => clearInterval(interval);
    }, [lastClaimAt]);

    const connect = async () => {
        try {
            setError("");
            const account = await connectWallet();
            setCurrentAccount(account);
            fetchData(account);
        } catch (err) {
            setError(err.message);
        }
    }

    const claimTokens = async () => {
        try {
            setIsLoading(true);
            setError("");
            setSuccessMsg("");
            const signer = await getSigner();
            const faucet = await getFaucetContract(signer);

            const tx = await faucet.requestTokens();
            await tx.wait();

            setSuccessMsg("Tokens claimed successfully!");
            fetchData(currentAccount);
        } catch (err) {
            console.error(err);
            if (err.info?.error?.message) {
                setError(err.info.error.message);
            } else if (err.reason) {
                setError(err.reason);
            } else {
                setError("Transaction failed. " + (err.message || ""));
            }
        } finally {
            setIsLoading(false);
        }
    }

    const formatTime = (seconds) => {
        if (seconds <= 0) return "Ready to Claim";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10 ring-1 ring-white/5">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text drop-shadow-sm">
                        ERC-20 Faucet
                    </h1>
                    <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">Secure Token Distribution</p>
                </div>

                {!currentAccount ? (
                    <div className="text-center space-y-4">
                        <p className="text-gray-300 mb-6">Connect your wallet to claim testnet tokens.</p>
                        <button
                            onClick={connect}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
                        >
                            Connect Wallet
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Connected Wallet</p>
                            <p className="font-mono text-sm break-all text-blue-300 font-medium">{currentAccount}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold mb-1">Balance</p>
                                <p className="text-2xl font-bold text-white">{parseFloat(balance).toFixed(2)} <span className="text-sm font-normal text-gray-400">TST</span></p>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold mb-1">Lifetime Left</p>
                                <p className="text-2xl font-bold text-white">{parseFloat(lifetimeAllowance).toFixed(0)} <span className="text-sm font-normal text-gray-400">TST</span></p>
                            </div>
                        </div>

                        <div className="text-center py-2">
                            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Cooldown Status</p>
                            <div className={`text-2xl font-bold font-mono tracking-tight ${cooldown > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {formatTime(cooldown)}
                            </div>
                        </div>

                        <button
                            onClick={claimTokens}
                            disabled={isLoading || cooldown > 0 || parseFloat(lifetimeAllowance) <= 0}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform duration-200 border border-transparent ${isLoading || cooldown > 0 || parseFloat(lifetimeAllowance) <= 0
                                ? 'bg-gray-700/50 cursor-not-allowed text-gray-500 border-gray-600/20'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : "Request 100 TST"}
                        </button>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm text-center backdrop-blur-sm animate-fade-in">
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 p-4 rounded-xl text-sm text-center backdrop-blur-sm animate-fade-in">
                                {successMsg}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <footer className='mt-8 text-gray-500 text-xs font-medium tracking-widest uppercase opacity-70'>
                Sepolia Testnet • Secure Faucet
            </footer>
        </div>
    )
}

export default App
