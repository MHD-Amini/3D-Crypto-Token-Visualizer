// ==========================================
// 3D Crypto Token Visualizer - Main Application
// ==========================================

// Token Configuration
const TOKEN_CONFIG = {
    Bitcoin: {
        symbol: 'BTC',
        color: 0xF7931A,
        cgId: 'bitcoin',
        geometry: 'octahedron',
        position: { angle: 0, radius: 10, height: 0 }
    },
    Ethereum: {
        symbol: 'ETH',
        color: 0x627EEA,
        cgId: 'ethereum',
        geometry: 'dodecahedron',
        position: { angle: 45, radius: 10, height: 2 }
    },
    Solana: {
        symbol: 'SOL',
        color: 0x00FFA3,
        cgId: 'solana',
        geometry: 'icosahedron',
        position: { angle: 90, radius: 10, height: -1 }
    },
    Cardano: {
        symbol: 'ADA',
        color: 0x0033AD,
        cgId: 'cardano',
        geometry: 'sphere',
        position: { angle: 135, radius: 10, height: 1 }
    },
    Polygon: {
        symbol: 'MATIC',
        color: 0x8247E5,
        cgId: 'matic-network',
        geometry: 'torusKnot',
        position: { angle: 180, radius: 10, height: -2 }
    },
    Avalanche: {
        symbol: 'AVAX',
        color: 0xE84142,
        cgId: 'avalanche-2',
        geometry: 'cone',
        position: { angle: 225, radius: 10, height: 0 }
    },
    Polkadot: {
        symbol: 'DOT',
        color: 0xE6007A,
        cgId: 'polkadot',
        geometry: 'torus',
        position: { angle: 270, radius: 10, height: 2 }
    },
    Dogecoin: {
        symbol: 'DOGE',
        color: 0xC2A633,
        cgId: 'dogecoin',
        geometry: 'cylinder',
        position: { angle: 315, radius: 10, height: -1 }
    }
};

// Global State
let scene, camera, renderer, controls;
let tokens = [];
let selectedToken = null;
let hoveredToken = null;
let raycaster, mouse;
let prices = {};
let userCollection = [];
let walletAddress = null;
let contract = null;

// Contract Configuration (would be set from API)
const CONTRACT_CONFIG = {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 11155111, // Sepolia
    abi: [
        'function collectToken(string memory tokenName) public',
        'function getMyCollection() public view returns (string[] memory)',
        'function hasCollected(address user, string memory tokenName) public view returns (bool)',
        'function allTokens(uint256) public view returns (string memory)',
        'function getTotalTokens() public view returns (uint256)',
        'event TokenCollected(address indexed user, string tokenName)',
        'event CollectionUpdated(address indexed user)'
    ]
};

// Initialize Everything
document.addEventListener('DOMContentLoaded', async () => {
    await initScene();
    await fetchPrices();
    initEventListeners();
    animate();
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1500);
});

// ==========================================
// Three.js Scene Setup
// ==========================================
async function initScene() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.02);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 25);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    
    // Lighting
    setupLighting();
    
    // Create starfield background
    createStarfield();
    
    // Create tokens
    createTokens();
    
    // Create particle system
    createParticles();
    
    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    // Colored point lights for atmosphere
    const blueLight = new THREE.PointLight(0x6366f1, 1, 50);
    blueLight.position.set(-15, 10, 0);
    scene.add(blueLight);
    
    const cyanLight = new THREE.PointLight(0x22d3ee, 1, 50);
    cyanLight.position.set(15, -10, 0);
    scene.add(cyanLight);
    
    const purpleLight = new THREE.PointLight(0xa855f7, 0.5, 40);
    purpleLight.position.set(0, 15, -15);
    scene.add(purpleLight);
}

function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 200;
        positions[i + 2] = (Math.random() - 0.5) * 200;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// ==========================================
// Token Creation
// ==========================================
function createTokens() {
    Object.entries(TOKEN_CONFIG).forEach(([name, config], index) => {
        const token = createToken(name, config, index);
        tokens.push(token);
        scene.add(token.group);
    });
}

