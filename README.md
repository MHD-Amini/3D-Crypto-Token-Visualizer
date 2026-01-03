# 🪙 3D Crypto Token Visualizer

An interactive 3D visualization tool where cryptocurrencies are represented as floating 3D objects in space. Users can explore, interact with tokens, and "collect" them by connecting their MetaMask wallet.

![3D Crypto Visualizer](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Web3](https://img.shields.io/badge/Web3-F16822?style=for-the-badge&logo=web3.js&logoColor=white)

## 🎯 Live Demo

**Preview URL**: https://3000-i0qi9ktkkuw4to215igjl-cbeee0f9.sandbox.novita.ai

## ✨ Features

### Core Features
- **3D Token Visualization**: Each cryptocurrency represented as a unique 3D geometric object
  - Bitcoin → Orange Octahedron (diamond shape)
  - Ethereum → Blue Dodecahedron (crystal shape)
  - Solana → Green Icosahedron
  - Cardano → Blue Sphere
  - Polygon → Purple Torus Knot
  - Avalanche → Red Cone
  - Polkadot → Pink Torus
  - Dogecoin → Gold Cylinder

- **Real-time Price Data**: Live cryptocurrency prices from CoinGecko API
- **MetaMask Integration**: Connect your wallet to start collecting
- **Token Collection System**: On-chain style collection tracking (using localStorage for demo)
- **Interactive 3D Environment**: Orbit controls, zoom, and rotation

### Visual Effects
- **Floating Animation**: Tokens gently float up and down
- **Auto-rotation**: Scene slowly rotates for immersive experience
- **Pulsing Glow**: Subtle size and glow changes on each token
- **Hover Effects**: Tokens brighten and enlarge on hover
- **Collection Celebration**: Particle burst effect when collecting tokens
- **Gold Ring Effect**: Collected tokens display a golden ring
- **Starfield Background**: 2000 stars creating a space environment
- **Colored Lighting**: Ambient purple/cyan/blue atmosphere

### User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Glassmorphism UI**: Modern glass panel design
- **Keyboard Shortcuts**: ESC to deselect, R to reset camera
- **Toast Notifications**: Visual feedback for all actions
- **Progress Tracking**: See collection completion percentage

## 🛠️ Tech Stack

- **Frontend**: Three.js, Vanilla JavaScript, CSS3
- **Backend**: Hono (TypeScript)
- **Deployment**: Cloudflare Pages/Workers
- **Web3**: ethers.js (MetaMask integration)
- **Build Tool**: Vite
- **Package Manager**: npm

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main 3D visualization page |
| `/api/tokens` | GET | Get all token configurations |
| `/api/tokens/:name` | GET | Get specific token info |
| `/api/prices` | GET | Get real-time crypto prices (CoinGecko proxy) |
| `/api/contract` | GET | Get smart contract ABI and address |

## 🎮 User Flow

```
1. User opens site
   ↓
2. Sees 8 floating 3D tokens in space
   ↓
3. Moves mouse over Bitcoin token
   ↓
4. Token glows orange, info appears: "BTC: $45,320"
   ↓
5. Clicks "Connect Wallet" → MetaMask pops up
   ↓
6. Wallet connects → address shows, collection loads
   ↓
7. Clicks Bitcoin token → "Collect" button activates
   ↓
8. Clicks "Collect" → Confirmation animation
   ↓
9. Bitcoin gets gold ring effect
   ↓
10. Bitcoin appears in collection panel
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- MetaMask browser extension (for wallet features)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd webapp

# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev:sandbox
```

### Development Commands

```bash
npm run dev          # Start Vite dev server
npm run dev:sandbox  # Start wrangler pages dev
npm run build        # Build for production
npm run deploy       # Deploy to Cloudflare Pages
npm run clean-port   # Kill process on port 3000
```

## 📁 Project Structure

```
webapp/
├── src/
│   ├── index.tsx        # Main Hono application & API routes
│   └── renderer.tsx     # JSX renderer (unused in favor of inline HTML)
├── public/
│   └── static/
│       ├── app.js       # Three.js 3D visualization & interactions
│       └── style.css    # Glassmorphism UI styles
├── dist/                # Build output (auto-generated)
├── ecosystem.config.cjs # PM2 configuration
├── vite.config.ts       # Vite build configuration
├── wrangler.jsonc       # Cloudflare Workers configuration
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## 🔧 Configuration

### Token Configuration

Tokens are configured in `public/static/app.js`:

```javascript
const TOKEN_CONFIG = {
    Bitcoin: {
        symbol: 'BTC',
        color: 0xF7931A,
        cgId: 'bitcoin',
        geometry: 'octahedron',
        position: { angle: 0, radius: 10, height: 0 }
    },
    // ... more tokens
};
```

### Adding New Tokens

1. Add token to `TOKEN_CONFIG` in `app.js`
2. Add token data to `tokenDatabase` in `src/index.tsx`
3. Update the smart contract (if deploying to blockchain)

## 📊 Smart Contract (Solidity)

The collection system is designed to work with a Solidity smart contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TokenCollection {
    mapping(address => string[]) private userCollections;
    
    function collectToken(string memory tokenName) public;
    function getMyCollection() public view returns (string[] memory);
    function hasCollected(address user, string memory tokenName) public view returns (bool);
}
```

**Note**: The demo uses localStorage. For production, deploy the contract to a testnet/mainnet.

## 🎨 Customization

### Changing Colors

Update CSS variables in `style.css`:

```css
:root {
    --primary: #6366f1;
    --secondary: #22d3ee;
    --gold: #fbbf24;
    /* ... */
}
```

### Adjusting 3D Scene

Modify Three.js settings in `app.js`:
- Camera position: `camera.position.set(0, 5, 25)`
- Orbit controls: `controls.autoRotateSpeed = 0.5`
- Token size: Adjust geometry size in `createToken()`

## 📱 Responsive Design

- **Desktop**: Full experience with all panels visible
- **Tablet**: Panels reposition for better viewing
- **Mobile**: Simplified layout, touch-friendly controls

## 🔒 Security Notes

- MetaMask integration is read-only for demo
- No actual blockchain transactions in demo mode
- Collection data stored in browser localStorage
- API keys should be stored in Cloudflare secrets for production

## 🚧 Future Enhancements

- [ ] Deploy smart contract to Sepolia testnet
- [ ] Add VR mode with WebXR
- [ ] Implement multi-user mode
- [ ] Add achievement system
- [ ] Trading between users
- [ ] More token geometries and effects
- [ ] Sound effects on interactions

## 📈 Performance

- **Three.js Optimized**: 60 FPS on most devices
- **Lazy Loading**: Assets load progressively
- **Edge Deployment**: Global CDN via Cloudflare

## 📄 License

MIT License - Feel free to use for your portfolio!

---

**Built with ❤️ using Three.js, Hono, and Cloudflare Pages**
