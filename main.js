/**
 * Gas Laws 3D Simulation
 * Interactive visualization of fundamental gas laws using Three.js
 */

// ============================================
// Constants and Configuration
// ============================================
const GAS_CONSTANT = 0.0821; // L·atm/(mol·K)

const LAW_CONFIG = {
    boyle: {
        name: "Boyle's Law",
        formula: "P₁V₁ = P₂V₂",
        description: "At constant temperature, the pressure of a gas is inversely proportional to its volume.",
        info: "Discovered by Robert Boyle in 1662. This law states that for a fixed amount of gas at constant temperature, pressure and volume are inversely proportional. When you compress a gas (decrease volume), the particles collide more frequently with the container walls, increasing pressure."
    },
    charles: {
        name: "Charles's Law",
        formula: "V₁/T₁ = V₂/T₂",
        description: "At constant pressure, the volume of a gas is directly proportional to its absolute temperature.",
        info: "Discovered by Jacques Charles in 1787. As temperature increases, gas particles gain kinetic energy and move faster. To maintain constant pressure, the volume must increase to accommodate the more energetic particles."
    },
    gayLussac: {
        name: "Gay-Lussac's Law",
        formula: "P₁/T₁ = P₂/T₂",
        description: "At constant volume, the pressure of a gas is directly proportional to its absolute temperature.",
        info: "Formulated by Joseph Louis Gay-Lussac in 1809. When temperature increases in a fixed container, particles move faster and collide with walls more forcefully and frequently, increasing pressure."
    },
    avogadro: {
        name: "Avogadro's Law",
        formula: "V₁/n₁ = V₂/n₂",
        description: "At constant temperature and pressure, the volume of a gas is directly proportional to the number of moles.",
        info: "Proposed by Amedeo Avogadro in 1811. Equal volumes of gases at the same temperature and pressure contain equal numbers of molecules. At STP (273K, 1 atm), one mole of any ideal gas occupies 22.4 liters."
    },
    ideal: {
        name: "Ideal Gas Law",
        formula: "PV = nRT",
        description: "Combines all gas laws into one equation relating pressure, volume, temperature, and amount of gas.",
        info: "The Ideal Gas Law unifies Boyle's, Charles's, Gay-Lussac's, and Avogadro's laws. R is the universal gas constant (0.0821 L·atm/(mol·K)). This equation describes the behavior of ideal gases where particles have no volume and no intermolecular forces."
    }
};

// ============================================
// Global State
// ============================================
let scene, camera, renderer, controls;
let container, particles = [];
let containerMesh, containerEdges;
let currentLaw = 'boyle';
let animationSpeed = 1;
let showTrails = true;
let showCollisions = true;
let lastTime = performance.now();
let frameCount = 0;
let fps = 60;

// Gas state
let gasState = {
    pressure: 1.0,      // atm
    volume: 22.4,       // L
    temperature: 273,   // K
    moles: 1.0,         // mol
    baseVolume: 5,      // For Boyle's law reference
    basePressure: 2,    // For Boyle's law reference
    baseTemp: 300       // Reference temperature
};

// Container dimensions (will scale with volume)
let containerSize = {
    width: 4,
    height: 4,
    depth: 4
};

// ============================================
// Initialization
// ============================================
function init() {
    const canvasContainer = document.getElementById('canvas-container');

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1a);

    // Camera setup
    const aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasContainer.appendChild(renderer.domElement);

    // Orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 20;

    // Lighting
    setupLighting();

    // Create container
    createContainer();

    // Create particles
    createParticles(50);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x1e3a5f, 0x0d1b2a);
    gridHelper.position.y = -containerSize.height / 2 - 0.5;
    scene.add(gridHelper);

    // Event listeners
    setupEventListeners();

    // Start animation
    animate();
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4f46e5, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Point light inside container
    const pointLight = new THREE.PointLight(0x06b6d4, 0.5, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
}

