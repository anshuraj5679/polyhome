import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { Trash2, Loader2 } from 'lucide-react';
import { getSigner, getListingContract, switchNetwork } from '../lib/web3';
import { supabase } from '../lib/supabaseClient';

export default function ListingCard({ listing, account, onDelete }) {
    const [deleting, setDeleting] = useState(false);

    // Mock image if no CID or invalid
    const imageUrl = listing.cid && listing.cid.startsWith('http')
        ? listing.cid
        : `https://picsum.photos/seed/${listing.id}/400/300`;

    const isOwner = account && listing.owner && account.toLowerCase() === listing.owner.toLowerCase();

    const handleDelete = async (e) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;

        setDeleting(true);
        try {
            // 1. Deactivate on Blockchain
            await switchNetwork();
            const signer = await getSigner();
            const contract = getListingContract(signer);

            if (contract.address) {
                try {
                    // Verify ownership on-chain before attempting to delete
                    // This prevents "Not the owner" errors if the ID is a timestamp (off-chain only) or out of sync
                    const item = await contract.getListing(listing.id);

                    if (item.owner.toLowerCase() === account.toLowerCase()) {
                        // updateListing(id, price, cid, active)
                        // We keep price and cid same, just set active to false
                        const priceInWei = ethers.utils.parseEther(listing.price_per_night.toString());
                        const tx = await contract.updateListing(listing.id, priceInWei, listing.cid, false);
                        await tx.wait();
                    } else {
                        console.warn("On-chain owner mismatch or listing not found on-chain. Skipping blockchain delete.");
                    }
                } catch (err) {
                    console.warn("Error verifying/deleting on-chain (likely invalid/off-chain ID). Skipping blockchain delete.", err);
                }
            } else {
                console.warn("Contract not deployed, skipping on-chain delete");
            }

            // 2. Delete from Supabase
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listing.id);

            if (error) throw error;

            // 3. Update UI
            if (onDelete) onDelete(listing.id);
            alert("Listing deleted successfully!");

        } catch (error) {
            console.error("Error deleting listing:", error);
            alert("Failed to delete listing: " + error.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Link to={`/listing/${listing.id}`} className="group cursor-pointer block relative">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200 mb-3">
                <img
                    src={imageUrl}
                    alt="Listing"
                    className="h-full w-full object-cover group-hover:scale-110 transition duration-500 ease-out"
                />
                <div className="absolute top-3 right-3">
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', fill: 'rgba(0, 0, 0, 0.5)', height: '24px', width: '24px', stroke: 'white', strokeWidth: 2, overflow: 'visible' }}><path d="m16 28c7-4.733 14-10 14-17 0-1.792-.683-3.583-2.05-4.95-1.367-1.366-3.158-2.05-4.95-2.05-1.791 0-3.583.684-4.949 2.05l-2.051 2.051-2.05-2.051c-1.367-1.366-3.158-2.05-4.95-2.05-1.791 0-3.583.684-4.949 2.05-1.367 1.367-2.051 3.158-2.051 4.95 0 7 7 12.267 14 17z"></path></svg>
                </div>

                {isOwner && (
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="absolute top-3 left-3 bg-white p-2 rounded-full shadow-md hover:bg-red-50 text-red-600 transition z-10"
                        title="Delete Listing"
                    >
                        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                )}
            </div>
            <div className="flex justify-between items-start">
                <div className="font-semibold text-gray-900 truncate">
                    {listing.title || `Listing #${listing.id}`}
                </div>
                {listing.rating > 0 && (
                    <div className="flex items-center gap-1">
                        <span className="text-sm">★</span>
                        <span className="text-sm">{listing.rating}</span>
                    </div>
                )}
            </div>
            <div className="text-gray-500 text-sm">
                {listing.category || 'Stay'}
            </div>
            <div className="mt-1 flex items-baseline gap-1">
                <span className="font-semibold text-gray-900">
                    {listing.price_per_night} MATIC
                </span>
                <span className="text-gray-900">night</span>
            </div>
        </Link>
    );
}