function createToken(name, config, index) {
    // Create geometry based on type
    let geometry;
    const size = 1.2;
    
    switch (config.geometry) {
        case 'octahedron':
            geometry = new THREE.OctahedronGeometry(size, 0);
            break;
        case 'dodecahedron':
            geometry = new THREE.DodecahedronGeometry(size, 0);
            break;
        case 'icosahedron':
            geometry = new THREE.IcosahedronGeometry(size, 0);
            break;
        case 'torusKnot':
            geometry = new THREE.TorusKnotGeometry(size * 0.6, size * 0.2, 64, 8);
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(size * 0.8, size * 1.5, 6);
            break;
        case 'torus':
            geometry = new THREE.TorusGeometry(size * 0.7, size * 0.3, 16, 32);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(size * 0.8, size * 0.8, size * 0.5, 32);
            break;
        default:
            geometry = new THREE.SphereGeometry(size, 32, 32);
    }
    
    // Create material with glow effect
    const material = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.2,
        shininess: 100,
        transparent: true,
        opacity: 0.95
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Create glow ring
    const ringGeometry = new THREE.TorusGeometry(size * 1.5, 0.05, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.3
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    
    // Create outer glow
    const glowGeometry = new THREE.SphereGeometry(size * 1.8, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    
    // Create group
    const group = new THREE.Group();
    group.add(mesh);
    group.add(ring);
    group.add(glow);
    
    // Position in circular arrangement
    const angle = (config.position.angle * Math.PI) / 180;
    const radius = config.position.radius;
    group.position.x = Math.cos(angle) * radius;
    group.position.z = Math.sin(angle) * radius;
    group.position.y = config.position.height;
    
    // Store token data
    const tokenData = {
        name,
        symbol: config.symbol,
        color: config.color,
        cgId: config.cgId,
        group,
        mesh,
        ring,
        glow,
        material,
        originalScale: 1,
        originalEmissive: 0.2,
        collected: false,
        animationOffset: Math.random() * Math.PI * 2
    };
    
    // Store reference in mesh for raycasting
    mesh.userData = tokenData;
    
    return tokenData;
}

// ==========================================
// Particle System
// ==========================================
let particleSystem;

function createParticles() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorPalette = [
        new THREE.Color(0x6366f1),
        new THREE.Color(0x22d3ee),
        new THREE.Color(0xa855f7),
        new THREE.Color(0xfbbf24)
    ];
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        // Spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 20 + Math.random() * 30;
        
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);
        
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// ==========================================
// Animation Loop
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    // Update controls
    controls.update();
    
    // Animate tokens
    tokens.forEach((token, index) => {
        // Floating animation
        const floatY = Math.sin(time + token.animationOffset) * 0.3;
        const floatX = Math.cos(time * 0.5 + token.animationOffset) * 0.1;
        token.group.position.y = TOKEN_CONFIG[token.name].position.height + floatY;
        
        // Rotation
        token.mesh.rotation.x += 0.005;
        token.mesh.rotation.y += 0.01;
        
        // Ring rotation
        token.ring.rotation.z += 0.02;
        
        // Pulsing scale
        const pulse = 1 + Math.sin(time * 2 + token.animationOffset) * 0.05;
        if (!token.isHovered && !token.isSelected) {
            token.mesh.scale.setScalar(pulse);
        }
        
        // Glow pulse
        token.glow.material.opacity = 0.1 + Math.sin(time * 3 + token.animationOffset) * 0.05;
        
        // Collected token special animation
        if (token.collected) {
            token.ring.material.opacity = 0.5 + Math.sin(time * 4) * 0.3;
            token.glow.material.color.setHex(0xfbbf24);
            token.glow.material.opacity = 0.2 + Math.sin(time * 3) * 0.1;
        }
    });
    
    // Rotate particle system slowly
    if (particleSystem) {
        particleSystem.rotation.y += 0.0003;
    }
    
    renderer.render(scene, camera);
}

// ==========================================
// Event Listeners
// ==========================================
function initEventListeners() {
    // Mouse move for hover effects
    window.addEventListener('mousemove', onMouseMove);
    
    // Click for selection
    window.addEventListener('click', onMouseClick);
    
    // Touch events for mobile
    window.addEventListener('touchstart', onTouchStart);
    
    // Wallet connection
    document.getElementById('connect-btn').addEventListener('click', connectWallet);
    
    // Collect token
    document.getElementById('collect-btn').addEventListener('click', collectToken);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    checkHover();
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const meshes = tokens.map(t => t.mesh);
    const intersects = raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
        selectToken(intersects[0].object.userData);
    }
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const meshes = tokens.map(t => t.mesh);
        const intersects = raycaster.intersectObjects(meshes);
        
        if (intersects.length > 0) {
            selectToken(intersects[0].object.userData);
        }
    }
}

