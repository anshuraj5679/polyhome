const fs = require("fs");
const path = require("path");

function main() {
    const artifactsDir = path.join(__dirname, "..", "frontend", "src", "artifacts", "contracts");
    const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
    }

    // Copy Listing.json
    const listingSource = path.join(artifactsDir, "Listing.sol", "Listing.json");
    const listingDest = path.join(contractsDir, "Listing.json");
    if (fs.existsSync(listingSource)) {
        fs.copyFileSync(listingSource, listingDest);
        console.log("Copied Listing.json");
    } else {
        console.error("Listing.json artifact not found. Did you run 'npx hardhat compile'?");
    }

    // Copy Escrow.json
    const escrowSource = path.join(artifactsDir, "Escrow.sol", "Escrow.json");
    const escrowDest = path.join(contractsDir, "Escrow.json");
    if (fs.existsSync(escrowSource)) {
        fs.copyFileSync(escrowSource, escrowDest);
        console.log("Copied Escrow.json");
    } else {
        console.error("Escrow.json artifact not found.");
    }

    // Ensure contract-address.json exists
    const addressFile = path.join(contractsDir, "contract-address.json");
    if (!fs.existsSync(addressFile)) {
        fs.writeFileSync(addressFile, JSON.stringify({ Listing: "", Escrow: "" }, null, 2));
        console.log("Created contract-address.json");
    }
}

main();
