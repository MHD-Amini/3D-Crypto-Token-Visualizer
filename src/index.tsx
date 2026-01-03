import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Token database with static data (can be enhanced with real API)
const tokenDatabase = {
  "Bitcoin": {
    symbol: "BTC",
    color: "#F7931A",
    modelType: "octahedron",
    description: "The first and largest cryptocurrency by market cap"
  },
  "Ethereum": {
    symbol: "ETH", 
    color: "#627EEA",
    modelType: "dodecahedron",
    description: "Leading smart contract platform"
  },
  "Solana": {
    symbol: "SOL",
    color: "#00FFA3",
    modelType: "icosahedron",
    description: "High-performance blockchain for DeFi & NFTs"
  },
  "Cardano": {
    symbol: "ADA",
    color: "#0033AD",
    modelType: "sphere",
    description: "Research-driven blockchain platform"
  },
  "Polygon": {
    symbol: "MATIC",
    color: "#8247E5",
    modelType: "torusKnot",
    description: "Ethereum scaling solution"
  },
  "Avalanche": {
    symbol: "AVAX",
    color: "#E84142",
    modelType: "cone",
    description: "Platform for decentralized apps"
  },
  "Polkadot": {
    symbol: "DOT",
    color: "#E6007A",
    modelType: "torus",
    description: "Multi-chain interoperability protocol"
  },
  "Dogecoin": {
    symbol: "DOGE",
    color: "#C2A633",
    modelType: "cylinder",
    description: "The people's cryptocurrency"
  }
}

// API: Get all tokens
app.get('/api/tokens', (c) => {
  return c.json(tokenDatabase)
})

// API: Get token info
app.get('/api/tokens/:name', (c) => {
  const name = c.req.param('name')
  const token = tokenDatabase[name as keyof typeof tokenDatabase]
  if (!token) {
    return c.json({ error: 'Token not found' }, 404)
  }
  return c.json({ name, ...token })
})

// API: Proxy for CoinGecko prices (to avoid CORS issues)
app.get('/api/prices', async (c) => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,matic-network,avalanche-2,polkadot,dogecoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true'
    )
    const data = await response.json()
    return c.json(data)
  } catch (error) {
    // Return mock data if API fails
    return c.json({
      bitcoin: { usd: 45320, usd_24h_change: 2.5, usd_market_cap: 890000000000 },
      ethereum: { usd: 3240, usd_24h_change: 1.8, usd_market_cap: 389000000000 },
      solana: { usd: 152, usd_24h_change: 5.2, usd_market_cap: 67000000000 },
      cardano: { usd: 0.52, usd_24h_change: 0.8, usd_market_cap: 18000000000 },
      'matic-network': { usd: 0.89, usd_24h_change: 3.1, usd_market_cap: 8000000000 },
      'avalanche-2': { usd: 38.5, usd_24h_change: 4.2, usd_market_cap: 14000000000 },
      polkadot: { usd: 7.2, usd_24h_change: 1.5, usd_market_cap: 9000000000 },
      dogecoin: { usd: 0.082, usd_24h_change: 2.1, usd_market_cap: 11000000000 }
    })
  }
})

// Contract ABI for frontend
app.get('/api/contract', (c) => {
  return c.json({
    // Sepolia testnet - You would deploy the contract and put the address here
    address: "0x0000000000000000000000000000000000000000",
    chainId: 11155111, // Sepolia
    abi: [
      "function collectToken(string memory tokenName) public",
      "function getMyCollection() public view returns (string[] memory)",
      "function hasCollected(address user, string memory tokenName) public view returns (bool)",
      "function allTokens(uint256) public view returns (string memory)",
      "function getTotalTokens() public view returns (uint256)",
      "event TokenCollected(address indexed user, string tokenName)",
      "event CollectionUpdated(address indexed user)"
    ]
  })
})