function createContainer() {
    // Remove existing container
    if (containerMesh) {
        scene.remove(containerMesh);
        scene.remove(containerEdges);
    }

    // Container geometry (transparent box)
    const geometry = new THREE.BoxGeometry(
        containerSize.width,
        containerSize.height,
        containerSize.depth
    );

    // Transparent material for faces
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x4f46e5,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5
    });

    containerMesh = new THREE.Mesh(geometry, material);
    scene.add(containerMesh);

    // Edge lines
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0x4f46e5,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
    });
    containerEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    scene.add(containerEdges);
}

function createParticles(count) {
    // Remove existing particles
    particles.forEach(p => {
        scene.remove(p.mesh);
        if (p.trail) scene.remove(p.trail);
    });
    particles = [];

    const halfWidth = containerSize.width / 2 - 0.2;
    const halfHeight = containerSize.height / 2 - 0.2;
    const halfDepth = containerSize.depth / 2 - 0.2;

    for (let i = 0; i < count; i++) {
        // Particle geometry
        const radius = 0.08 + Math.random() * 0.04;
        const geometry = new THREE.SphereGeometry(radius, 16, 16);

        // Calculate initial speed based on temperature
        const speedFactor = Math.sqrt(gasState.temperature / 273);
        const baseSpeed = 0.02 * speedFactor;

        // Color based on speed (will update dynamically)
        const material = new THREE.MeshPhongMaterial({
            color: getParticleColor(speedFactor),
            emissive: getParticleColor(speedFactor),
            emissiveIntensity: 0.3,
            shininess: 100
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Random position inside container
        mesh.position.set(
            (Math.random() - 0.5) * halfWidth * 2,
            (Math.random() - 0.5) * halfHeight * 2,
            (Math.random() - 0.5) * halfDepth * 2
        );

        // Random velocity
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * baseSpeed,
            (Math.random() - 0.5) * baseSpeed,
            (Math.random() - 0.5) * baseSpeed
        );

        scene.add(mesh);

        // Trail
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(30 * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        const trailMaterial = new THREE.LineBasicMaterial({
            color: getParticleColor(speedFactor),
            transparent: true,
            opacity: 0.3
        });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        scene.add(trail);

        particles.push({
            mesh,
            velocity,
            trail,
            trailPositions: [],
            radius,
            colliding: false,
            collisionTime: 0
        });
    }

    document.getElementById('particle-count').textContent = `Particles: ${count}`;
}

function getParticleColor(speedFactor) {
    // Color gradient: blue (slow) -> green (medium) -> red (fast)
    if (speedFactor < 0.7) {
        return new THREE.Color(0x3b82f6); // Blue
    } else if (speedFactor < 1.3) {
        return new THREE.Color(0x10b981); // Green
    } else {
        return new THREE.Color(0xef4444); // Red
    }
}

// ============================================
// Animation and Physics
// ============================================
function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60fps
    lastTime = currentTime;

    // FPS counter
    frameCount++;
    if (frameCount >= 30) {
        fps = Math.round(1000 / ((currentTime - lastTime + 16.67) / frameCount * frameCount));
        document.getElementById('fps-counter').textContent = `FPS: ${fps}`;
        frameCount = 0;
    }

    // Update particles
    updateParticles(deltaTime);

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);
}

