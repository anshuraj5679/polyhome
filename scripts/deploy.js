const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const Listing = await hre.ethers.getContractFactory("Listing");
    const listing = await Listing.deploy();
    await listing.deployed();
    console.log("Listing deployed to:", listing.address);

    const Escrow = await hre.ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy();
    await escrow.deployed();
    console.log("Escrow deployed to:", escrow.address);

    // Save frontend artifacts
    saveFrontendFiles(listing, escrow);
}

function saveFrontendFiles(listing, escrow) {
    const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
    }

    const addresses = {
        Listing: listing.address,
        Escrow: escrow.address
    };

    fs.writeFileSync(
        path.join(contractsDir, "contract-address.json"),
        JSON.stringify(addresses, undefined, 2)
    );

    const ListingArtifact = artifacts.readArtifactSync("Listing");
    const EscrowArtifact = artifacts.readArtifactSync("Escrow");

    fs.writeFileSync(
        path.join(contractsDir, "Listing.json"),
        JSON.stringify(ListingArtifact, null, 2)
    );
    fs.writeFileSync(
        path.join(contractsDir, "Escrow.json"),
        JSON.stringify(EscrowArtifact, null, 2)
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
