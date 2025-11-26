import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import Navbar from '../components/Navbar';
import { getProvider, getSigner, getListingContract, getEscrowContract, switchNetwork } from '../lib/web3';
import { supabase } from '../lib/supabaseClient';
import { Star, Share, Heart, MapPin, Calendar, User } from 'lucide-react';

export default function ListingDetails() {
    const { id } = useParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [liked, setLiked] = useState(false);

    // Booking State
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);

    useEffect(() => {
        loadListing();
        checkIfLiked();
    }, [id]);

    const checkIfLiked = () => {
        const likes = JSON.parse(localStorage.getItem('liked_listings') || '[]');
        setLiked(likes.includes(id));
    };

    const toggleLike = () => {
        const likes = JSON.parse(localStorage.getItem('liked_listings') || '[]');
        let newLikes;
        if (likes.includes(id)) {
            newLikes = likes.filter(l => l !== id);
        } else {
            newLikes = [...likes, id];
        }
        localStorage.setItem('liked_listings', JSON.stringify(newLikes));
        setLiked(!liked);
    };

    async function loadListing() {
        try {
            // 1. Try fetching from Supabase (Mock/Real) first for metadata
            const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();

            if (!error && data) {
                setListing(data);
            } else {
                // 2. Fallback to Blockchain
                const provider = getProvider();
                const contract = getListingContract(provider);

                if (contract.address) {
                    const item = await contract.getListing(id);
                    setListing({
                        id: item.id.toString(),
                        price_per_night: ethers.utils.formatEther(item.price),
                        cid: item.cid,
                        owner: item.owner,
                        active: item.active
                    });
                } else {
                    console.warn("Listing not found in DB and Contract not deployed.");
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleBook() {
        if (!listing || !checkIn || !checkOut) {
            alert("Please select check-in and check-out dates");
            return;
        }
        setBooking(true);
        try {
            await switchNetwork();
            const signer = await getSigner();
            const escrow = getEscrowContract(signer);

            // Calculate nights
            const start = new Date(checkIn);
            const end = new Date(checkOut);
            const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

            if (nights <= 0) {
                alert("Invalid dates selected");
                setBooking(false);
                return;
            }

            // Calculate total price including fees
            const basePrice = parseFloat(listing.price_per_night) * nights;
            const cleaning = parseFloat(listing.cleaning_fee || 0);
            const service = parseFloat(listing.service_fee || 0);
            const totalEth = (basePrice + cleaning + service).toFixed(4);

            const totalWei = ethers.utils.parseEther(totalEth.toString());

            // Check if contracts are deployed
            if (!escrow.address) {
                // MOCK BOOKING
                console.warn("Escrow contract not deployed. Simulating booking.");
                await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
                alert(`Mock Booking Confirmed for ${nights} nights! Total: ${totalEth} MATIC`);
                setBooking(false);
                return;
            }

            // REAL BOOKING
            const checkInTimestamp = Math.floor(start.getTime() / 1000);
            const checkOutTimestamp = Math.floor(end.getTime() / 1000);

            const tx = await escrow.deposit(listing.owner, listing.id, checkInTimestamp, checkOutTimestamp, { value: totalWei });
            await tx.wait();

            alert("Booking confirmed! Funds in escrow.");
        } catch (error) {
            console.error(error);
            alert("Booking failed: " + (error.message || error));
        } finally {
            setBooking(false);
        }
    }

    // Helper to calculate total price for display
    const calculateTotal = () => {
        if (!checkIn || !checkOut) return null;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (nights <= 0) return null;

        const base = parseFloat(listing.price_per_night) * nights;
        const cleaning = parseFloat(listing.cleaning_fee || 0);
        const service = parseFloat(listing.service_fee || 0);

        return {
            nights,
            base: base.toFixed(4),
            cleaning: cleaning.toFixed(4),
            service: service.toFixed(4),
            total: (base + cleaning + service).toFixed(4)
        };
    };

    const pricing = calculateTotal();

    if (loading) return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-96 bg-gray-200 rounded-xl mb-8"></div>
            </div>
        </div>
    );

    if (!listing) return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Listing not found</h2>
                <p className="text-gray-500 mt-2">It might not exist or hasn't synced yet.</p>
            </div>
        </div>
    );

    const imageUrl = listing.cid && (listing.cid.startsWith('http') || listing.cid.startsWith('data:image'))
        ? listing.cid
        : `https://image.pollinations.ai/prompt/${encodeURIComponent(listing.title + " " + listing.category + " exterior architecture")}`;

    // Helper to get specific visual context based on category
    const getCategoryContext = (category) => {
        const map = {
            'Amazing pools': 'infinity pool view, water reflections, luxury resort vibe, blue water',
            'Castles': 'stone walls, medieval architecture, chandelier, high ceilings, historic atmosphere',
            'Arctic': 'snowy landscape view, aurora borealis outside, cozy fireplace, fur textures, ice',
            'Camping': 'forest view, wooden textures, canvas tent material, nature sounds visual, greenery',
            'Design': 'modern art, minimalist furniture, clean lines, architectural statement, avant-garde',
            'Surfing': 'ocean waves view, surfboards decor, beach house vibe, sun-drenched, coastal',
            'Bed & breakfasts': 'cozy quilt, homemade breakfast setting, charming decor, floral patterns, warm lighting',
            'Tropical': 'palm trees view, jungle greenery, bamboo furniture, open air, humid atmosphere',
            'Views': 'panoramic mountain or city view, glass walls, observation deck style, breathtaking scenery'
        };
        return map[category] || 'beautiful scenery, elegant interior, natural light';
    };

    // Helper for AI images
    const getAIImage = (type) => {
        const context = getCategoryContext(listing.category);
        // Combine specific category context with the location-based title
        const prompt = `${type} inside ${listing.title}, ${listing.category} style, featuring ${context}, large window with view of surroundings, local architecture, photorealistic, 8k, architectural photography`;
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title Section */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">{listing.title || `Beautiful stay #${listing.id}`}</h1>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 font-semibold text-black"><Star size={14} fill="black" /> {listing.rating || 'New'}</span>
                            <span className="underline cursor-pointer">12 reviews</span>
                            <span className="flex items-center gap-1 underline cursor-pointer"><MapPin size={14} /> Polygon Amoy, Metaverse</span>
                        </div>
                        <div className="flex gap-4">
                            <button className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition"><Share size={16} /> Share</button>
                            <button
                                onClick={toggleLike}
                                className={`flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition ${liked ? 'text-rose-600' : 'text-gray-600'}`}
                            >
                                <Heart size={16} fill={liked ? "currentColor" : "none"} /> {liked ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Image Grid (Mock) */}
                <div className="rounded-xl overflow-hidden h-[400px] md:h-[500px] mb-8 relative grid grid-cols-4 grid-rows-2 gap-2">
                    <div className="col-span-2 row-span-2 relative">
                        <img src={imageUrl} className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer" alt="Main" />
                    </div>
                    <div className="col-span-1 row-span-1 relative">
                        <img src={getAIImage('bedroom')} className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer" alt="Bedroom" />
                    </div>
                    <div className="col-span-1 row-span-1 relative">
                        <img src={getAIImage('modern kitchen')} className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer" alt="Kitchen" />
                    </div>
                    <div className="col-span-1 row-span-1 relative">
                        <img src={getAIImage('living room')} className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer" alt="Living" />
                    </div>
                    <div className="col-span-1 row-span-1 relative">
                        <img src={getAIImage('luxury bathroom')} className="w-full h-full object-cover hover:opacity-95 transition cursor-pointer" alt="Bath" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    {/* Left Column */}
                    <div className="md:col-span-2">
                        <div className="flex justify-between items-center border-b pb-6 mb-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Hosted by {listing.owner ? `${listing.owner.slice(0, 6)}...${listing.owner.slice(-4)}` : 'Host'}</h2>
                                <p className="text-gray-500">{listing.guests || 2} guests · {listing.bedrooms || 1} bedroom · {listing.beds || 1} bed · {listing.baths || 1} bath</p>
                            </div>
                            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                <User size={24} />
                            </div>
                        </div>

                        <div className="border-b pb-6 mb-6 space-y-4">
                            <div className="flex gap-4">
                                <Calendar size={24} className="text-gray-500 mt-1" />
                                <div>
                                    <h3 className="font-semibold">Free cancellation for 48 hours</h3>
                                    <p className="text-gray-500 text-sm">Get a full refund if you change your mind.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <MapPin size={24} className="text-gray-500 mt-1" />
                                <div>
                                    <h3 className="font-semibold">Great location</h3>
                                    <p className="text-gray-500 text-sm">100% of recent guests gave the location a 5-star rating.</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-line">
                            {listing.description || "Enjoy a decentralized stay secured by the Polygon Amoy blockchain. Your funds are held in a smart contract escrow until your stay is complete. This property features state-of-the-art amenities and is verified on-chain."}
                        </p>
                    </div>

                    {/* Right Column - Sticky Booking Card */}
                    <div className="md:col-span-1">
                        <div className="border rounded-xl shadow-xl p-6 sticky top-28 bg-white">
                            <div className="flex justify-between items-baseline mb-4">
                                <span className="text-2xl font-bold">{listing.price_per_night} MATIC</span>
                                <span className="text-gray-500">night</span>
                            </div>

                            <div className="border border-gray-400 rounded-lg mb-4 overflow-hidden">
                                <div className="grid grid-cols-2 border-b border-gray-400">
                                    <div className="p-3 border-r border-gray-400 hover:bg-gray-50 cursor-pointer">
                                        <div className="text-[10px] font-bold uppercase">Check-in</div>
                                        <input
                                            type="date"
                                            className="w-full text-sm outline-none bg-transparent cursor-pointer"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                        />
                                    </div>
                                    <div className="p-3 hover:bg-gray-50 cursor-pointer">
                                        <div className="text-[10px] font-bold uppercase">Checkout</div>
                                        <input
                                            type="date"
                                            className="w-full text-sm outline-none bg-transparent cursor-pointer"
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="p-3 hover:bg-gray-50 cursor-pointer">
                                    <div className="text-[10px] font-bold uppercase">Guests</div>
                                    <select
                                        className="w-full text-sm outline-none bg-transparent cursor-pointer"
                                        value={guests}
                                        onChange={(e) => setGuests(e.target.value)}
                                    >
                                        {[...Array(listing.guests || 2).keys()].map(i => (
                                            <option key={i + 1} value={i + 1}>{i + 1} guest{i > 0 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleBook}
                                disabled={booking}
                                className="w-full btn-primary text-lg py-3 mb-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 transform active:scale-95 transition duration-200"
                            >
                                {booking ? 'Processing...' : 'Reserve'}
                            </button>

                            <div className="text-center text-sm text-gray-500 mb-4">You won't be charged yet</div>

                            {pricing && (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span className="underline">{listing.price_per_night} MATIC x {pricing.nights} nights</span>
                                        <span>{pricing.base} MATIC</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span className="underline">Cleaning fee</span>
                                        <span>{pricing.cleaning} MATIC</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span className="underline">Service fee</span>
                                        <span>{pricing.service} MATIC</span>
                                    </div>
                                    <div className="border-t pt-4 mt-4 flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>{pricing.total} MATIC</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