function updateParticles(deltaTime) {
    const halfWidth = containerSize.width / 2;
    const halfHeight = containerSize.height / 2;
    const halfDepth = containerSize.depth / 2;

    // Speed factor based on temperature
    const tempFactor = Math.sqrt(gasState.temperature / 273);

    particles.forEach((particle, index) => {
        const mesh = particle.mesh;
        const velocity = particle.velocity;
        const radius = particle.radius;

        // Apply velocity with animation speed and temperature factor
        const speedMultiplier = animationSpeed * tempFactor * deltaTime;
        mesh.position.x += velocity.x * speedMultiplier * 50;
        mesh.position.y += velocity.y * speedMultiplier * 50;
        mesh.position.z += velocity.z * speedMultiplier * 50;

        // Update particle color based on speed
        const speed = velocity.length() * tempFactor;
        const color = getParticleColor(speed * 30);
        mesh.material.color = color;
        mesh.material.emissive = color;

        // Wall collisions
        let collided = false;

        if (mesh.position.x + radius > halfWidth) {
            mesh.position.x = halfWidth - radius;
            velocity.x *= -1;
            collided = true;
        } else if (mesh.position.x - radius < -halfWidth) {
            mesh.position.x = -halfWidth + radius;
            velocity.x *= -1;
            collided = true;
        }

        if (mesh.position.y + radius > halfHeight) {
            mesh.position.y = halfHeight - radius;
            velocity.y *= -1;
            collided = true;
        } else if (mesh.position.y - radius < -halfHeight) {
            mesh.position.y = -halfHeight + radius;
            velocity.y *= -1;
            collided = true;
        }

        if (mesh.position.z + radius > halfDepth) {
            mesh.position.z = halfDepth - radius;
            velocity.z *= -1;
            collided = true;
        } else if (mesh.position.z - radius < -halfDepth) {
            mesh.position.z = -halfDepth + radius;
            velocity.z *= -1;
            collided = true;
        }

        // Collision highlighting
        if (collided && showCollisions) {
            particle.colliding = true;
            particle.collisionTime = 10;
            mesh.material.emissiveIntensity = 0.8;
        } else if (particle.collisionTime > 0) {
            particle.collisionTime -= deltaTime;
            mesh.material.emissiveIntensity = 0.3 + 0.5 * (particle.collisionTime / 10);
        } else {
            mesh.material.emissiveIntensity = 0.3;
        }

        // Particle-particle collisions (simplified)
        for (let j = index + 1; j < particles.length; j++) {
            const other = particles[j];
            const dx = mesh.position.x - other.mesh.position.x;
            const dy = mesh.position.y - other.mesh.position.y;
            const dz = mesh.position.z - other.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const minDist = radius + other.radius;

            if (dist < minDist) {
                // Simple elastic collision
                const nx = dx / dist;
                const ny = dy / dist;
                const nz = dz / dist;

                const dvx = velocity.x - other.velocity.x;
                const dvy = velocity.y - other.velocity.y;
                const dvz = velocity.z - other.velocity.z;

                const dvn = dvx * nx + dvy * ny + dvz * nz;

                velocity.x -= dvn * nx;
                velocity.y -= dvn * ny;
                velocity.z -= dvn * nz;

                other.velocity.x += dvn * nx;
                other.velocity.y += dvn * ny;
                other.velocity.z += dvn * nz;

                // Separate particles
                const overlap = minDist - dist;
                mesh.position.x += overlap * nx * 0.5;
                mesh.position.y += overlap * ny * 0.5;
                mesh.position.z += overlap * nz * 0.5;
                other.mesh.position.x -= overlap * nx * 0.5;
                other.mesh.position.y -= overlap * ny * 0.5;
                other.mesh.position.z -= overlap * nz * 0.5;
            }
        }

        // Update trail
        if (showTrails) {
            particle.trailPositions.push(mesh.position.clone());
            if (particle.trailPositions.length > 10) {
                particle.trailPositions.shift();
            }

            const positions = particle.trail.geometry.attributes.position.array;
            for (let i = 0; i < particle.trailPositions.length; i++) {
                positions[i * 3] = particle.trailPositions[i].x;
                positions[i * 3 + 1] = particle.trailPositions[i].y;
                positions[i * 3 + 2] = particle.trailPositions[i].z;
            }
            particle.trail.geometry.attributes.position.needsUpdate = true;
            particle.trail.geometry.setDrawRange(0, particle.trailPositions.length);
            particle.trail.visible = true;
        } else {
            particle.trail.visible = false;
        }
    });
}

// ============================================
// Gas Law Calculations
// ============================================
function updateBoyleLaw(volume) {
    // P₁V₁ = P₂V₂ (at constant T)
    // P₂ = P₁V₁ / V₂
    const k = gasState.basePressure * gasState.baseVolume; // constant = P₁V₁
    gasState.volume = volume;
    gasState.pressure = k / volume;

    // Update container size
    const scaleFactor = Math.cbrt(volume / gasState.baseVolume);
    containerSize.width = 4 * scaleFactor;
    containerSize.height = 4 * scaleFactor;
    containerSize.depth = 4 * scaleFactor;
    createContainer();

    // Update UI
    document.getElementById('pressure-calculated').textContent = `${gasState.pressure.toFixed(2)} atm`;
    updateLiveValues();
}