// ==========================================
// Hover and Selection
// ==========================================
function checkHover() {
    raycaster.setFromCamera(mouse, camera);
    const meshes = tokens.map(t => t.mesh);
    const intersects = raycaster.intersectObjects(meshes);
    
    // Reset previous hover
    if (hoveredToken && (!intersects.length || intersects[0].object.userData !== hoveredToken)) {
        hoveredToken.isHovered = false;
        hoveredToken.material.emissiveIntensity = hoveredToken.originalEmissive;
        hoveredToken.mesh.scale.setScalar(hoveredToken.originalScale);
        hoveredToken = null;
        
        if (!selectedToken) {
            document.getElementById('token-info').classList.remove('visible');
        }
    }
    
    // Set new hover
    if (intersects.length > 0) {
        const token = intersects[0].object.userData;
        if (token !== hoveredToken) {
            hoveredToken = token;
            hoveredToken.isHovered = true;
            hoveredToken.material.emissiveIntensity = 0.5;
            hoveredToken.mesh.scale.setScalar(1.2);
            
            updateTokenInfo(token);
            document.getElementById('token-info').classList.add('visible');
            
            // Change cursor
            document.body.style.cursor = 'pointer';
        }
    } else {
        document.body.style.cursor = 'default';
    }
}

function selectToken(token) {
    // Deselect previous
    if (selectedToken) {
        selectedToken.isSelected = false;
        selectedToken.material.emissiveIntensity = selectedToken.originalEmissive;
        selectedToken.mesh.scale.setScalar(selectedToken.originalScale);
    }
    
    // Select new token
    selectedToken = token;
    selectedToken.isSelected = true;
    selectedToken.material.emissiveIntensity = 0.7;
    selectedToken.mesh.scale.setScalar(1.3);
    
    updateTokenInfo(token);
    document.getElementById('token-info').classList.add('visible');
    
    // Show collect button if wallet connected and not already collected
    const collectBtn = document.getElementById('collect-btn');
    if (walletAddress && !token.collected) {
        collectBtn.style.display = 'flex';
        collectBtn.disabled = false;
    } else if (token.collected) {
        collectBtn.style.display = 'flex';
        collectBtn.disabled = true;
        collectBtn.innerHTML = '<i class="fas fa-check"></i> Already Collected';
    } else {
        collectBtn.style.display = 'none';
    }
    
    // Pause auto-rotate briefly
    controls.autoRotate = false;
    setTimeout(() => {
        controls.autoRotate = true;
    }, 3000);
}

function updateTokenInfo(token) {
    const priceData = prices[token.cgId] || {};
    
    document.getElementById('token-name').textContent = token.name;
    document.getElementById('token-symbol').textContent = token.symbol;
    document.getElementById('token-icon').style.backgroundColor = `#${token.color.toString(16).padStart(6, '0')}`;
    document.getElementById('token-icon').textContent = token.symbol.substring(0, 1);
    
    // Price
    const price = priceData.usd || 0;
    document.getElementById('token-price').textContent = formatPrice(price);
    
    // 24h change
    const change = priceData.usd_24h_change || 0;
    const changeEl = document.getElementById('token-change');
    changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeEl.className = `value ${change >= 0 ? 'change-positive' : 'change-negative'}`;
    
    // Market cap
    const mcap = priceData.usd_market_cap || 0;
    document.getElementById('token-mcap').textContent = formatMarketCap(mcap);
    
    // Description
    const descriptions = {
        Bitcoin: 'The first and largest cryptocurrency by market cap',
        Ethereum: 'Leading smart contract platform for DeFi & dApps',
        Solana: 'High-performance blockchain for DeFi & NFTs',
        Cardano: 'Research-driven blockchain platform',
        Polygon: 'Ethereum scaling solution for faster transactions',
        Avalanche: 'Platform for decentralized applications',
        Polkadot: 'Multi-chain interoperability protocol',
        Dogecoin: 'The people\'s cryptocurrency'
    };
    document.getElementById('token-description').textContent = descriptions[token.name] || '';
    
    // Collection status
    const statusEl = document.getElementById('token-status');
    if (token.collected) {
        statusEl.innerHTML = '<i class="fas fa-star"></i> Collected!';
        statusEl.className = 'token-status collected';
    } else if (walletAddress) {
        statusEl.innerHTML = '<i class="fas fa-hand-pointer"></i> Click to collect';
        statusEl.className = 'token-status not-collected';
    } else {
        statusEl.innerHTML = '<i class="fas fa-wallet"></i> Connect wallet to collect';
        statusEl.className = 'token-status not-collected';
    }
}

