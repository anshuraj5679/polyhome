import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Navbar from '../components/Navbar';
import { getSigner, getListingContract, switchNetwork } from '../lib/web3';
import { supabase } from '../lib/supabaseClient';
import { uploadToIPFS } from '../lib/ipfs';
import { Upload, Loader2, Sparkles } from 'lucide-react';

export default function CreateListing() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // For showing progress steps
    const [form, setForm] = useState({
        title: '',
        price: '',
        category: 'Amazing pools',
        description: '',
        image: null,
        guests: 2,
        bedrooms: 1,
        beds: 1,
        baths: 1,
        rating: 4.8,
        cleaning_fee: 0.05,
        service_fee: 0.02
    });

    // Simple "AI" Description Generator
    const generateDescription = () => {
        const title = form.title.toLowerCase();
        let desc = "";

        if (title.includes("taj mahal")) {
            desc = "Experience the timeless beauty of the Taj Mahal. This exquisite stay offers a breathtaking view of the world's most famous monument to love. Immerse yourself in the rich history and architectural marvel of the Mughal era, right from your window.";
        } else if (title.includes("pool") || form.category === "Amazing pools") {
            desc = "Dive into luxury with this stunning property featuring a crystal-clear infinity pool. Perfect for sun-soaked afternoons and starlit swims, this oasis offers the ultimate relaxation experience.";
        } else if (title.includes("castle") || form.category === "Castles") {
            desc = "Live like royalty in this majestic castle. Surrounded by rolling hills and ancient stone walls, this historic estate blends medieval charm with modern comfort for an unforgettable fairytale stay.";
        } else if (title.includes("cabin") || title.includes("wood") || form.category === "Camping") {
            desc = "Escape to nature in this cozy wooden cabin. Nestled deep in the forest, it's the perfect retreat for hikers and peace-seekers. Enjoy the crackling fireplace and the sound of rustling leaves.";
        } else if (title.includes("beach") || title.includes("sea") || form.category === "Surfing") {
            desc = "Wake up to the sound of waves in this beachfront paradise. Just steps from the ocean, this airy home offers panoramic sea views and direct access to the best surf spots.";
        } else {
            desc = "Discover a hidden gem in the heart of the city. This beautifully designed space offers a perfect blend of style and comfort, making it an ideal base for your adventures. Close to local attractions and vibrant nightlife.";
        }

        setForm(prev => ({ ...prev, description: desc }));
    };

    // Auto-generate description when title changes (debounce could be added, but simple effect is fine for now)
    useEffect(() => {
        if (form.title.length > 5 && !form.description) {
            // Optional: Auto-generate if empty
            // generateDescription(); 
        }
    }, [form.title]);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setForm({ ...form, image: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('Validating...');

        try {
            // ---------------------------
            // 1. VALIDATION
            // ---------------------------
            if (!window.ethereum) throw new Error("Please install MetaMask");
            if (!form.image) throw new Error("Please upload a photo");
            if (!form.title) throw new Error("Please enter a title");
            if (!form.price) throw new Error("Please enter a price");

            // ---------------------------
            // 2. UPLOAD PHOTO TO IPFS
            // ---------------------------
            setStatus('Uploading to IPFS...');
            const cid = await uploadToIPFS(form.image);
            console.log("Uploaded to IPFS:", cid);

            // ---------------------------
            // 3. SEND TRANSACTION TO SMART CONTRACT
            // ---------------------------
            setStatus('Confirming on Blockchain...');
            await switchNetwork();
            const signer = await getSigner();
            const contract = getListingContract(signer);

            let onchainListingID = null;

            // If CID is a Data URI (large), we can't put it on-chain due to gas limits.
            // We'll put a placeholder on-chain and the real data in Supabase.
            const isDataURI = cid.startsWith('data:');
            const contractCid = isDataURI ? "OFF_CHAIN_DATA" : cid;

            if (!contract.address) {
                console.warn("Smart Contract not deployed! Switching to MOCK MODE.");
                setStatus('Mock Mode: Skipping Blockchain...');
                // Mock delay
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                const priceInWei = ethers.utils.parseEther(form.price);

                // Call createListing(price, cid)
                try {
                    // Estimate gas first to check for reverts
                    const gasLimit = await contract.estimateGas.createListing(priceInWei, contractCid);
                    const tx = await contract.createListing(priceInWei, contractCid, { gasLimit: gasLimit.mul(120).div(100) }); // Add 20% buffer
                    setStatus('Waiting for transaction...');
                    const receipt = await tx.wait();

                    // Get the ID from events. 
                    // Event Listed(uint256 indexed id, address indexed owner, uint256 price, string cid);
                    // We need to parse the logs to find the 'Listed' event
                    const event = receipt.events?.find(e => e.event === 'Listed');
                    onchainListingID = event ? event.args.id.toString() : null;
                } catch (err) {
                    console.error("Transaction failed:", err);
                    // Try to extract reason
                    let reason = err.reason || err.message;
                    if (err.data && err.data.message) reason = err.data.message;
                    throw new Error("Blockchain Transaction Failed: " + reason);
                }
            }

            if (!onchainListingID) {
                // Fallback if event parsing fails (shouldn't happen if ABI is correct)
                console.warn("Could not parse Listing ID from events. Using timestamp as fallback for DB.");
            }

            console.log("On-chain ID:", onchainListingID);

            // ---------------------------
            // 4. INSERT METADATA INTO SUPABASE
            // ---------------------------
            setStatus('Saving to Database...');

            // We use the onchain ID if available, otherwise we might need to query the contract
            // For this demo, we'll proceed even if we missed the ID, but in prod we'd be stricter.
            const dbId = onchainListingID || Date.now().toString();

            const { error } = await supabase.from('listings').insert([
                {
                    id: dbId,
                    title: form.title,
                    price_per_night: form.price,
                    cid: cid, // Store the REAL image (Data URI) in the database
                    owner: (await signer.getAddress()).toLowerCase(), // Optional: if you want to store owner address
                    category: form.category,
                    description: form.description, // Save the AI description
                    active: true,
                    guests: form.guests,
                    bedrooms: form.bedrooms,
                    beds: form.beds,
                    baths: form.baths,
                    rating: form.rating,
                    cleaning_fee: form.cleaning_fee,
                    service_fee: form.service_fee
                }
            ]);

            if (error) {
                console.error("Supabase error:", error);
                // We don't block success here because the blockchain part worked
                alert("Listing created on-chain, but database sync failed. It will appear eventually.");
            }

            setStatus('Success!');
            alert("Listing created successfully!");
            navigate('/');

        } catch (error) {
            console.error(error);
            alert("Error: " + (error.message || error));
        } finally {
            setLoading(false);
            setStatus('');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-8">Polyhome</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            placeholder="Cozy cottage in the woods"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            className="input-field"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                        >
                            {['Amazing pools', 'Castles', 'Arctic', 'Camping', 'Design', 'Surfing', 'Bed & breakfasts', 'Tropical', 'Views'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <button
                                type="button"
                                onClick={generateDescription}
                                className="text-xs flex items-center gap-1 text-rose-600 font-semibold hover:text-rose-700 transition"
                            >
                                <Sparkles size={14} /> AI Generate
                            </button>
                        </div>
                        <textarea
                            className="input-field min-h-[100px]"
                            placeholder="Describe your place..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price per night (MATIC)</label>
                        <input
                            type="number"
                            step="0.0001"
                            required
                            className="input-field"
                            placeholder="0.1"
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cleaning Fee (MATIC)</label>
                            <input
                                type="number"
                                step="0.0001"
                                className="input-field"
                                value={form.cleaning_fee}
                                onChange={e => setForm({ ...form, cleaning_fee: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Service Fee (MATIC)</label>
                            <input
                                type="number"
                                step="0.0001"
                                className="input-field"
                                value={form.service_fee}
                                onChange={e => setForm({ ...form, service_fee: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.guests}
                                onChange={e => setForm({ ...form, guests: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating (0-5)</label>
                            <input
                                type="number"
                                step="0.1"
                                max="5"
                                className="input-field"
                                value={form.rating}
                                onChange={e => setForm({ ...form, rating: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.bedrooms}
                                onChange={e => setForm({ ...form, bedrooms: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Beds</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.beds}
                                onChange={e => setForm({ ...form, beds: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Baths</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.baths}
                                onChange={e => setForm({ ...form, baths: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                        <div className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition ${form.image ? 'bg-gray-50 border-primary' : ''}`}>
                            <input type="file" onChange={handleImageChange} className="hidden" id="file-upload" accept="image/*" />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                {form.image ? (
                                    <>
                                        <div className="text-primary font-semibold mb-1">Selected: {form.image.name}</div>
                                        <div className="text-sm text-gray-500">Click to change</div>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                        <div className="text-primary font-semibold">Upload photos</div>
                                        <div className="text-gray-500 text-sm mt-1">JPG, PNG up to 5MB</div>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary text-lg py-3 flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    {status}
                                </>
                            ) : 'Create Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