function updateCharlesLaw(temperature) {
    // V₁/T₁ = V₂/T₂ (at constant P)
    // V₂ = V₁ × T₂/T₁
    const k = gasState.baseVolume / gasState.baseTemp; // constant = V₁/T₁
    gasState.temperature = temperature;
    gasState.volume = k * temperature;

    // Update container size
    const scaleFactor = Math.cbrt(gasState.volume / gasState.baseVolume);
    containerSize.width = 4 * scaleFactor;
    containerSize.height = 4 * scaleFactor;
    containerSize.depth = 4 * scaleFactor;
    createContainer();

    // Update particle speeds based on temperature
    updateParticleSpeeds();

    // Update UI
    document.getElementById('volume-charles-calculated').textContent = `${gasState.volume.toFixed(1)} L`;
    updateLiveValues();
}

function updateGayLussacLaw(temperature) {
    // P₁/T₁ = P₂/T₂ (at constant V)
    // P₂ = P₁ × T₂/T₁
    const k = gasState.basePressure / gasState.baseTemp; // constant = P₁/T₁
    gasState.temperature = temperature;
    gasState.pressure = k * temperature;

    // Volume stays constant, but particle speeds change
    updateParticleSpeeds();

    // Update UI
    document.getElementById('pressure-gl-calculated').textContent = `${gasState.pressure.toFixed(2)} atm`;
    updateLiveValues();
}

function updateAvogadroLaw(moles) {
    // V₁/n₁ = V₂/n₂ (at constant T and P)
    // V₂ = V₁ × n₂/n₁
    const molarVolume = 22.4; // L/mol at STP
    gasState.moles = moles;
    gasState.volume = molarVolume * moles;

    // Update container size
    const scaleFactor = Math.cbrt(gasState.volume / 22.4);
    containerSize.width = 4 * scaleFactor;
    containerSize.height = 4 * scaleFactor;
    containerSize.depth = 4 * scaleFactor;
    createContainer();

    // Adjust particle count proportionally
    const targetParticles = Math.round(50 * moles);
    const currentCount = particles.length;
    if (Math.abs(targetParticles - currentCount) > 5) {
        createParticles(Math.min(200, Math.max(10, targetParticles)));
        document.getElementById('particle-slider').value = Math.min(200, Math.max(10, targetParticles));
        document.getElementById('particle-value').textContent = Math.min(200, Math.max(10, targetParticles));
    }

    // Update UI
    document.getElementById('volume-avogadro-calculated').textContent = `${gasState.volume.toFixed(1)} L`;
    updateLiveValues();
}

function updateIdealGasLaw() {
    // PV = nRT
    const P = parseFloat(document.getElementById('pressure-ideal').value);
    const V = parseFloat(document.getElementById('volume-ideal').value);
    const T = parseFloat(document.getElementById('temperature-ideal').value);
    const n = parseFloat(document.getElementById('moles-ideal').value);

    gasState.pressure = P;
    gasState.volume = V;
    gasState.temperature = T;
    gasState.moles = n;

    // Calculate both sides of PV = nRT
    const leftSide = P * V;
    const rightSide = n * GAS_CONSTANT * T;
    const ratio = leftSide / rightSide;

    // Update container
    const scaleFactor = Math.cbrt(V / 22.4);
    containerSize.width = 4 * scaleFactor;
    containerSize.height = 4 * scaleFactor;
    containerSize.depth = 4 * scaleFactor;
    createContainer();

    // Update particle speeds
    updateParticleSpeeds();

    // Update UI
    const checkElement = document.getElementById('ideal-check');
    if (Math.abs(ratio - 1) < 0.1) {
        checkElement.textContent = '✓ Balanced';
        checkElement.style.color = '#10b981';
    } else if (ratio > 1) {
        checkElement.textContent = `PV > nRT (${ratio.toFixed(2)}x)`;
        checkElement.style.color = '#f59e0b';
    } else {
        checkElement.textContent = `PV < nRT (${ratio.toFixed(2)}x)`;
        checkElement.style.color = '#ef4444';
    }

    updateLiveValues();
}

