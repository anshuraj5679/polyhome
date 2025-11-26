# PolyHome - Decentralized Airbnb on Polygon

A decentralized home rental platform built on Polygon Amoy testnet, combining blockchain technology with modern web development.

## 🌟 Features

- **Decentralized Listings**: Property owners can list their homes directly on the blockchain
- **Smart Contract Escrow**: Secure payment handling with automated escrow system
- **IPFS Storage**: Property metadata and images stored on IPFS for decentralization
- **Wallet Integration**: Connect with MetaMask and other Web3 wallets via RainbowKit
- **Dispute Resolution**: Built-in dispute mechanism for booking conflicts
- **Real-time Updates**: Modern Next.js frontend with Turbopack

## 🏗️ Tech Stack

### Smart Contracts
- **Solidity 0.8.19**: Smart contract development
- **Hardhat**: Development environment and testing
- **OpenZeppelin**: Secure contract libraries (ReentrancyGuard, Ownable, Counters)
- **Polygon Amoy**: Testnet deployment

### Frontend
- **Next.js 16**: React framework with Turbopack
- **TypeScript**: Type-safe development
- **RainbowKit**: Wallet connection UI
- **Wagmi**: React hooks for Ethereum
- **Viem**: Ethereum library
- **Tailwind CSS**: Styling

### Storage
- **IPFS**: Decentralized file storage
- **Supabase**: Off-chain data management

## 📋 Prerequisites

- Node.js (v16 or higher)
- MetaMask or compatible Web3 wallet
- Polygon Amoy testnet MATIC tokens

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/anshuraj5679/polyhome.git
cd polyhome/airbnb-amoy
```

### 2. Install Dependencies

```bash
# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

### 4. Compile Smart Contracts

```bash
npm run compile
```

### 5. Deploy Contracts

```bash
npm run deploy
```

### 6. Start the Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📝 Smart Contracts

### Listing.sol
Manages property listings with the following features:
- Create new listings with price and IPFS metadata
- Update listing details and availability
- Track listing ownership
- Event emission for transparency

### Escrow.sol
Handles secure payment processing:
- Deposit funds for bookings
- Release payments to hosts after stay
- Refund mechanism for cancellations
- Dispute resolution system
- Multiple booking states (AWAITING_PAYMENT, AWAITING_STAY, COMPLETED, REFUNDED, DISPUTED)

## 🔧 Available Scripts

### Smart Contracts
```bash
npm run compile    # Compile contracts
npm run deploy     # Deploy to Polygon Amoy
npm test          # Run contract tests
```

### Frontend
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
```

## 🌐 Network Configuration

**Polygon Amoy Testnet**
- Chain ID: 80002
- RPC URL: https://rpc-amoy.polygon.technology/
- Block Explorer: https://amoy.polygonscan.com/

Get testnet MATIC from: https://faucet.polygon.technology/

## 📂 Project Structure

```
polyhome/
├── airbnb-amoy/
│   ├── contracts/          # Solidity smart contracts
│   │   ├── Listing.sol
│   │   └── Escrow.sol
│   ├── scripts/            # Deployment scripts
│   ├── frontend/           # Next.js application
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utility functions
│   │   └── abis/          # Contract ABIs
│   ├── supabase/          # Database schema
│   └── hardhat.config.js  # Hardhat configuration
```

## 🔐 Security Features

- ReentrancyGuard protection on all state-changing functions
- Ownership verification for listing management
- Secure fund handling with proper state management
- Input validation on all contract functions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Anshu Raj**
- GitHub: [@anshuraj5679](https://github.com/anshuraj5679)

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Polygon for the scalable blockchain infrastructure
- RainbowKit for wallet connection UI
- Next.js team for the amazing framework

---

Built with ❤️ on Polygon
