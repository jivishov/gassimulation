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
        this.heatParticles = [];

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
        this.balloon = new THREE.Group();
        this.balloon.position.y = 3.5;
        this.group.add(this.balloon);

        // Create teardrop-shaped balloon envelope using LatheGeometry for realistic shape
        const points = [];
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            // Teardrop profile: wider at top, tapers at bottom
            let radius, y;
            if (t < 0.7) {
                // Upper bulbous part
                const angle = (t / 0.7) * Math.PI;
                radius = Math.sin(angle) * this.baseRadius;
                y = Math.cos(angle) * this.baseRadius * 1.2 + this.baseRadius * 0.3;
            } else {
                // Lower tapered neck
                const neckT = (t - 0.7) / 0.3;
                radius = (1 - neckT) * this.baseRadius * 0.5 + neckT * 0.5;
                y = -this.baseRadius * 0.9 - neckT * 0.5;
            }
            points.push(new THREE.Vector2(radius, y));
        }

        // Create 16 gore panels (vertical sections) with alternating colors
        const goreColors = [
            0xe63946, 0xf1faee, 0x457b9d, 0xf1faee,
            0x1d3557, 0xf1faee, 0xa8dadc, 0xf1faee,
            0xe63946, 0xf1faee, 0x457b9d, 0xf1faee,
            0x1d3557, 0xf1faee, 0xa8dadc, 0xf1faee
        ];
        const numGores = 16;

        for (let g = 0; g < numGores; g++) {
            const goreGeometry = new THREE.LatheGeometry(
                points, 4,
                (g / numGores) * Math.PI * 2,
                (1 / numGores) * Math.PI * 2
            );

            const goreMaterial = new THREE.MeshPhysicalMaterial({
                color: goreColors[g],
                transparent: true,
                opacity: 0.88,
                side: THREE.DoubleSide,
                metalness: 0.0,
                roughness: 0.5,
            });

            const gore = new THREE.Mesh(goreGeometry, goreMaterial);
            this.balloon.add(gore);
        }

        // Vertical seam lines between gores
        const seamMaterial = new THREE.MeshBasicMaterial({ color: 0x654321 });
        for (let g = 0; g < numGores; g++) {
            const angle = (g / numGores) * Math.PI * 2;
            const seamPoints = [];
            for (let i = 0; i < points.length; i++) {
                seamPoints.push(new THREE.Vector3(
                    Math.cos(angle) * (points[i].x + 0.02),
                    points[i].y,
                    Math.sin(angle) * (points[i].x + 0.02)
                ));
            }
            const seamCurve = new THREE.CatmullRomCurve3(seamPoints);
            const seamGeometry = new THREE.TubeGeometry(seamCurve, 20, 0.02, 4, false);
            const seam = new THREE.Mesh(seamGeometry, seamMaterial);
            this.balloon.add(seam);
        }

        // Crown ring at top
        const crownGeometry = new THREE.TorusGeometry(0.3, 0.04, 8, 24);
        const crownMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.rotation.x = Math.PI / 2;
        crown.position.y = this.baseRadius * 1.5;
        this.balloon.add(crown);

        // Balloon mouth opening at bottom
        const openingGeometry = new THREE.TorusGeometry(0.5, 0.06, 8, 32);
        const openingMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8
        });
        const opening = new THREE.Mesh(openingGeometry, openingMaterial);
        opening.rotation.x = Math.PI / 2;
        opening.position.y = -this.baseRadius * 0.9 - 0.5;
        this.balloon.add(opening);

        // Throat/skirt around opening
        const skirtGeometry = new THREE.CylinderGeometry(0.5, 0.65, 0.4, 24, 1, true);
        const skirtMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc4444,
            side: THREE.DoubleSide,
            roughness: 0.8
        });
        const skirt = new THREE.Mesh(skirtGeometry, skirtMaterial);
        skirt.position.y = -this.baseRadius * 0.9 - 0.7;
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

        // Create 3 main burner flames
        for (let i = 0; i < 3; i++) {
            const flameGroup = new THREE.Group();
            flameGroup.position.set(-0.15 + i * 0.15, 0.35, 0);

            // Core flame (white-hot center)
            const coreGeometry = new THREE.ConeGeometry(0.03, 0.5, 8);
            const coreMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.95
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            core.position.y = 0.25;
            flameGroup.add(core);

            // Inner flame (bright yellow)
            const innerGeometry = new THREE.ConeGeometry(0.06, 0.6, 8);
            const innerMaterial = new THREE.MeshBasicMaterial({
                color: 0xffdd44,
                transparent: true,
                opacity: 0.85
            });
            const inner = new THREE.Mesh(innerGeometry, innerMaterial);
            inner.position.y = 0.28;
            flameGroup.add(inner);

            // Outer flame (orange)
            const outerGeometry = new THREE.ConeGeometry(0.1, 0.8, 8);
            const outerMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.6
            });
            const outer = new THREE.Mesh(outerGeometry, outerMaterial);
            outer.position.y = 0.35;
            flameGroup.add(outer);

            // Flame tip (red, flickering)
            const tipGeometry = new THREE.ConeGeometry(0.08, 0.4, 6);
            const tipMaterial = new THREE.MeshBasicMaterial({
                color: 0xff3300,
                transparent: true,
                opacity: 0.4
            });
            const tip = new THREE.Mesh(tipGeometry, tipMaterial);
            tip.position.y = 0.6;
            flameGroup.add(tip);

            // Flame glow sphere
            const glowGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff4400,
                transparent: true,
                opacity: 0.25
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.y = 0.15;
            flameGroup.add(glow);

            parent.add(flameGroup);
            this.flames.push({
                group: flameGroup,
                core: core,
                inner: inner,
                outer: outer,
                tip: tip,
                glow: glow,
                phase: i * 0.7  // Offset phase for varied animation
            });
        }

        // Create rising heat particles
        this.createHeatParticles(parent);
    }

    createHeatParticles(parent) {
        this.heatParticles = [];
        const particleCount = 15;

        for (let i = 0; i < particleCount; i++) {
            const size = 0.02 + Math.random() * 0.03;
            const geometry = new THREE.SphereGeometry(size, 6, 6);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.6
            });
            const particle = new THREE.Mesh(geometry, material);

            // Start below the flames
            particle.position.set(
                (Math.random() - 0.5) * 0.3,
                0.3,
                (Math.random() - 0.5) * 0.3
            );
            particle.visible = false;

            parent.add(particle);
            this.heatParticles.push({
                mesh: particle,
                speed: 0.02 + Math.random() * 0.02,
                wobble: Math.random() * Math.PI * 2,
                life: 0,
                maxLife: 1.5 + Math.random()
            });
        }
    }

    createRopes() {
        this.ropes = [];
        const corners = [[-0.55, 0.55], [0.55, 0.55], [-0.55, -0.55], [0.55, -0.55]];

        // Balloon mouth position (relative to balloon at y=3.5)
        const balloonMouthY = 3.5 + (-this.baseRadius * 0.9 - 0.5);

        corners.forEach(([x, z]) => {
            // Create curved rope using CatmullRomCurve3
            const startPoint = new THREE.Vector3(x, 0, z); // Basket corner
            const endPoint = new THREE.Vector3(x * 0.7, balloonMouthY, z * 0.7); // Balloon mouth

            // Create curve points with catenary-like sag
            const curvePoints = [];
            const segments = 12;
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const y = startPoint.y + t * (endPoint.y - startPoint.y);

                // Catenary sag - more sag in the middle
                const sag = Math.sin(t * Math.PI) * 0.15;

                // Interpolate x and z with slight inward curve
                const xPos = startPoint.x + t * (endPoint.x - startPoint.x) - sag * Math.sign(x);
                const zPos = startPoint.z + t * (endPoint.z - startPoint.z) - sag * Math.sign(z);

                curvePoints.push(new THREE.Vector3(xPos, y, zPos));
            }

            const ropeCurve = new THREE.CatmullRomCurve3(curvePoints);
            const ropeGeometry = new THREE.TubeGeometry(ropeCurve, 20, 0.018, 6, false);
            const ropeMaterial = new THREE.MeshStandardMaterial({
                color: 0x8b7355,
                roughness: 0.9
            });
            const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
            this.group.add(rope);
            this.ropes.push(rope);
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
        this.flameTime += 0.08;

        this.flames.forEach((flame) => {
            const t = this.flameTime + flame.phase;

            // Visibility based on intensity
            flame.group.visible = this.flameIntensity > 0.1;

            if (!flame.group.visible) return;

            // Base scale from intensity
            const baseScale = this.flameIntensity;

            // Animate each flame layer with different frequencies
            const coreFlicker = 0.9 + Math.sin(t * 15) * 0.1;
            flame.core.scale.set(baseScale * coreFlicker, baseScale * (1 + Math.sin(t * 12) * 0.15), baseScale * coreFlicker);

            const innerFlicker = 0.85 + Math.sin(t * 10 + 0.5) * 0.15;
            flame.inner.scale.set(baseScale * innerFlicker, baseScale * (1.1 + Math.sin(t * 8) * 0.2), baseScale * innerFlicker);

            const outerFlicker = 0.8 + Math.sin(t * 7 + 1) * 0.2;
            flame.outer.scale.set(baseScale * outerFlicker, baseScale * (1.2 + Math.sin(t * 6) * 0.25), baseScale * outerFlicker);

            // Tip has more dramatic movement
            const tipFlicker = 0.7 + Math.sin(t * 5 + 1.5) * 0.3;
            flame.tip.scale.set(baseScale * tipFlicker, baseScale * (1 + Math.sin(t * 4) * 0.4), baseScale * tipFlicker);
            flame.tip.position.y = 0.6 + Math.sin(t * 6) * 0.1;
            flame.tip.rotation.z = Math.sin(t * 8) * 0.1;

            // Glow pulses
            flame.glow.scale.setScalar(baseScale * (1 + Math.sin(t * 3) * 0.2));
            flame.glow.material.opacity = 0.2 + Math.sin(t * 4) * 0.1;
        });

        // Animate heat particles rising into balloon
        this.updateHeatParticles();

        // Update burner light intensity with flicker
        if (this.burnerLight) {
            this.burnerLight.intensity = this.flameIntensity * 2 * (0.9 + Math.sin(this.flameTime * 10) * 0.1);
        }
    }

    updateHeatParticles() {
        if (!this.heatParticles || this.flameIntensity < 0.1) {
            this.heatParticles.forEach(p => p.mesh.visible = false);
            return;
        }

        this.heatParticles.forEach((particle) => {
            // Randomly spawn particles
            if (!particle.mesh.visible && Math.random() < 0.03 * this.flameIntensity) {
                particle.mesh.visible = true;
                particle.life = 0;
                particle.mesh.position.set(
                    (Math.random() - 0.5) * 0.25,
                    0.5,
                    (Math.random() - 0.5) * 0.25
                );
                particle.mesh.material.opacity = 0.7;
            }

            if (particle.mesh.visible) {
                particle.life += 0.016;

                // Rise upward with wobble
                particle.mesh.position.y += particle.speed * this.flameIntensity;
                particle.mesh.position.x += Math.sin(this.flameTime * 5 + particle.wobble) * 0.003;
                particle.mesh.position.z += Math.cos(this.flameTime * 4 + particle.wobble) * 0.003;

                // Fade out as it rises
                const lifeRatio = particle.life / particle.maxLife;
                particle.mesh.material.opacity = 0.7 * (1 - lifeRatio);

                // Color shifts from orange to red as it cools
                const r = 1;
                const g = 0.4 * (1 - lifeRatio);
                const b = 0;
                particle.mesh.material.color.setRGB(r, g, b);

                // Reset when life ends or too high
                if (particle.life > particle.maxLife || particle.mesh.position.y > 2.5) {
                    particle.mesh.visible = false;
                }
            }
        });
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