function updateParticleSpeeds() {
    const tempFactor = Math.sqrt(gasState.temperature / 273);
    const baseSpeed = 0.02 * tempFactor;

    particles.forEach(particle => {
        const currentSpeed = particle.velocity.length();
        if (currentSpeed > 0) {
            particle.velocity.normalize().multiplyScalar(baseSpeed);
        } else {
            particle.velocity.set(
                (Math.random() - 0.5) * baseSpeed,
                (Math.random() - 0.5) * baseSpeed,
                (Math.random() - 0.5) * baseSpeed
            );
        }
    });
}

function updateLiveValues() {
    document.getElementById('live-pressure').textContent = `${gasState.pressure.toFixed(2)} atm`;
    document.getElementById('live-volume').textContent = `${gasState.volume.toFixed(1)} L`;
    document.getElementById('live-temperature').textContent = `${gasState.temperature.toFixed(0)} K`;
    document.getElementById('live-moles').textContent = `${gasState.moles.toFixed(1)} mol`;
}

// ============================================
// UI Event Handlers
// ============================================
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchLaw(btn.dataset.law));
    });

    // Boyle's Law controls
    document.getElementById('volume-slider').addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        document.getElementById('volume-value').textContent = `${volume.toFixed(1)} L`;
        updateBoyleLaw(volume);
    });

    // Charles's Law controls
    document.getElementById('temperature-charles').addEventListener('input', (e) => {
        const temp = parseFloat(e.target.value);
        document.getElementById('temperature-charles-value').textContent = `${temp} K`;
        updateCharlesLaw(temp);
    });

    // Gay-Lussac's Law controls
    document.getElementById('temperature-gl').addEventListener('input', (e) => {
        const temp = parseFloat(e.target.value);
        document.getElementById('temperature-gl-value').textContent = `${temp} K`;
        updateGayLussacLaw(temp);
    });

    // Avogadro's Law controls
    document.getElementById('moles-slider').addEventListener('input', (e) => {
        const moles = parseFloat(e.target.value);
        document.getElementById('moles-value').textContent = `${moles.toFixed(1)} mol`;
        updateAvogadroLaw(moles);
    });

    // Ideal Gas Law controls
    ['pressure-ideal', 'volume-ideal', 'temperature-ideal', 'moles-ideal'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            const valueId = id + '-value';
            const value = parseFloat(e.target.value);
            let unit = '';
            if (id.includes('pressure')) unit = ' atm';
            else if (id.includes('volume')) unit = ' L';
            else if (id.includes('temperature')) unit = ' K';
            else if (id.includes('moles')) unit = ' mol';

            document.getElementById(valueId).textContent =
                (id.includes('temperature') ? value.toFixed(0) : value.toFixed(1)) + unit;
            updateIdealGasLaw();
        });
    });

    // Visualization controls
    document.getElementById('particle-slider').addEventListener('input', (e) => {
        const count = parseInt(e.target.value);
        document.getElementById('particle-value').textContent = count;
        createParticles(count);
    });

    document.getElementById('speed-slider').addEventListener('input', (e) => {
        animationSpeed = parseFloat(e.target.value);
        document.getElementById('speed-value').textContent = `${animationSpeed.toFixed(1)}x`;
    });

    document.getElementById('show-trails').addEventListener('change', (e) => {
        showTrails = e.target.checked;
    });

    document.getElementById('show-collisions').addEventListener('change', (e) => {
        showCollisions = e.target.checked;
    });

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', resetSimulation);

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function switchLaw(law) {
    currentLaw = law;

    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.law === law);
    });

    // Update formula display
    const config = LAW_CONFIG[law];
    document.querySelector('.formula-card h3').textContent = config.name;
    document.getElementById('formula-equation').textContent = config.formula;
    document.getElementById('formula-description').textContent = config.description;

    // Update info footer
    document.querySelector('.law-info h4').textContent = `About ${config.name}`;
    document.querySelector('.law-info p').textContent = config.info;

    // Show/hide control groups
    document.querySelectorAll('.control-group').forEach(group => {
        group.classList.add('hidden');
    });
    document.getElementById(`${law}-controls`).classList.remove('hidden');

    // Reset to appropriate initial state
    resetForLaw(law);
}

