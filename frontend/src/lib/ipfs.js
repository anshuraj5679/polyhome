import axios from 'axios';

// Pinata API keys from .env
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

export async function uploadToIPFS(file) {
    try {
        // 1. If keys exist, try actual upload
        if (PINATA_API_KEY && PINATA_SECRET_KEY) {
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
                maxBodyLength: "Infinity",
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                }
            });

            // Return the IPFS URL
            return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
        }

        // 2. Fallback / Mock for demo (if no keys)
        console.warn("No Pinata keys found in .env. Using mock IPFS upload (Placeholder URL).");

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Convert file to Data URI (Base64) so the user sees exactly what they uploaded
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    } catch (error) {
        console.error("Error uploading to IPFS:", error);
        throw new Error("Failed to upload image to IPFS");
    }
}