// ==========================================
// Wallet Connection
// ==========================================
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showToast('MetaMask not detected! Please install MetaMask.', 'error');
        return;
    }
    
    try {
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        walletAddress = accounts[0];
        
        // Update UI
        document.getElementById('wallet-status').innerHTML = `
            <div class="status-dot connected"></div>
            <span>Connected</span>
        `;
        document.getElementById('wallet-address').textContent = 
            `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`;
        
        // Get balance
        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [walletAddress, 'latest']
        });
        const ethBalance = parseInt(balance, 16) / 1e18;
        document.getElementById('wallet-balance').textContent = 
            `${ethBalance.toFixed(4)} ETH`;
        
        // Update button
        const connectBtn = document.getElementById('connect-btn');
        connectBtn.innerHTML = '<i class="fas fa-check"></i> Connected';
        connectBtn.disabled = true;
        
        // Initialize contract (simulation mode for demo)
        // In production, you'd deploy the contract and connect here
        // contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
        
        // Load user collection (simulated)
        await loadCollection();
        
        showToast('Wallet connected successfully!', 'success');
        
        // Update token info if one is selected
        if (selectedToken) {
            updateTokenInfo(selectedToken);
            document.getElementById('collect-btn').style.display = 
                selectedToken.collected ? 'none' : 'flex';
        }
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountChange);
        
    } catch (error) {
        console.error('Connection error:', error);
        showToast('Failed to connect wallet', 'error');
    }
}

async function handleAccountChange(accounts) {
    if (accounts.length === 0) {
        // Disconnected
        walletAddress = null;
        document.getElementById('wallet-status').innerHTML = `
            <div class="status-dot disconnected"></div>
            <span>Not Connected</span>
        `;
        document.getElementById('wallet-address').textContent = '';
        document.getElementById('wallet-balance').textContent = '';
        
        const connectBtn = document.getElementById('connect-btn');
        connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect MetaMask';
        connectBtn.disabled = false;
        
        document.getElementById('collect-btn').style.display = 'none';
        
        // Reset collection
        userCollection = [];
        tokens.forEach(t => t.collected = false);
        updateCollectionPanel();
    } else {
        walletAddress = accounts[0];
        await loadCollection();
    }
}

// ==========================================
// Token Collection
// ==========================================
async function loadCollection() {
    // In production, this would fetch from the smart contract
    // For demo, we'll use localStorage
    const stored = localStorage.getItem(`collection_${walletAddress}`);
    userCollection = stored ? JSON.parse(stored) : [];
    
    // Update token states
    tokens.forEach(token => {
        token.collected = userCollection.includes(token.name);
        if (token.collected) {
            // Update visual appearance for collected tokens
            token.ring.material.color.setHex(0xfbbf24);
            token.ring.material.opacity = 0.6;
        }
    });
    
    updateCollectionPanel();
    updateStats();
}

async function collectToken() {
    if (!selectedToken || !walletAddress) return;
    if (selectedToken.collected) {
        showToast('You already collected this token!', 'info');
        return;
    }
    
    const collectBtn = document.getElementById('collect-btn');
    collectBtn.disabled = true;
    collectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Collecting...';
    
    try {
        // In production, this would call the smart contract
        // await contract.collectToken(selectedToken.name);
        
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mark as collected
        selectedToken.collected = true;
        userCollection.push(selectedToken.name);
        
        // Save to localStorage (demo)
        localStorage.setItem(`collection_${walletAddress}`, JSON.stringify(userCollection));
        
        // Update visual appearance
        selectedToken.ring.material.color.setHex(0xfbbf24);
        selectedToken.ring.material.opacity = 0.6;
        
        // Celebration effect
        createCollectionEffect(selectedToken);
        
        // Update UI
        updateCollectionPanel();
        updateStats();
        updateTokenInfo(selectedToken);
        
        collectBtn.innerHTML = '<i class="fas fa-check"></i> Collected!';
        
        showToast(`🎉 You collected ${selectedToken.name}!`, 'success');
        
    } catch (error) {
        console.error('Collection error:', error);
        collectBtn.disabled = false;
        collectBtn.innerHTML = '<i class="fas fa-hand-sparkles"></i> Collect Token';
        showToast('Failed to collect token', 'error');
    }
}

function createCollectionEffect(token) {
    // Create particle burst effect
    const particleCount = 50;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(token.group.position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        
        scene.add(particle);
        particles.push(particle);
    }
    
    // Animate particles
    let frame = 0;
    const animateParticles = () => {
        frame++;
        particles.forEach(p => {
            p.position.add(p.velocity);
            p.velocity.y -= 0.005; // Gravity
            p.material.opacity = 1 - frame / 60;
        });
        
        if (frame < 60) {
            requestAnimationFrame(animateParticles);
        } else {
            particles.forEach(p => scene.remove(p));
        }
    };
    animateParticles();
}

