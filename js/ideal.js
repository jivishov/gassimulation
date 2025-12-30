/**
 * Ideal Gas Law Visualization
 * PV = nRT
 *
 * Scene: Scuba Diving - Air Tank Calculation
 * - Scuba tank with pressure gauge
 * - Underwater environment
 * - Calculate moles of air available for diving
 * - Real-world application of ideal gas law
 */

import { ParticleSystem } from './particles.js';

export class IdealScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Gas constant
        this.R = 0.0821; // L·atm/(mol·K)
        this.basePressure = 200;
        this.baseTankDimensions = { radius: 0.38, height: 2.3, yMin: 0.1 };

        // Gas state
        this.state = {
            pressure: 200,      // atm (typical full tank)
            volume: 12,         // L (standard tank size)
            temperature: 288,   // K (15°C - typical water temp)
            moles: 100.2        // Calculated: n = PV/RT
        };

        this.calculateMoles();

        // Scene objects
        this.tank = null;
        this.pressureGauge = null;
        this.pressureNeedle = null;
        this.regulator = null;
        this.bubbles = [];

        // Particle system
        this.particleSystem = null;

        // Animation
        this.waterTime = 0;
        this.bubbleTime = 0;
        this.bubbleRate = 0.006;
        this.bubbleRiseMultiplier = 1;

        this.init();
    }

    init() {
        this.createUnderwaterEnvironment();
        this.createScubaTank();
        this.createPressureGauge();
        this.createRegulator();
        this.createBubbles();
        this.createParticles();
        this.createInfoPanel();
        this.setupLighting();
        this.updateBubbleDynamics();

        // Set camera position
        this.camera.position.set(5, 2, 8);
        this.camera.lookAt(0, 1, 0);
    }

    createUnderwaterEnvironment() {
        // Ocean floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0xc2b280, // Sandy color
            roughness: 0.9
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2;
        this.group.add(floor);

        // Coral and rocks
        this.createCoralFormations();

        // Water caustics simulation (light patterns)
        const causticGeometry = new THREE.PlaneGeometry(20, 20);
        const causticMaterial = new THREE.MeshBasicMaterial({
            color: 0x4488cc,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const caustics = new THREE.Mesh(causticGeometry, causticMaterial);
        caustics.rotation.x = -Math.PI / 2;
        caustics.position.y = -1.9;
        this.group.add(caustics);

        // Water fog effect
        this.scene.fog = new THREE.FogExp2(0x1a5276, 0.05);
    }

    createCoralFormations() {
        const coralColors = [0xff6b6b, 0xffa07a, 0x98d8c8, 0xf7dc6f, 0xbb8fce];

        // Create coral pieces
        for (let i = 0; i < 15; i++) {
            const coralGroup = new THREE.Group();
            const x = (Math.random() - 0.5) * 12;
            const z = (Math.random() - 0.5) * 12 - 3;

            if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;

            coralGroup.position.set(x, -2, z);
            this.group.add(coralGroup);

            // Different coral types
            const type = Math.floor(Math.random() * 3);
            const color = coralColors[Math.floor(Math.random() * coralColors.length)];

            if (type === 0) {
                // Branch coral
                for (let j = 0; j < 5; j++) {
                    const branchGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.4 + Math.random() * 0.3, 6);
                    const branchMaterial = new THREE.MeshStandardMaterial({ color: color });
                    const branch = new THREE.Mesh(branchGeometry, branchMaterial);
                    branch.position.set(
                        (Math.random() - 0.5) * 0.2,
                        0.2,
                        (Math.random() - 0.5) * 0.2
                    );
                    branch.rotation.set(
                        (Math.random() - 0.5) * 0.5,
                        Math.random() * Math.PI,
                        (Math.random() - 0.5) * 0.5
                    );
                    coralGroup.add(branch);
                }
            } else if (type === 1) {
                // Brain coral
                const brainGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.2, 12, 12);
                const brainMaterial = new THREE.MeshStandardMaterial({ color: color });
                const brain = new THREE.Mesh(brainGeometry, brainMaterial);
                brain.scale.y = 0.6;
                brain.position.y = 0.1;
                coralGroup.add(brain);
            } else {
                // Rock
                const rockGeometry = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 0);
                const rockMaterial = new THREE.MeshStandardMaterial({
                    color: 0x666666,
                    roughness: 0.9
                });
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                rock.position.y = 0.15;
                rock.rotation.set(Math.random(), Math.random(), Math.random());
                coralGroup.add(rock);
            }
        }

        // Seaweed
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 14;
            const z = (Math.random() - 0.5) * 14;

            if (Math.abs(x) < 2.5 && Math.abs(z) < 2) continue;

            const seaweedGroup = new THREE.Group();
            seaweedGroup.position.set(x, -2, z);
            this.group.add(seaweedGroup);

            const height = 0.5 + Math.random() * 1;
            const seaweedGeometry = new THREE.PlaneGeometry(0.1, height);
            const seaweedMaterial = new THREE.MeshStandardMaterial({
                color: 0x228b22,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });

            for (let j = 0; j < 3; j++) {
                const blade = new THREE.Mesh(seaweedGeometry, seaweedMaterial);
                blade.position.set((Math.random() - 0.5) * 0.1, height / 2, 0);
                blade.rotation.y = Math.random() * Math.PI;
                seaweedGroup.add(blade);
            }

            this.seaweedGroups = this.seaweedGroups || [];
            this.seaweedGroups.push(seaweedGroup);
        }
    }

    createScubaTank() {
        const tankGroup = new THREE.Group();
        tankGroup.position.set(0, 0, 0);
        tankGroup.rotation.x = -0.2; // Slight tilt
        this.group.add(tankGroup);

        // Main tank body (aluminum cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.45, 0.45, 2.5, 32);
        const tankMaterial = new THREE.MeshStandardMaterial({
            color: 0xffcc00, // Yellow aluminum tank
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, tankMaterial);
        body.position.y = 1.25;
        tankGroup.add(body);

        // Tank top dome
        const topGeometry = new THREE.SphereGeometry(0.45, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const top = new THREE.Mesh(topGeometry, tankMaterial);
        top.position.y = 2.5;
        tankGroup.add(top);

        // Tank bottom dome
        const bottomGeometry = new THREE.SphereGeometry(0.45, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const bottom = new THREE.Mesh(bottomGeometry, tankMaterial);
        bottom.position.y = 0;
        tankGroup.add(bottom);

        // Tank boot (rubber base)
        const bootGeometry = new THREE.CylinderGeometry(0.5, 0.52, 0.3, 32);
        const bootMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });
        const boot = new THREE.Mesh(bootGeometry, bootMaterial);
        boot.position.y = -0.15;
        tankGroup.add(boot);

        // Valve assembly (DIN/Yoke)
        const valveGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.25, 12);
        const valveMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.2
        });
        const valve = new THREE.Mesh(valveGeometry, valveMaterial);
        valve.position.y = 2.75;
        tankGroup.add(valve);

        // Valve handwheel
        const wheelGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 16);
        const wheel = new THREE.Mesh(wheelGeometry, valveMaterial);
        wheel.position.y = 2.9;
        tankGroup.add(wheel);

        // Burst disk
        const diskGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8);
        const diskMaterial = new THREE.MeshStandardMaterial({ color: 0xcd7f32 });
        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.position.set(0.15, 2.75, 0);
        disk.rotation.z = Math.PI / 2;
        tankGroup.add(disk);

        // Tank markings/label area
        const labelGeometry = new THREE.PlaneGeometry(0.6, 0.3);
        const labelMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, 1.8, 0.46);
        tankGroup.add(label);

        // Tank strap/band
        const strapGeometry = new THREE.TorusGeometry(0.48, 0.02, 4, 32);
        const strapMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const strap1 = new THREE.Mesh(strapGeometry, strapMaterial);
        strap1.rotation.x = Math.PI / 2;
        strap1.position.y = 0.8;
        tankGroup.add(strap1);
        const strap2 = new THREE.Mesh(strapGeometry, strapMaterial);
        strap2.rotation.x = Math.PI / 2;
        strap2.position.y = 1.8;
        tankGroup.add(strap2);

        this.tank = tankGroup;
    }

    createPressureGauge() {
        const gaugeGroup = new THREE.Group();
        gaugeGroup.position.set(0.8, 2.2, 0.3);
        gaugeGroup.rotation.y = Math.PI / 4;
        this.group.add(gaugeGroup);

        // Gauge housing
        const housingGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 32);
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.8
        });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.rotation.x = Math.PI / 2;
        gaugeGroup.add(housing);

        // Gauge face (white background)
        const faceGeometry = new THREE.CircleGeometry(0.22, 32);
        const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xfafafa });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.z = 0.051;
        gaugeGroup.add(face);

        // Pressure zones
        const greenZone = new THREE.RingGeometry(0.12, 0.19, 32, 1, Math.PI * 0.1, Math.PI * 0.9);
        const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x22aa22, side: THREE.DoubleSide });
        const green = new THREE.Mesh(greenZone, greenMaterial);
        green.position.z = 0.052;
        gaugeGroup.add(green);

        const yellowZone = new THREE.RingGeometry(0.12, 0.19, 16, 1, -Math.PI * 0.3, Math.PI * 0.4);
        const yellowMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaa22, side: THREE.DoubleSide });
        const yellow = new THREE.Mesh(yellowZone, yellowMaterial);
        yellow.position.z = 0.052;
        gaugeGroup.add(yellow);

        const redZone = new THREE.RingGeometry(0.12, 0.19, 16, 1, -Math.PI * 0.7, Math.PI * 0.4);
        const redMaterial = new THREE.MeshBasicMaterial({ color: 0xcc2222, side: THREE.DoubleSide });
        const red = new THREE.Mesh(redZone, redMaterial);
        red.position.z = 0.052;
        gaugeGroup.add(red);

        // Scale markings
        for (let i = 0; i <= 8; i++) {
            const angle = -Math.PI * 0.7 + (i / 8) * Math.PI * 1.4;
            const markLength = i % 2 === 0 ? 0.05 : 0.03;
            const markGeometry = new THREE.BoxGeometry(markLength, 0.01, 0.005);
            const markMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const mark = new THREE.Mesh(markGeometry, markMaterial);
            const radius = 0.18;
            mark.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0.053
            );
            mark.rotation.z = angle;
            gaugeGroup.add(mark);
        }

        // Needle
        const needleGeometry = new THREE.BoxGeometry(0.15, 0.015, 0.008);
        const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.pressureNeedle = new THREE.Mesh(needleGeometry, needleMaterial);
        this.pressureNeedle.geometry.translate(0.06, 0, 0);
        this.pressureNeedle.position.z = 0.055;
        gaugeGroup.add(this.pressureNeedle);

        // Pivot
        const pivotGeometry = new THREE.CircleGeometry(0.025, 16);
        const pivotMaterial = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
        const pivot = new THREE.Mesh(pivotGeometry, pivotMaterial);
        pivot.position.z = 0.056;
        gaugeGroup.add(pivot);

        // Hose connection to tank
        const hoseGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
        const hoseMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.8
        });
        const hose = new THREE.Mesh(hoseGeometry, hoseMaterial);
        hose.position.set(-0.3, 0, -0.2);
        hose.rotation.set(0, 0, Math.PI / 3);
        gaugeGroup.add(hose);

        this.pressureGauge = gaugeGroup;
        this.updatePressureGauge();
    }

    createRegulator() {
        const regGroup = new THREE.Group();
        regGroup.position.set(0, 2.9, 0.2);
        this.group.add(regGroup);

        // First stage (attached to tank)
        const firstStageGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 12);
        const regMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7
        });
        const firstStage = new THREE.Mesh(firstStageGeometry, regMaterial);
        firstStage.rotation.z = Math.PI / 2;
        regGroup.add(firstStage);

        // Hose ports
        for (let i = 0; i < 3; i++) {
            const portGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8);
            const port = new THREE.Mesh(portGeometry, regMaterial);
            const angle = (i - 1) * 0.8;
            port.position.set(0, Math.sin(angle) * 0.15, Math.cos(angle) * 0.15);
            port.rotation.x = angle;
            regGroup.add(port);
        }

        this.regulator = regGroup;
    }

    createBubbles() {
        this.bubbles = [];

        for (let i = 0; i < 20; i++) {
            const size = 0.03 + Math.random() * 0.05;
            const bubbleGeometry = new THREE.SphereGeometry(size, 8, 8);
            const bubbleMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xaaddff,
                transparent: true,
                opacity: 0.4,
                metalness: 0.1,
                roughness: 0.1
            });
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);

            bubble.position.set(
                (Math.random() - 0.5) * 8,
                -2 + Math.random() * 6,
                (Math.random() - 0.5) * 8
            );
            bubble.visible = false;

            this.group.add(bubble);
            this.bubbles.push({
                mesh: bubble,
                speed: 0.02 + Math.random() * 0.03,
                wobble: Math.random() * Math.PI * 2
            });
        }
    }

    createParticles() {
        this.particleSystem = new ParticleSystem(this.scene, {
            count: 50,
            baseSpeed: 0.02,
            particleSize: 0.04,
            showCollisions: true
        });

        const base = this.baseTankDimensions;
        const baseHeight = base.height;

        // Tank center is at half the height above the boot
        this.particleSystem.setCenterOffset(0, base.yMin + baseHeight / 2, 0);

        // Cylindrical bounds for scuba tank (radius ~0.4, height from bottom to top dome)
        this.cylinderParams = {
            radius: base.radius,
            yMin: base.yMin,                 // Tank bottom with boot
            yMax: base.yMin + baseHeight     // Tank top before valve
        };

        this.particleSystem.setBounds(base.radius, baseHeight / 2, base.radius);
        this.particleSystem.createParticles();
        this.particleSystem.setTemperature(this.state.temperature);
    }

    createInfoPanel() {
        // 3D info panel showing calculation
        const panelGroup = new THREE.Group();
        panelGroup.position.set(-2, 2, 1);
        panelGroup.rotation.y = 0.3;
        this.group.add(panelGroup);

        // Panel background
        const bgGeometry = new THREE.PlaneGeometry(1.8, 1.2);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        const bg = new THREE.Mesh(bgGeometry, bgMaterial);
        panelGroup.add(bg);

        // Border
        const borderGeometry = new THREE.EdgesGeometry(bgGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x4f46e5 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.position.z = 0.001;
        panelGroup.add(border);

        this.infoPanel = panelGroup;
    }

    setupLighting() {
        // Underwater ambient light (bluish)
        const ambient = new THREE.AmbientLight(0x4488aa, 0.4);
        this.group.add(ambient);

        // Directional light from above (sun through water)
        const sunLight = new THREE.DirectionalLight(0x88ccff, 0.8);
        sunLight.position.set(2, 10, 2);
        sunLight.castShadow = true;
        this.group.add(sunLight);

        // Underwater caustic effect light
        const causticLight = new THREE.PointLight(0x66aacc, 0.3, 15);
        causticLight.position.set(0, 5, 0);
        this.group.add(causticLight);
    }

    updatePressureGauge() {
        // Map pressure (0-300 atm) to needle angle
        const minAngle = -Math.PI * 0.7;
        const maxAngle = Math.PI * 0.7;
        const normalizedPressure = Math.min(1, Math.max(0, this.state.pressure / 300));
        const angle = minAngle + normalizedPressure * (maxAngle - minAngle);

        if (this.pressureNeedle) {
            this.pressureNeedle.rotation.z = angle;
        }
    }

    updateTankBounds() {
        if (!this.particleSystem) return;

        const base = this.baseTankDimensions;
        const volumeScale = Math.cbrt(this.state.volume / 12);
        const radius = base.radius * volumeScale;
        const height = base.height * volumeScale;
        const yMin = base.yMin;
        const yMax = yMin + height;

        this.cylinderParams = { radius, yMin, yMax };
        this.particleSystem.setBounds(radius, height / 2, radius);
        this.particleSystem.setCenterOffset(0, yMin + height / 2, 0);
        this.particleSystem.repositionParticles();
    }

    updateBubbleDynamics() {
        const pressureFactor = Math.max(0.2, Math.min(1.5, this.state.pressure / this.basePressure));
        const tempFactor = Math.max(0.7, Math.min(1.3, this.state.temperature / 288));

        // Higher pressure increases spawn rate, higher temp slightly speeds rise
        this.bubbleRate = 0.003 + 0.007 * pressureFactor;
        this.bubbleRiseMultiplier = 0.8 + 0.5 * pressureFactor + 0.3 * (tempFactor - 1);
    }

    calculateMoles() {
        // PV = nRT  →  n = PV/RT
        this.state.moles = (this.state.pressure * this.state.volume) /
                          (this.R * this.state.temperature);
    }

    setPressure(pressure) {
        this.state.pressure = pressure;
        this.calculateMoles();
        this.updatePressureGauge();
        this.updateBubbleDynamics();

        // Adjust particle behavior based on pressure
        if (this.particleSystem) {
            const baseSpeed = this.particleSystem.options.baseSpeed *
                              Math.sqrt(this.state.temperature / 273);
            const pressureFactor = this.state.pressure / this.basePressure;

            this.particleSystem.particles.forEach(p => {
                const dir = p.velocity.lengthSq() > 0 ? p.velocity.clone().normalize() :
                    new THREE.Vector3(
                        (Math.random() - 0.5),
                        (Math.random() - 0.5),
                        (Math.random() - 0.5)
                    ).normalize();
                const scaledSpeed = baseSpeed * pressureFactor;
                p.velocity.copy(dir.multiplyScalar(scaledSpeed));
            });
        }

        return this.state;
    }

    setVolume(volume) {
        this.state.volume = volume;
        this.calculateMoles();
        this.updateTankBounds();

        // Visually adjust tank (subtle scale)
        if (this.tank) {
            const scale = 0.9 + (volume / 12) * 0.2;
            this.tank.scale.set(1, scale, 1);
        }

        return this.state;
    }

    setTemperature(temp) {
        this.state.temperature = temp;
        this.calculateMoles();
        if (this.particleSystem) {
            this.particleSystem.setTemperature(temp);
        }
        this.updateBubbleDynamics();

        return this.state;
    }

    getState() {
        return { ...this.state };
    }

    update(deltaTime) {
        this.waterTime += deltaTime * 0.02;
        this.bubbleTime += deltaTime;

        // Animate seaweed
        if (this.seaweedGroups) {
            this.seaweedGroups.forEach((group, i) => {
                group.rotation.z = Math.sin(this.waterTime + i * 0.5) * 0.1;
            });
        }

        // Animate bubbles
        const spawnChance = this.bubbleRate * deltaTime;
        const riseFactor = this.bubbleRiseMultiplier;

        this.bubbles.forEach((bubble, i) => {
            if (Math.random() < spawnChance) {
                bubble.mesh.visible = true;
                bubble.mesh.position.set(
                    (Math.random() - 0.5) * 6,
                    -2,
                    (Math.random() - 0.5) * 6
                );
            }

            if (bubble.mesh.visible) {
                bubble.mesh.position.y += bubble.speed * riseFactor;
                bubble.mesh.position.x += Math.sin(this.waterTime * 3 + bubble.wobble) * 0.005 * riseFactor;
                bubble.mesh.position.z += Math.cos(this.waterTime * 2 + bubble.wobble) * 0.005 * riseFactor;

                // Reset when reaching surface
                if (bubble.mesh.position.y > 5) {
                    bubble.mesh.visible = false;
                }
            }
        });

        // Update particles with cylindrical bounds for the scuba tank
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime, false, this.cylinderParams);
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

    setParticleSize(size) {
        if (this.particleSystem) {
            this.particleSystem.setParticleSize(size);
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
        this.scene.fog = null;
        this.scene.remove(this.group);
    }

    reset() {
        this.state = {
            pressure: 200,
            volume: 12,
            temperature: 288,
            moles: 100.2
        };
        this.calculateMoles();
        this.setPressure(200);
        this.setVolume(12);
        this.setTemperature(288);
    }
}
