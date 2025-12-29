/**
 * Avogadro's Law Visualization
 * V₁/n₁ = V₂/n₂ (at constant temperature and pressure)
 *
 * Scene: Helium Tank Filling Balloons
 * - Helium gas tank with regulator
 * - Multiple balloons being filled
 * - More moles = larger balloons
 * - Molar volume demonstration (22.4 L/mol at STP)
 */

import { ParticleSystem } from './particles.js';

export class AvogadroScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Gas state
        this.state = {
            moles: 1.0,         // mol
            volume: 22.4,       // L (V = Vm * n)
            temperature: 273,   // K (constant - STP)
            pressure: 1.0,      // atm (constant)
            Vm: 22.4            // Molar volume at STP
        };

        // Scene objects
        this.tank = null;
        this.regulator = null;
        this.hose = null;
        this.balloons = [];
        this.nozzle = null;

        // Particle system
        this.particleSystem = null;

        // Animation
        this.flowTime = 0;
        this.gasFlowParticles = [];

        this.init();
    }

    init() {
        this.createTank();
        this.createRegulator();
        this.createHose();
        this.createBalloons();
        this.createEnvironment();
        this.createParticles();
        this.setupLighting();

        // Set camera position
        this.camera.position.set(7, 4, 8);
        this.camera.lookAt(0, 2, 0);
    }

    createTank() {
        const tankGroup = new THREE.Group();
        tankGroup.position.set(-3, 0, 0);
        this.group.add(tankGroup);

        // Main tank body (tall cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
        const tankMaterial = new THREE.MeshStandardMaterial({
            color: 0x228b22, // Forest green for helium tanks
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, tankMaterial);
        body.position.y = 1.5;
        tankGroup.add(body);

        // Tank top dome
        const topGeometry = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const top = new THREE.Mesh(topGeometry, tankMaterial);
        top.position.y = 3;
        tankGroup.add(top);

        // Tank bottom dome
        const bottomGeometry = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const bottom = new THREE.Mesh(bottomGeometry, tankMaterial);
        bottom.position.y = 0;
        tankGroup.add(bottom);

        // Tank valve assembly
        const valveGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 16);
        const valveMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccc00,
            metalness: 0.9,
            roughness: 0.2
        });
        const valve = new THREE.Mesh(valveGeometry, valveMaterial);
        valve.position.y = 3.4;
        tankGroup.add(valve);

        // Valve handle (wheel)
        const wheelGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16);
        const wheel = new THREE.Mesh(wheelGeometry, valveMaterial);
        wheel.position.y = 3.55;
        tankGroup.add(wheel);

        // Safety cap
        const capGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16);
        const capMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.6
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 3.3;
        tankGroup.add(cap);

        // "He" label on tank
        const labelGeometry = new THREE.PlaneGeometry(0.4, 0.3);
        const labelMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, 2, 0.51);
        tankGroup.add(label);

        // Tank stand/base
        const baseGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.2, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.5
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.1;
        tankGroup.add(base);

        this.tank = tankGroup;
    }

    createRegulator() {
        const regGroup = new THREE.Group();
        regGroup.position.set(-2.3, 3.2, 0);
        this.group.add(regGroup);

        // Regulator body
        const bodyGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
        const regMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, regMaterial);
        regGroup.add(body);

        // Pressure gauge
        const gaugeGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
        const gaugeMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.9
        });
        const gauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
        gauge.rotation.x = Math.PI / 2;
        gauge.position.set(0, 0.1, 0.17);
        regGroup.add(gauge);

        // Gauge face
        const faceGeometry = new THREE.CircleGeometry(0.1, 16);
        const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.set(0, 0.1, 0.2);
        regGroup.add(face);

        // Flow control knob
        const knobGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12);
        const knobMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const knob = new THREE.Mesh(knobGeometry, knobMaterial);
        knob.position.set(0.25, 0, 0);
        knob.rotation.z = Math.PI / 2;
        regGroup.add(knob);

        // Connection to tank
        const connGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8);
        const conn = new THREE.Mesh(connGeometry, regMaterial);
        conn.rotation.z = Math.PI / 2;
        conn.position.set(-0.35, 0, 0);
        regGroup.add(conn);

        this.regulator = regGroup;
    }

    createHose() {
        const hoseGroup = new THREE.Group();
        this.group.add(hoseGroup);

        // Create curved hose using tube geometry
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-2.1, 3.1, 0),
            new THREE.Vector3(-1.5, 2.5, 0.5),
            new THREE.Vector3(-0.5, 2.2, 0.3),
            new THREE.Vector3(0.5, 2.3, 0),
            new THREE.Vector3(1.5, 2.5, -0.3),
            new THREE.Vector3(2, 2.5, 0)
        ]);

        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.08, 8, false);
        const hoseMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8
        });
        const hose = new THREE.Mesh(tubeGeometry, hoseMaterial);
        hoseGroup.add(hose);

        // Nozzle at the end
        const nozzleGroup = new THREE.Group();
        nozzleGroup.position.set(2, 2.5, 0);
        nozzleGroup.rotation.z = -Math.PI / 4;

        const nozzleGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.3, 12);
        const nozzleMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.8
        });
        const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        nozzleGroup.add(nozzle);

        // Nozzle tip
        const tipGeometry = new THREE.ConeGeometry(0.05, 0.1, 12);
        const tip = new THREE.Mesh(tipGeometry, nozzleMaterial);
        tip.position.y = -0.2;
        tip.rotation.z = Math.PI;
        nozzleGroup.add(tip);

        hoseGroup.add(nozzleGroup);
        this.nozzle = nozzleGroup;

        this.hose = hoseGroup;
    }

    createBalloons() {
        this.balloons = [];
        const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181];

        // Create main balloon (the one being filled)
        const mainBalloonGroup = new THREE.Group();
        mainBalloonGroup.position.set(2.5, 3, 0);
        this.group.add(mainBalloonGroup);

        const mainGeometry = new THREE.SphereGeometry(1, 32, 24);
        const mainMaterial = new THREE.MeshPhysicalMaterial({
            color: colors[0],
            transparent: true,
            opacity: 0.8,
            metalness: 0.1,
            roughness: 0.3,
            side: THREE.DoubleSide
        });
        const mainBalloon = new THREE.Mesh(mainGeometry, mainMaterial);
        mainBalloonGroup.add(mainBalloon);

        // Balloon knot
        const knotGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const knotMaterial = new THREE.MeshStandardMaterial({ color: colors[0] });
        const knot = new THREE.Mesh(knotGeometry, knotMaterial);
        knot.position.y = -1;
        knot.scale.y = 1.5;
        mainBalloonGroup.add(knot);

        // String
        const stringGeometry = new THREE.CylinderGeometry(0.01, 0.01, 1.5, 4);
        const stringMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const string = new THREE.Mesh(stringGeometry, stringMaterial);
        string.position.y = -1.8;
        mainBalloonGroup.add(string);

        this.mainBalloon = mainBalloonGroup;
        this.mainBalloonMesh = mainBalloon;
        this.balloons.push({
            group: mainBalloonGroup,
            mesh: mainBalloon,
            baseY: 3
        });

        // Create some background balloons (already filled)
        const bgPositions = [
            { x: 4, y: 4, z: -1 },
            { x: 3.5, y: 4.5, z: 1 },
            { x: 5, y: 3.5, z: 0.5 }
        ];

        bgPositions.forEach((pos, i) => {
            const bgGroup = new THREE.Group();
            bgGroup.position.set(pos.x, pos.y, pos.z);
            this.group.add(bgGroup);

            const bgGeometry = new THREE.SphereGeometry(0.6 + Math.random() * 0.3, 16, 12);
            const bgMaterial = new THREE.MeshPhysicalMaterial({
                color: colors[(i + 1) % colors.length],
                transparent: true,
                opacity: 0.7,
                metalness: 0.1,
                roughness: 0.3
            });
            const bgBalloon = new THREE.Mesh(bgGeometry, bgMaterial);
            bgGroup.add(bgBalloon);

            // Knot and string
            const bgKnot = new THREE.Mesh(knotGeometry.clone(),
                new THREE.MeshStandardMaterial({ color: colors[(i + 1) % colors.length] }));
            bgKnot.position.y = -0.6;
            bgKnot.scale.y = 1.3;
            bgGroup.add(bgKnot);

            const bgString = new THREE.Mesh(stringGeometry.clone(), stringMaterial.clone());
            bgString.position.y = -1.3;
            bgGroup.add(bgString);

            this.balloons.push({
                group: bgGroup,
                mesh: bgBalloon,
                baseY: pos.y
            });
        });
    }

    createEnvironment() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(15, 15);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b8b83,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.2;
        this.group.add(floor);

        // Back wall
        const wallGeometry = new THREE.PlaneGeometry(15, 8);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5dc,
            roughness: 0.9
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(0, 3.8, -5);
        this.group.add(wall);

        // Table for tank
        const tableGeometry = new THREE.BoxGeometry(2, 0.1, 1.5);
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(-3, -0.15, 0);
        this.group.add(table);

        // Table legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        const corners = [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]];
        corners.forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeometry, tableMaterial);
            leg.position.set(-3 + x, -0.6, z);
            this.group.add(leg);
        });

        // Sign: "HELIUM - Handle with Care"
        const signGeometry = new THREE.PlaneGeometry(1.5, 0.5);
        const signMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(-3, 4, -0.6);
        sign.rotation.y = 0.3;
        this.group.add(sign);
    }

    createParticles() {
        this.particleSystem = new ParticleSystem(this.scene, {
            count: 50,
            baseSpeed: 0.012,
            particleSize: 0.04,
            showCollisions: true
        });

        this.updateParticleBounds();
        this.particleSystem.createParticles();
        this.particleSystem.setTemperature(this.state.temperature);

        // Offset particles to balloon position
        this.particleSystem.particles.forEach(p => {
            p.mesh.position.x += 2.5;
            p.mesh.position.y += 3;
        });
    }

    createGasFlowParticles() {
        // Small particles showing gas flow from nozzle to balloon
        this.gasFlowParticles = [];

        for (let i = 0; i < 10; i++) {
            const geometry = new THREE.SphereGeometry(0.02, 6, 6);
            const material = new THREE.MeshBasicMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.6
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.visible = false;
            this.group.add(particle);
            this.gasFlowParticles.push({
                mesh: particle,
                progress: i / 10,
                speed: 0.02 + Math.random() * 0.01
            });
        }
    }

    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.group.add(ambient);

        // Spotlight on balloons
        const spotlight = new THREE.SpotLight(0xffffff, 0.8);
        spotlight.position.set(5, 8, 5);
        spotlight.angle = Math.PI / 4;
        spotlight.castShadow = true;
        this.group.add(spotlight);
    }

    updateBalloonSize() {
        // Calculate balloon radius based on moles
        // V = Vm * n, and V = (4/3)πr³
        // So r = ³√(3V/4π)
        const volume = this.state.volume;
        const radius = Math.cbrt((3 * volume) / (4 * Math.PI)) * 0.3; // Scale factor

        if (this.mainBalloonMesh) {
            this.mainBalloonMesh.scale.set(radius, radius * 1.1, radius);

            // Adjust knot position
            const knot = this.mainBalloon.children[1];
            if (knot) {
                knot.position.y = -radius - 0.1;
            }

            // Adjust string position
            const string = this.mainBalloon.children[2];
            if (string) {
                string.position.y = -radius - 0.85;
            }

            // Balloon floats higher with more helium
            this.mainBalloon.position.y = 3 + (this.state.moles - 1) * 0.5;
        }
    }

    updateParticleBounds() {
        // Scale bounds with balloon size
        const volumeRatio = this.state.volume / 22.4;
        const radiusRatio = Math.cbrt(volumeRatio);
        const radius = 0.8 * radiusRatio;

        this.particleSystem.setBounds(radius, radius * 1.1, radius);
    }

    setMoles(moles) {
        this.state.moles = moles;
        // Avogadro's Law: V = Vm * n
        this.state.volume = this.state.Vm * moles;

        this.updateBalloonSize();
        this.updateParticleBounds();

        // Adjust particle count proportionally
        const targetCount = Math.round(50 * moles);
        const currentCount = this.particleSystem.getCount();

        if (Math.abs(targetCount - currentCount) > 5) {
            const newCount = Math.min(150, Math.max(10, targetCount));
            this.particleSystem.setParticleCount(newCount);

            // Offset new particles
            this.particleSystem.particles.forEach(p => {
                if (p.mesh.position.x < 1) {
                    p.mesh.position.x += 2.5;
                    p.mesh.position.y += 3;
                }
            });
        }

        return this.state;
    }

    getState() {
        return { ...this.state };
    }

    update(deltaTime) {
        this.flowTime += deltaTime * 0.05;

        // Gentle floating animation for balloons
        this.balloons.forEach((balloon, i) => {
            const offset = Math.sin(this.flowTime + i * 1.5) * 0.05;
            balloon.group.position.y = balloon.baseY + offset + (this.state.moles - 1) * 0.3;
            balloon.group.rotation.z = Math.sin(this.flowTime * 0.5 + i) * 0.05;
        });

        // Update main balloon position
        if (this.mainBalloon) {
            this.balloons[0].baseY = 3 + (this.state.moles - 1) * 0.5;
        }

        if (this.particleSystem) {
            // Offset for balloon position
            this.particleSystem.particles.forEach(p => {
                p.mesh.position.x -= 2.5;
                p.mesh.position.y -= 3;
            });

            this.particleSystem.update(deltaTime);

            this.particleSystem.particles.forEach(p => {
                p.mesh.position.x += 2.5;
                p.mesh.position.y += 3 + (this.state.moles - 1) * 0.5;
            });
        }
    }

    setParticleCount(count) {
        if (this.particleSystem) {
            const currentCount = this.particleSystem.getCount();
            this.particleSystem.setParticleCount(count);

            if (count > currentCount) {
                this.particleSystem.particles.slice(currentCount).forEach(p => {
                    p.mesh.position.x += 2.5;
                    p.mesh.position.y += 3;
                });
            }
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
            moles: 1.0,
            volume: 22.4,
            temperature: 273,
            pressure: 1.0,
            Vm: 22.4
        };
        this.setMoles(1.0);
    }
}