// Main HTML page
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Crypto Token Visualizer</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🪙</text></svg>">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="/static/style.css" rel="stylesheet">
</head>
<body>
    <!-- Loading Screen -->
    <div id="loading-screen">
        <div class="loader">
            <div class="loader-ring"></div>
            <div class="loader-ring"></div>
            <div class="loader-ring"></div>
            <div class="loader-text">Loading 3D Universe...</div>
        </div>
    </div>

    <!-- Main Container -->
    <div id="container">
        <!-- 3D Canvas -->
        <div id="canvas-container"></div>
        
        <!-- Particle Overlay -->
        <div id="particles"></div>
        
        <!-- UI Overlay -->
        <div id="ui-overlay">
            <!-- Header -->
            <header id="header">
                <div class="logo">
                    <i class="fas fa-cube"></i>
                    <span>Crypto Visualizer</span>
                </div>
                <div class="header-stats">
                    <div class="stat">
                        <span class="stat-label">Total Tokens</span>
                        <span class="stat-value" id="total-tokens">8</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Collected</span>
                        <span class="stat-value" id="collected-count">0</span>
                    </div>
                </div>
            </header>

            <!-- Wallet Panel -->
            <div class="panel glass" id="wallet-panel">
                <div class="panel-header">
                    <i class="fas fa-wallet"></i>
                    <h3>Wallet</h3>
                </div>
                <div class="panel-content">
                    <div id="wallet-status">
                        <div class="status-dot disconnected"></div>
                        <span>Not Connected</span>
                    </div>
                    <p id="wallet-address" class="address"></p>
                    <p id="wallet-balance" class="balance"></p>
                    <button class="btn btn-primary" id="connect-btn">
                        <i class="fas fa-plug"></i>
                        Connect MetaMask
                    </button>
                    <button class="btn btn-success" id="collect-btn" style="display: none;">
                        <i class="fas fa-hand-sparkles"></i>
                        Collect Token
                    </button>
                </div>
            </div>

            <!-- Token Info Panel (appears on hover) -->
            <div class="panel glass" id="token-info">
                <div class="token-header">
                    <div class="token-icon" id="token-icon"></div>
                    <div class="token-title">
                        <h2 id="token-name">Bitcoin</h2>
                        <span class="token-symbol" id="token-symbol">BTC</span>
                    </div>
                </div>
                <div class="token-stats">
                    <div class="token-stat">
                        <span class="label">Price</span>
                        <span class="value" id="token-price">$45,320</span>
                    </div>
                    <div class="token-stat">
                        <span class="label">24h Change</span>
                        <span class="value change-positive" id="token-change">+2.5%</span>
                    </div>
                    <div class="token-stat">
                        <span class="label">Market Cap</span>
                        <span class="value" id="token-mcap">$890B</span>
                    </div>
                </div>
                <p class="token-description" id="token-description"></p>
                <div class="token-status" id="token-status"></div>
            </div>

            <!-- Collection Panel -->
            <div class="panel glass" id="collection-panel">
                <div class="panel-header">
                    <i class="fas fa-trophy"></i>
                    <h3>My Collection</h3>
                </div>
                <div class="panel-content">
                    <div class="collection-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="collection-progress"></div>
                        </div>
                        <span class="progress-text" id="progress-text">0/8 Collected</span>
                    </div>
                    <div id="collection-list">
                        <p class="empty-message">Connect wallet to start collecting!</p>
                    </div>
                </div>
            </div>

            <!-- Instructions -->
            <div class="panel glass" id="instructions-panel">
                <div class="instruction">
                    <i class="fas fa-mouse"></i>
                    <span>Hover tokens for info</span>
                </div>
                <div class="instruction">
                    <i class="fas fa-hand-pointer"></i>
                    <span>Click to select</span>
                </div>
                <div class="instruction">
                    <i class="fas fa-arrows-alt"></i>
                    <span>Drag to rotate view</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Sound Effects (optional) -->
    <audio id="hover-sound" preload="auto">
        <source src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU..." type="audio/wav">
    </audio>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js"></script>
    <script src="https://cdn.ethers.io/lib/ethers-5.7.umd.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>`)
})

export default app
