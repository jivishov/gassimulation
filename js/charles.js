/**
 * Charles's Law Visualization
 * V₁/T₁ = V₂/T₂ (at constant pressure)
 *
 * Scene: Hot Air Balloon
 * - Balloon envelope that expands/contracts with temperature
 * - Burner flame underneath
 * - Air molecules inside moving faster when heated
 */

import { ParticleSystem } from './particles.js';

export class CharlesScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Gas state
        this.state = {
            temperature: 300,   // K
            volume: 24.6,       // L (V = k * T)
            pressure: 1.0,      // atm (constant)
            moles: 1.0,         // mol (constant)
            k: 0.082            // V/T constant
        };

        // Balloon properties
        this.baseRadius = 2.0;
        this.currentRadius = 2.0;

        // Scene objects
        this.balloon = null;
        this.basket = null;
        this.burner = null;
        this.flames = [];
        this.ropes = [];

        // Particle system
        this.particleSystem = null;

        // Animation
        this.flameTime = 0;
        this.flameIntensity = 0.5;

        this.init();
    }

    init() {
        this.createBalloon();
        this.createBasket();
        this.createBurner();
        this.createRopes();
        this.createParticles();
        this.createGround();
        this.setupLighting();

        // Set camera position
        this.camera.position.set(8, 3, 8);
        this.camera.lookAt(0, 2, 0);
    }

    createBalloon() {
        // Balloon envelope (sphere stretched vertically)
        const balloonGeometry = new THREE.SphereGeometry(this.baseRadius, 32, 24);

        // Stretch to balloon shape
        const positions = balloonGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            if (y > 0) {
                positions.setY(i, y * 1.3); // Stretch top
            } else {
                positions.setY(i, y * 0.7); // Compress bottom
            }
        }
        balloonGeometry.computeVertexNormals();

        // Colorful balloon material with panels
        const balloonMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xe63946,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            metalness: 0.0,
            roughness: 0.6,
        });

        this.balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
        this.balloon.position.y = 3.5;
        this.group.add(this.balloon);

        // Balloon stripes/panels
        for (let i = 0; i < 8; i++) {
            const stripeGeometry = new THREE.SphereGeometry(this.baseRadius + 0.01, 4, 24,
                i * Math.PI / 4, Math.PI / 8);

            // Apply same stretch
            const stripePositions = stripeGeometry.attributes.position;
            for (let j = 0; j < stripePositions.count; j++) {
                const y = stripePositions.getY(j);
                if (y > 0) {
                    stripePositions.setY(j, y * 1.3);
                } else {
                    stripePositions.setY(j, y * 0.7);
                }
            }
            stripeGeometry.computeVertexNormals();

            const colors = [0xf1faee, 0x457b9d, 0xf1faee, 0x1d3557,
                           0xf1faee, 0xa8dadc, 0xf1faee, 0xe63946];
            const stripeMaterial = new THREE.MeshPhysicalMaterial({
                color: colors[i],
                transparent: true,
                opacity: 0.85,
                side: THREE.DoubleSide,
                metalness: 0.0,
                roughness: 0.6,
            });

            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.y = 3.5;
            this.balloon.add(stripe);
        }

        // Balloon opening at bottom
        const openingGeometry = new THREE.TorusGeometry(0.5, 0.05, 8, 32);
        const openingMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8
        });
        const opening = new THREE.Mesh(openingGeometry, openingMaterial);
        opening.rotation.x = Math.PI / 2;
        opening.position.y = -this.baseRadius * 0.7;
        this.balloon.add(opening);

        // Skirt around opening
        const skirtGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.5, 16, 1, true);
        const skirtMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            side: THREE.DoubleSide,
            roughness: 0.9
        });
        const skirt = new THREE.Mesh(skirtGeometry, skirtMaterial);
        skirt.position.y = -this.baseRadius * 0.7 - 0.25;
        this.balloon.add(skirt);
    }

    createBasket() {
        const basketGroup = new THREE.Group();
        basketGroup.position.y = -0.5;
        this.group.add(basketGroup);

        // Wicker basket
        const basketGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
        const basketMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9
        });
        const basket = new THREE.Mesh(basketGeometry, basketMaterial);
        basketGroup.add(basket);

        // Basket rim
        const rimGeometry = new THREE.BoxGeometry(1.3, 0.1, 1.3);
        const rim = new THREE.Mesh(rimGeometry, basketMaterial);
        rim.position.y = 0.45;
        basketGroup.add(rim);

        // Basket weave pattern (simplified with lines)
        const weaveGroup = new THREE.Group();
        for (let i = -0.5; i <= 0.5; i += 0.15) {
            const lineGeometry = new THREE.BoxGeometry(0.02, 0.7, 1.18);
            const line = new THREE.Mesh(lineGeometry,
                new THREE.MeshBasicMaterial({ color: 0x654321 }));
            line.position.x = i;
            weaveGroup.add(line);

            const hLineGeometry = new THREE.BoxGeometry(1.18, 0.02, 0.02);
            const hLine = new THREE.Mesh(hLineGeometry,
                new THREE.MeshBasicMaterial({ color: 0x654321 }));
            hLine.position.set(0, i - 0.1, 0.59);
            weaveGroup.add(hLine);
        }
        basketGroup.add(weaveGroup);

        // Corner posts for ropes
        const postGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8);
        const postMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const corners = [[-0.55, 0.55], [0.55, 0.55], [-0.55, -0.55], [0.55, -0.55]];
        corners.forEach(([x, z]) => {
            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(x, 0.5, z);
            basketGroup.add(post);
        });

        this.basket = basketGroup;
    }

    createBurner() {
        const burnerGroup = new THREE.Group();
        burnerGroup.position.y = 0.4;
        this.group.add(burnerGroup);

        // Burner frame
        const frameGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.6);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.3
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        burnerGroup.add(frame);

        // Burner nozzles
        for (let x = -0.15; x <= 0.15; x += 0.15) {
            const nozzleGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8);
            const nozzleMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.9
            });
            const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
            nozzle.position.set(x, 0.22, 0);
            burnerGroup.add(nozzle);
        }

        // Propane tanks
        const tankGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12);
        const tankMaterial = new THREE.MeshStandardMaterial({
            color: 0x2255aa,
            metalness: 0.6,
            roughness: 0.3
        });
        const tank1 = new THREE.Mesh(tankGeometry, tankMaterial);
        tank1.position.set(0.35, -0.2, 0);
        burnerGroup.add(tank1);
        const tank2 = new THREE.Mesh(tankGeometry, tankMaterial);
        tank2.position.set(-0.35, -0.2, 0);
        burnerGroup.add(tank2);

        // Create flames
        this.createFlames(burnerGroup);

        this.burner = burnerGroup;
    }

    createFlames(parent) {
        this.flames = [];

        for (let i = 0; i < 3; i++) {
            const flameGroup = new THREE.Group();
            flameGroup.position.set(-0.15 + i * 0.15, 0.35, 0);

            // Inner flame (bright yellow/white)
            const innerGeometry = new THREE.ConeGeometry(0.06, 0.4, 8);
            const innerMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff88,
                transparent: true,
                opacity: 0.9
            });
            const inner = new THREE.Mesh(innerGeometry, innerMaterial);
            inner.position.y = 0.2;
            flameGroup.add(inner);

            // Outer flame (orange)
            const outerGeometry = new THREE.ConeGeometry(0.1, 0.6, 8);
            const outerMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.6
            });
            const outer = new THREE.Mesh(outerGeometry, outerMaterial);
            outer.position.y = 0.25;
            flameGroup.add(outer);

            // Flame glow
            const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff4400,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.y = 0.1;
            flameGroup.add(glow);

            parent.add(flameGroup);
            this.flames.push(flameGroup);
        }
    }

    createRopes() {
        this.ropes = [];
        const corners = [[-0.55, 0.55], [0.55, 0.55], [-0.55, -0.55], [0.55, -0.55]];

        corners.forEach(([x, z]) => {
            const ropeGroup = new THREE.Group();

            // Create rope as a series of small segments (catenary curve approximation)
            const segments = 10;
            const startY = 0;
            const endY = 3.5 - this.baseRadius * 0.7;

            for (let i = 0; i < segments; i++) {
                const t = i / segments;
                const nextT = (i + 1) / segments;

                const y1 = startY + t * (endY - startY);
                const y2 = startY + nextT * (endY - startY);

                // Slight curve inward
                const curve = Math.sin(t * Math.PI) * 0.1;
                const nextCurve = Math.sin(nextT * Math.PI) * 0.1;

                const segGeometry = new THREE.CylinderGeometry(0.02, 0.02, (endY - startY) / segments);
                const segMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8b7355,
                    roughness: 0.9
                });
                const seg = new THREE.Mesh(segGeometry, segMaterial);
                seg.position.set(x * (1 - curve), (y1 + y2) / 2, z * (1 - curve));
                ropeGroup.add(seg);
            }

            this.group.add(ropeGroup);
            this.ropes.push(ropeGroup);
        });
    }

    createGround() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a7c59,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1.5;
        this.group.add(ground);

        // Some grass tufts
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 15;
            const z = (Math.random() - 0.5) * 15;
            if (Math.abs(x) < 1 && Math.abs(z) < 1) continue;

            const grassGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
            const grassMaterial = new THREE.MeshBasicMaterial({ color: 0x3d6b4f });
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);
            grass.position.set(x, -1.35, z);
            this.group.add(grass);
        }
    }

    createParticles() {
        this.particleSystem = new ParticleSystem(this.scene, {
            count: 50,
            baseSpeed: 0.015,
            particleSize: 0.05,
            showCollisions: true
        });

        // Set center offset to balloon position
        this.particleSystem.setCenterOffset(0, 3.5, 0);
        this.updateParticleBounds();
        this.particleSystem.createParticles();
        this.particleSystem.setTemperature(this.state.temperature);
    }

    setupLighting() {
        // Warm light from burner
        const burnerLight = new THREE.PointLight(0xff6600, 1, 5);
        burnerLight.position.set(0, 1, 0);
        this.group.add(burnerLight);
        this.burnerLight = burnerLight;

        // Sky light
        const skyLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7c59, 0.5);
        this.group.add(skyLight);
    }

    updateBalloonSize() {
        // Calculate scale based on volume
        // Base volume at 300K = 24.6L, base radius = 2.0
        const volumeRatio = this.state.volume / 24.6;
        const radiusRatio = Math.cbrt(volumeRatio);

        this.currentRadius = this.baseRadius * radiusRatio;
        this.balloon.scale.set(radiusRatio, radiusRatio, radiusRatio);

        // Adjust balloon height to keep basket grounded
        const newBalloonY = 3.5 + (radiusRatio - 1) * 1.5;
        this.balloon.position.y = newBalloonY;

        // Update particle center offset to match balloon position
        if (this.particleSystem) {
            this.particleSystem.setCenterOffset(0, newBalloonY, 0);
        }
    }

    updateFlames() {
        // Animate flames based on intensity
        this.flameTime += 0.1;

        this.flames.forEach((flame, i) => {
            const scale = this.flameIntensity * (0.8 + Math.sin(this.flameTime + i) * 0.2);
            flame.scale.set(scale, scale * 1.2, scale);
            flame.visible = this.flameIntensity > 0.1;
        });

        // Update burner light intensity
        if (this.burnerLight) {
            this.burnerLight.intensity = this.flameIntensity * 2;
        }
    }

    updateParticleBounds() {
        const radius = this.currentRadius * 0.85;
        this.particleSystem.setBounds(radius, radius * 1.1, radius);
    }

    setTemperature(temp) {
        this.state.temperature = temp;
        // Charles's Law: V₁/T₁ = V₂/T₂ = k
        this.state.volume = this.state.k * temp;

        this.updateBalloonSize();
        this.updateParticleBounds();

        // Update particle speeds
        this.particleSystem.setTemperature(temp);

        // Reposition any particles that are outside the new bounds
        this.particleSystem.repositionParticles();

        return this.state;
    }

    setFlameIntensity(intensity) {
        this.flameIntensity = intensity / 100;
        // Flame intensity affects temperature indirectly (visual only)
    }

    getState() {
        return { ...this.state };
    }

    update(deltaTime) {
        this.updateFlames();

        if (this.particleSystem) {
            // Particle system uses centerOffset for positioning - no manual offset needed
            this.particleSystem.update(deltaTime);
        }
    }

    setParticleCount(count) {
        if (this.particleSystem) {
            // New particles are automatically created at centerOffset position
            this.particleSystem.setParticleCount(count);
        }
    }

    setAnimationSpeed(speed) {
        if (this.particleSystem) {
            this.particleSystem.animationSpeed = speed;
        }
    }

    setShowTrails(show) {
        if (this.particleSystem) {
            this.particleSystem.options.showTrails = show;
        }
    }

    setShowCollisions(show) {
        if (this.particleSystem) {
            this.particleSystem.options.showCollisions = show;
        }
    }

    dispose() {
        if (this.particleSystem) {
            this.particleSystem.clearParticles();
        }
        this.scene.remove(this.group);
    }

    reset() {
        this.state = {
            temperature: 300,
            volume: 24.6,
            pressure: 1.0,
            moles: 1.0,
            k: 0.082
        };
        this.flameIntensity = 0.5;
        this.setTemperature(300);
    }
}