function resetForLaw(law) {
    switch (law) {
        case 'boyle':
            gasState = {
                pressure: 2.0,
                volume: 5.0,
                temperature: 273,
                moles: 1.0,
                baseVolume: 5,
                basePressure: 2,
                baseTemp: 300
            };
            document.getElementById('volume-slider').value = 5;
            document.getElementById('volume-value').textContent = '5.0 L';
            document.getElementById('pressure-calculated').textContent = '2.00 atm';
            break;

        case 'charles':
            gasState = {
                pressure: 1.0,
                volume: 5.0,
                temperature: 300,
                moles: 1.0,
                baseVolume: 5,
                basePressure: 1,
                baseTemp: 300
            };
            document.getElementById('temperature-charles').value = 300;
            document.getElementById('temperature-charles-value').textContent = '300 K';
            document.getElementById('volume-charles-calculated').textContent = '5.0 L';
            break;

        case 'gayLussac':
            gasState = {
                pressure: 2.0,
                volume: 5.0,
                temperature: 300,
                moles: 1.0,
                baseVolume: 5,
                basePressure: 2,
                baseTemp: 300
            };
            document.getElementById('temperature-gl').value = 300;
            document.getElementById('temperature-gl-value').textContent = '300 K';
            document.getElementById('pressure-gl-calculated').textContent = '2.00 atm';
            break;

        case 'avogadro':
            gasState = {
                pressure: 1.0,
                volume: 22.4,
                temperature: 273,
                moles: 1.0,
                baseVolume: 22.4,
                basePressure: 1,
                baseTemp: 273
            };
            document.getElementById('moles-slider').value = 1;
            document.getElementById('moles-value').textContent = '1.0 mol';
            document.getElementById('volume-avogadro-calculated').textContent = '22.4 L';
            break;

        case 'ideal':
            gasState = {
                pressure: 1.0,
                volume: 22.4,
                temperature: 273,
                moles: 1.0,
                baseVolume: 22.4,
                basePressure: 1,
                baseTemp: 273
            };
            document.getElementById('pressure-ideal').value = 1;
            document.getElementById('volume-ideal').value = 22.4;
            document.getElementById('temperature-ideal').value = 273;
            document.getElementById('moles-ideal').value = 1;
            document.getElementById('pressure-ideal-value').textContent = '1.0 atm';
            document.getElementById('volume-ideal-value').textContent = '22.4 L';
            document.getElementById('temperature-ideal-value').textContent = '273 K';
            document.getElementById('moles-ideal-value').textContent = '1.0 mol';
            document.getElementById('ideal-check').textContent = '✓ Balanced';
            document.getElementById('ideal-check').style.color = '#10b981';
            break;
    }

    // Update container
    const scaleFactor = Math.cbrt(gasState.volume / 22.4);
    containerSize.width = 4 * scaleFactor;
    containerSize.height = 4 * scaleFactor;
    containerSize.depth = 4 * scaleFactor;
    createContainer();

    // Update particle speeds
    updateParticleSpeeds();

    // Update live values
    updateLiveValues();
}

function resetSimulation() {
    // Reset visualization settings
    animationSpeed = 1;
    showTrails = true;
    showCollisions = true;

    document.getElementById('speed-slider').value = 1;
    document.getElementById('speed-value').textContent = '1.0x';
    document.getElementById('show-trails').checked = true;
    document.getElementById('show-collisions').checked = true;
    document.getElementById('particle-slider').value = 50;
    document.getElementById('particle-value').textContent = '50';

    // Reset for current law
    resetForLaw(currentLaw);

    // Recreate particles
    createParticles(50);
}

function onWindowResize() {
    const canvasContainer = document.getElementById('canvas-container');
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// ============================================
// Initialize on DOM ready
// ============================================
document.addEventListener('DOMContentLoaded', init);
