import { ethers } from 'ethers';
import ListingArtifact from '../contracts/Listing.json';
import EscrowArtifact from '../contracts/Escrow.json';
import ContractAddress from '../contracts/contract-address.json';

// Amoy Chain ID
const AMOY_CHAIN_ID = '0x13882'; // 80002 in hex
const AMOY_RPC_URL = "https://rpc-amoy.polygon.technology/";

export const getProvider = () => {
    if (window.ethereum) {
        return new ethers.providers.Web3Provider(window.ethereum);
    }
    return new ethers.providers.JsonRpcProvider(AMOY_RPC_URL);
};

export const getSigner = async () => {
    const provider = getProvider();
    await provider.send("eth_requestAccounts", []);
    return provider.getSigner();
};

export const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: AMOY_CHAIN_ID }],
        });
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: AMOY_CHAIN_ID,
                            chainName: 'Polygon Amoy Testnet',
                            rpcUrls: [AMOY_RPC_URL],
                            nativeCurrency: {
                                name: 'MATIC',
                                symbol: 'MATIC',
                                decimals: 18,
                            },
                            blockExplorerUrls: ['https://amoy.polygonscan.com/'],
                        },
                    ],
                });
            } catch (addError) {
                console.error(addError);
            }
        }
    }
};

export const getListingContract = (signerOrProvider) => {
    // Check if address is valid
    if (!ContractAddress.Listing || ContractAddress.Listing === "") {
        console.warn("Listing contract address is empty. Contracts may not be deployed.");
        return { address: null }; // Return dummy object to prevent crash
    }
    return new ethers.Contract(ContractAddress.Listing, ListingArtifact.abi, signerOrProvider);
};

export const getEscrowContract = (signerOrProvider) => {
    if (!ContractAddress.Escrow || ContractAddress.Escrow === "") {
        console.warn("Escrow contract address is empty. Contracts may not be deployed.");
        return { address: null };
    }
    return new ethers.Contract(ContractAddress.Escrow, EscrowArtifact.abi, signerOrProvider);
};

export const getBalance = async (address) => {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
};