// ==========================================
// UI Updates
// ==========================================
function updateCollectionPanel() {
    const listEl = document.getElementById('collection-list');
    
    if (userCollection.length === 0) {
        if (walletAddress) {
            listEl.innerHTML = '<p class="empty-message">Start collecting tokens!</p>';
        } else {
            listEl.innerHTML = '<p class="empty-message">Connect wallet to start collecting!</p>';
        }
        return;
    }
    
    listEl.innerHTML = userCollection.map(name => {
        const config = TOKEN_CONFIG[name];
        const color = `#${config.color.toString(16).padStart(6, '0')}`;
        return `
            <div class="collection-item" onclick="focusToken('${name}')">
                <div class="badge" style="background: ${color}">${config.symbol.substring(0, 1)}</div>
                <div class="info">
                    <div class="name">${name}</div>
                    <div class="symbol">${config.symbol}</div>
                </div>
                <i class="fas fa-star collected-badge"></i>
            </div>
        `;
    }).join('');
    
    // Update progress bar
    const progress = (userCollection.length / 8) * 100;
    document.getElementById('collection-progress').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${userCollection.length}/8 Collected`;
}

function updateStats() {
    document.getElementById('collected-count').textContent = userCollection.length;
}

// Focus camera on specific token
window.focusToken = function(name) {
    const token = tokens.find(t => t.name === name);
    if (token) {
        selectToken(token);
        
        // Animate camera to token
        const targetPos = token.group.position.clone();
        targetPos.z += 10;
        targetPos.y += 2;
        
        // Simple camera animation
        const startPos = camera.position.clone();
        let progress = 0;
        
        const animateCamera = () => {
            progress += 0.02;
            if (progress < 1) {
                camera.position.lerpVectors(startPos, targetPos, progress);
                camera.lookAt(token.group.position);
                requestAnimationFrame(animateCamera);
            }
        };
        animateCamera();
    }
};

// ==========================================
// Price Data
// ==========================================
async function fetchPrices() {
    try {
        const response = await fetch('/api/prices');
        prices = await response.json();
    } catch (error) {
        console.error('Failed to fetch prices:', error);
        // Use mock data
        prices = {
            bitcoin: { usd: 45320, usd_24h_change: 2.5, usd_market_cap: 890000000000 },
            ethereum: { usd: 3240, usd_24h_change: 1.8, usd_market_cap: 389000000000 },
            solana: { usd: 152, usd_24h_change: 5.2, usd_market_cap: 67000000000 },
            cardano: { usd: 0.52, usd_24h_change: 0.8, usd_market_cap: 18000000000 },
            'matic-network': { usd: 0.89, usd_24h_change: 3.1, usd_market_cap: 8000000000 },
            'avalanche-2': { usd: 38.5, usd_24h_change: 4.2, usd_market_cap: 14000000000 },
            polkadot: { usd: 7.2, usd_24h_change: 1.5, usd_market_cap: 9000000000 },
            dogecoin: { usd: 0.082, usd_24h_change: 2.1, usd_market_cap: 11000000000 }
        };
    }
    
    // Update prices periodically
    setInterval(fetchPrices, 60000);
}

// ==========================================
// Utility Functions
// ==========================================
function formatPrice(price) {
    if (price >= 1000) {
        return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    } else if (price >= 1) {
        return `$${price.toFixed(2)}`;
    } else {
        return `$${price.toFixed(4)}`;
    }
}

function formatMarketCap(mcap) {
    if (mcap >= 1e12) {
        return `$${(mcap / 1e12).toFixed(2)}T`;
    } else if (mcap >= 1e9) {
        return `$${(mcap / 1e9).toFixed(0)}B`;
    } else if (mcap >= 1e6) {
        return `$${(mcap / 1e6).toFixed(0)}M`;
    }
    return `$${mcap.toLocaleString()}`;
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// Keyboard Shortcuts
// ==========================================
document.addEventListener('keydown', (e) => {
    // ESC to deselect
    if (e.key === 'Escape' && selectedToken) {
        selectedToken.isSelected = false;
        selectedToken.material.emissiveIntensity = selectedToken.originalEmissive;
        selectedToken.mesh.scale.setScalar(selectedToken.originalScale);
        selectedToken = null;
        document.getElementById('token-info').classList.remove('visible');
        document.getElementById('collect-btn').style.display = 'none';
    }
    
    // R to reset camera
    if (e.key === 'r' || e.key === 'R') {
        camera.position.set(0, 5, 25);
        controls.reset();
    }
});

console.log('🚀 3D Crypto Token Visualizer initialized!');
