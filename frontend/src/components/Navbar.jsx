import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProvider, switchNetwork, getBalance } from '../lib/web3';
import { Search, Menu, User, Globe } from 'lucide-react';

export default function Navbar() {
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(null);

    const connectWallet = async () => {
        try {
            if (!window.ethereum) return alert('Please install MetaMask');
            await switchNetwork();
            const provider = getProvider();
            const accounts = await provider.send("eth_requestAccounts", []);
            setAccount(accounts[0]);

            // Fetch balance
            const bal = await getBalance(accounts[0]);
            setBalance(parseFloat(bal).toFixed(4));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        // Check if already connected, but don't force connect popup
        const checkConnection = async () => {
            if (window.ethereum) {
                const provider = getProvider();
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    const bal = await getBalance(accounts[0]);
                    setBalance(parseFloat(bal).toFixed(4));
                }

                window.ethereum.on('accountsChanged', async (accounts) => {
                    setAccount(accounts[0] || null);
                    if (accounts[0]) {
                        const bal = await getBalance(accounts[0]);
                        setBalance(parseFloat(bal).toFixed(4));
                    } else {
                        setBalance(null);
                    }
                });
            }
        };
        checkConnection();
    }, []);

    return (
        <nav className="border-b sticky top-0 bg-white z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-1 group">
                        <div className="text-primary group-hover:text-rose-600 transition">
                            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', height: '32px', width: '32px', fill: 'currentcolor' }}><path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 3.162.723 4.691-.263 2.156-1.265 3.98-2.85 5.152-1.596 1.18-3.79 1.68-6.163.603a.48.48 0 0 0-.421 0c-2.374 1.077-4.567.577-6.162-.603-1.586-1.172-2.588-2.996-2.85-5.152-.187-1.529.056-3.1.723-4.691l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.239 0-2.053.539-2.987 2.211-.065.116-.136.24-.213.379l-.512.982c-1.786 3.502-6.09 12.399-7.078 14.691-.56 1.336-.758 2.548-.606 3.69.202 1.515.95 2.76 2.087 3.6.996.736 2.362 1.018 4.053.467l.39-.14c.15-.06.313-.06.463 0l.39.14c1.69.55 3.056.269 4.053-.467 1.137-.84 1.885-2.085 2.087-3.6.152-1.142-.046-2.354-.606-3.69-.988-2.292-5.292-11.189-7.078-14.691l-.512-.982a16.69 16.69 0 0 1-.213-.379C18.053 3.539 17.24 3 16 3zm0 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path></svg>
                        </div>
                        <span className="text-primary font-bold text-xl hidden md:block group-hover:text-rose-600 transition">Polyhome</span>
                    </Link>

                    {/* Search Bar (Mock) */}
                    <div className="hidden md:flex items-center border rounded-full py-2 px-4 shadow-sm hover:shadow-md transition cursor-pointer">
                        <div className="font-semibold px-4 border-r">Anywhere</div>
                        <div className="font-semibold px-4 border-r">Any week</div>
                        <div className="text-gray-500 px-4 font-light">Add guests</div>
                        <div className="bg-primary p-2 rounded-full text-white hover:bg-rose-600 transition">
                            <Search size={16} />
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        <Link to="/create" className="font-semibold hover:bg-gray-100 px-4 py-2 rounded-full transition duration-200">
                            Host on Polyhome
                        </Link>
                        <div className="hover:bg-gray-100 p-2 rounded-full cursor-pointer transition duration-200">
                            <Globe size={18} />
                        </div>

                        <div
                            className="flex items-center gap-2 border rounded-full p-1 pl-3 hover:shadow-md transition duration-200 cursor-pointer select-none"
                            onClick={!account ? connectWallet : undefined}
                        >
                            <Menu size={18} />
                            <div className="bg-gray-500 text-white rounded-full p-1">
                                <User size={18} />
                            </div>
                            {account ? (
                                <div className="flex flex-col text-right mr-2">
                                    <span className="text-xs font-mono font-semibold text-gray-700">
                                        {account.slice(0, 6)}...
                                    </span>
                                    {balance && (
                                        <span className="text-[10px] text-gray-500 font-medium">
                                            {balance} MATIC
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm font-semibold text-gray-600 px-2">Connect</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
