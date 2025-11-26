import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import { getProvider, getListingContract } from '../lib/web3';
import { supabase } from '../lib/supabaseClient';
import { Waves, Castle, Snowflake, Tent, Palette, Wind, Coffee, Palmtree, Mountain } from 'lucide-react';
import { ethers } from 'ethers';

export default function Home() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Amazing pools');
    const [account, setAccount] = useState(null);

    useEffect(() => {
        loadListings();
        checkAccount();
    }, []);

    const checkAccount = async () => {
        if (window.ethereum) {
            const provider = getProvider();
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0].toLowerCase());
            }

            window.ethereum.on('accountsChanged', (accounts) => {
                setAccount(accounts[0] ? accounts[0].toLowerCase() : null);
            });
        }
    };

    async function loadListings() {
        try {
            setLoading(true);

            // 1. Try fetching from Supabase (works for both Real and Mock/LocalStorage)
            const { data, error } = await supabase.from('listings').select('*');

            if (!error && data && data.length > 0) {
                setListings(data);
            } else {
                // 2. Fallback: Query Blockchain directly if Supabase is empty (legacy/real mode without DB sync)
                // This is less likely to have metadata like 'category', but good for backup.
                console.log("Supabase empty, trying blockchain...");
                const provider = getProvider();
                const contract = getListingContract(provider);

                if (contract.address) {
                    const count = await contract.getListingCount();
                    const items = [];
                    for (let i = 1; i <= count; i++) {
                        const item = await contract.getListing(i);
                        if (item.active) {
                            items.push({
                                id: item.id.toString(),
                                price_per_night: ethers.utils.formatEther(item.price), // Convert Wei to Ether string
                                cid: item.cid,
                                owner: item.owner.toLowerCase(),
                                category: 'Amazing pools' // Default for on-chain only items
                            });
                        }
                    }
                    setListings(items);
                }
            }
        } catch (error) {
            console.error("Error loading listings:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = (id) => {
        setListings(prev => prev.filter(item => item.id.toString() !== id.toString()));
    };

    // Filter listings by category
    const filteredListings = listings.filter(l =>
        // If listing has no category (legacy), show it in 'Amazing pools' or 'All'? 
        // Let's assume 'Amazing pools' as default or show all if category matches.
        l.category === selectedCategory || (!l.category && selectedCategory === 'Amazing pools')
    );

    const categories = [
        { name: 'Amazing pools', icon: <Waves size={24} /> },
        { name: 'Castles', icon: <Castle size={24} /> },
        { name: 'Arctic', icon: <Snowflake size={24} /> },
        { name: 'Camping', icon: <Tent size={24} /> },
        { name: 'Design', icon: <Palette size={24} /> },
        { name: 'Surfing', icon: <Wind size={24} /> },
        { name: 'Bed & breakfasts', icon: <Coffee size={24} /> },
        { name: 'Tropical', icon: <Palmtree size={24} /> },
        { name: 'Views', icon: <Mountain size={24} /> },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Categories */}
                <div className="flex gap-8 overflow-x-auto pb-4 mb-6 no-scrollbar items-center">
                    {categories.map((cat) => (
                        <div
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`flex flex-col items-center gap-2 min-w-[64px] cursor-pointer border-b-2 pb-2 transition duration-200 group ${selectedCategory === cat.name ? 'border-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'}`}
                        >
                            <div className={`transition ${selectedCategory === cat.name ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>{cat.icon}</div>
                            <span className={`text-xs font-semibold whitespace-nowrap ${selectedCategory === cat.name ? 'text-black' : 'group-hover:text-black'}`}>{cat.name}</span>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-200 aspect-square rounded-xl mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredListings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredListings.map((listing) => (
                            <ListingCard
                                key={listing.id.toString()}
                                listing={listing}
                                account={account}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-gray-300 mb-4">
                            <Waves size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No listings in {selectedCategory}</h3>
                        <p className="text-gray-500">Be the first to create a listing in this category!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
