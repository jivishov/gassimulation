/**
 * Gay-Lussac's Law Visualization
 * P₁/T₁ = P₂/T₂ (at constant volume)
 *
 * Scene: Pressure Cooker on Stove
 * - Fixed volume container (pressure cooker)
 * - Stove burner heating the cooker
 * - Pressure gauge showing increasing pressure
 * - Steam release valve
 */

import { ParticleSystem } from './particles.js';

export class GayLussacScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Gas state
        this.state = {
            temperature: 350,   // K
            pressure: 1.17,     // atm (P = k * T)
            volume: 10.0,       // L (constant)
            moles: 1.0,         // mol (constant)
            k: 0.00333          // P/T constant
        };

        // Scene objects
        this.cooker = null;
        this.lid = null;
        this.stove = null;
        this.burnerFlames = [];
        this.pressureGauge = null;
        this.pressureNeedle = null;
        this.steamValve = null;
        this.steamParticles = [];

        // Particle system
        this.particleSystem = null;

        // Animation
        this.flameTime = 0;
        this.heatLevel = 0.5;
        this.steamTime = 0;

        this.init();
    }

    init() {
        this.createStove();
        this.createCooker();
        this.createPressureGauge();
        this.createSteamValve();
        this.createParticles();
        this.createKitchenElements();
        this.setupLighting();

        // Set camera position
        this.camera.position.set(6, 5, 8);
        this.camera.lookAt(0, 1, 0);
    }

    createStove() {
        const stoveGroup = new THREE.Group();
        this.group.add(stoveGroup);

        // Stove top surface
        const stoveTopGeometry = new THREE.BoxGeometry(5, 0.2, 4);
        const stoveMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.3
        });
        const stoveTop = new THREE.Mesh(stoveTopGeometry, stoveMaterial);
        stoveTop.position.y = 0;
        stoveGroup.add(stoveTop);

        // Burner ring
        const burnerGeometry = new THREE.TorusGeometry(0.8, 0.08, 8, 32);
        const burnerMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.2
        });
        const burner = new THREE.Mesh(burnerGeometry, burnerMaterial);
        burner.rotation.x = Math.PI / 2;
        burner.position.y = 0.15;
        stoveGroup.add(burner);

        // Inner burner grate
        for (let i = 0; i < 4; i++) {
            const grateGeometry = new THREE.BoxGeometry(1.4, 0.08, 0.08);
            const grate = new THREE.Mesh(grateGeometry, burnerMaterial);
            grate.rotation.y = (i * Math.PI) / 4;
            grate.position.y = 0.2;
            stoveGroup.add(grate);
        }

        // Burner flames
        this.createBurnerFlames(stoveGroup);

        // Stove control knob
        const knobGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
        const knobMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const knob = new THREE.Mesh(knobGeometry, knobMaterial);
        knob.rotation.x = Math.PI / 2;
        knob.position.set(2, 0, 0);
        stoveGroup.add(knob);

        // Knob indicator
        const indicatorGeometry = new THREE.BoxGeometry(0.02, 0.1, 0.02);
        const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(2, 0.05, 0);
        stoveGroup.add(indicator);
        this.knobIndicator = indicator;

        this.stove = stoveGroup;
    }

    createBurnerFlames(parent) {
        this.burnerFlames = [];
        const flameCount = 16;

        for (let i = 0; i < flameCount; i++) {
            const angle = (i / flameCount) * Math.PI * 2;
            const radius = 0.6;

            const flameGroup = new THREE.Group();
            flameGroup.position.set(
                Math.cos(angle) * radius,
                0.2,
                Math.sin(angle) * radius
            );

            // Blue flame (gas stove)
            const innerGeometry = new THREE.ConeGeometry(0.04, 0.2, 6);
            const innerMaterial = new THREE.MeshBasicMaterial({
                color: 0x4488ff,
                transparent: true,
                opacity: 0.9
            });
            const inner = new THREE.Mesh(innerGeometry, innerMaterial);
            inner.position.y = 0.1;
            flameGroup.add(inner);

            // Outer flame
            const outerGeometry = new THREE.ConeGeometry(0.06, 0.3, 6);
            const outerMaterial = new THREE.MeshBasicMaterial({
                color: 0x2244aa,
                transparent: true,
                opacity: 0.5
            });
            const outer = new THREE.Mesh(outerGeometry, outerMaterial);
            outer.position.y = 0.12;
            flameGroup.add(outer);

            parent.add(flameGroup);
            this.burnerFlames.push(flameGroup);
        }
    }

    createCooker() {
        const cookerGroup = new THREE.Group();
        cookerGroup.position.y = 0.35;
        this.group.add(cookerGroup);

        // Cooker body (pot)
        const bodyGeometry = new THREE.CylinderGeometry(1.3, 1.2, 1.5, 32);
        const cookerMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.9,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, cookerMaterial);
        body.position.y = 0.75;
        cookerGroup.add(body);

        // Cooker lid (dome shape)
        const lidGeometry = new THREE.SphereGeometry(1.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3);
        const lid = new THREE.Mesh(lidGeometry, cookerMaterial);
        lid.position.y = 1.5;
        cookerGroup.add(lid);
        this.lid = lid;

        // Lid rim
        const rimGeometry = new THREE.TorusGeometry(1.3, 0.05, 8, 32);
        const rim = new THREE.Mesh(rimGeometry, cookerMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 1.5;
        cookerGroup.add(rim);

        // Handles
        const handleGeometry = new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8
        });

        const handle1 = new THREE.Mesh(handleGeometry, handleMaterial);
        handle1.rotation.y = Math.PI / 2;
        handle1.position.set(1.4, 1, 0);
        cookerGroup.add(handle1);

        const handle2 = new THREE.Mesh(handleGeometry, handleMaterial);
        handle2.rotation.y = -Math.PI / 2;
        handle2.position.set(-1.4, 1, 0);
        cookerGroup.add(handle2);

        // Lid handle
        const lidHandleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16);
        const lidHandle = new THREE.Mesh(lidHandleGeometry, handleMaterial);
        lidHandle.position.y = 1.9;
        cookerGroup.add(lidHandle);

        // Safety lock indicators
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const lockGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.05);
            const lockMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
            const lock = new THREE.Mesh(lockGeometry, lockMaterial);
            lock.position.set(
                Math.cos(angle) * 1.25,
                1.5,
                Math.sin(angle) * 1.25
            );
            lock.lookAt(0, 1.5, 0);
            cookerGroup.add(lock);
        }

        this.cooker = cookerGroup;
    }

    createPressureGauge() {
        const gaugeGroup = new THREE.Group();
        gaugeGroup.position.set(0, 2.3, 0.8);
        gaugeGroup.rotation.x = -0.3;
        this.group.add(gaugeGroup);

        // Gauge housing
        const housingGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 32);
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8
        });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.rotation.x = Math.PI / 2;
        gaugeGroup.add(housing);

        // Gauge face
        const faceGeometry = new THREE.CircleGeometry(0.32, 32);
        const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xf5f5dc });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.z = 0.08;
        gaugeGroup.add(face);

        // Pressure zones arc
        const lowZone = new THREE.RingGeometry(0.2, 0.28, 16, 1, -Math.PI * 0.7, Math.PI * 0.4);
        const lowMaterial = new THREE.MeshBasicMaterial({ color: 0x22aa22, side: THREE.DoubleSide });
        const low = new THREE.Mesh(lowZone, lowMaterial);
        low.position.z = 0.081;
        gaugeGroup.add(low);

        const medZone = new THREE.RingGeometry(0.2, 0.28, 16, 1, -Math.PI * 0.3, Math.PI * 0.4);
        const medMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaa22, side: THREE.DoubleSide });
        const med = new THREE.Mesh(medZone, medMaterial);
        med.position.z = 0.081;
        gaugeGroup.add(med);

        const highZone = new THREE.RingGeometry(0.2, 0.28, 16, 1, Math.PI * 0.1, Math.PI * 0.5);
        const highMaterial = new THREE.MeshBasicMaterial({ color: 0xaa2222, side: THREE.DoubleSide });
        const high = new THREE.Mesh(highZone, highMaterial);
        high.position.z = 0.081;
        gaugeGroup.add(high);

        // Scale markings
        for (let i = 0; i <= 5; i++) {
            const angle = -Math.PI * 0.7 + (i / 5) * Math.PI * 1.2;
            const markGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.01);
            const markMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const mark = new THREE.Mesh(markGeometry, markMaterial);
            mark.position.set(
                Math.cos(angle) * 0.25,
                Math.sin(angle) * 0.25,
                0.082
            );
            mark.rotation.z = angle;
            gaugeGroup.add(mark);
        }

        // Needle
        const needleGeometry = new THREE.BoxGeometry(0.22, 0.02, 0.01);
        const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.pressureNeedle = new THREE.Mesh(needleGeometry, needleMaterial);
        this.pressureNeedle.geometry.translate(0.1, 0, 0);
        this.pressureNeedle.position.z = 0.085;
        gaugeGroup.add(this.pressureNeedle);

        // Center pivot
        const pivotGeometry = new THREE.CircleGeometry(0.04, 16);
        const pivotMaterial = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
        const pivot = new THREE.Mesh(pivotGeometry, pivotMaterial);
        pivot.position.z = 0.086;
        gaugeGroup.add(pivot);

        // "PSI" label
        const psiGeometry = new THREE.PlaneGeometry(0.15, 0.06);
        const psiMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        const psi = new THREE.Mesh(psiGeometry, psiMaterial);
        psi.position.set(0, -0.12, 0.083);
        gaugeGroup.add(psi);

        // Mounting pipe
        const pipeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const pipeMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.8
        });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.position.set(0, -0.2, -0.15);
        pipe.rotation.x = Math.PI / 4;
        gaugeGroup.add(pipe);

        this.pressureGauge = gaugeGroup;
        this.updatePressureGauge();
    }

    createSteamValve() {
        const valveGroup = new THREE.Group();
        valveGroup.position.set(-0.5, 2.2, -0.3);
        this.group.add(valveGroup);

        // Valve body
        const valveGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8);
        const valveMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.9
        });
        const valve = new THREE.Mesh(valveGeometry, valveMaterial);
        valveGroup.add(valve);

        // Valve cap (jiggles when pressure is high)
        const capGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.1, 8);
        const capMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 0.15;
        valveGroup.add(cap);
        this.valveCap = cap;

        this.steamValve = valveGroup;
    }

    createParticles() {
        this.particleSystem = new ParticleSystem(this.scene, {
            count: 50,
            baseSpeed: 0.02,
            particleSize: 0.05,
            showCollisions: true
        });

        // Bounds for inside cooker
        this.particleSystem.setBounds(1.1, 0.6, 1.1);
        this.particleSystem.createParticles();
        this.particleSystem.setTemperature(this.state.temperature);

        // Offset particles to cooker position
        this.particleSystem.particles.forEach(p => {
            p.mesh.position.y += 1.1;
        });
    }

    createKitchenElements() {
        // Counter/table
        const counterGeometry = new THREE.BoxGeometry(8, 0.5, 5);
        const counterMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 0.7
        });
        const counter = new THREE.Mesh(counterGeometry, counterMaterial);
        counter.position.y = -0.35;
        this.group.add(counter);

        // Back wall
        const wallGeometry = new THREE.PlaneGeometry(8, 4);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xe8e4dc,
            roughness: 0.9
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(0, 1.5, -2.5);
        this.group.add(wall);

        // Kitchen tiles (backsplash)
        for (let x = -3; x <= 3; x += 0.5) {
            for (let y = 0; y <= 2; y += 0.5) {
                const tileGeometry = new THREE.PlaneGeometry(0.48, 0.48);
                const tileMaterial = new THREE.MeshStandardMaterial({
                    color: (x + y) % 1 === 0 ? 0xffffff : 0xf0f0f0,
                    roughness: 0.3
                });
                const tile = new THREE.Mesh(tileGeometry, tileMaterial);
                tile.position.set(x, y + 0.25, -2.49);
                this.group.add(tile);
            }
        }
    }

    setupLighting() {
        // Stove burner glow
        const burnerLight = new THREE.PointLight(0x4488ff, 1, 3);
        burnerLight.position.set(0, 0.5, 0);
        this.group.add(burnerLight);
        this.burnerLight = burnerLight;

        // Kitchen overhead light
        const overheadLight = new THREE.PointLight(0xfff5e6, 0.5, 10);
        overheadLight.position.set(0, 4, 0);
        this.group.add(overheadLight);
    }

    updateFlames() {
        this.flameTime += 0.15;

        this.burnerFlames.forEach((flame, i) => {
            const flicker = 0.7 + Math.sin(this.flameTime + i * 0.5) * 0.3;
            const scale = this.heatLevel * flicker;
            flame.scale.set(scale, scale * 1.2, scale);
            flame.visible = this.heatLevel > 0.05;
        });

        // Update burner light
        if (this.burnerLight) {
            this.burnerLight.intensity = this.heatLevel * 2;
        }

        // Update knob indicator rotation
        if (this.knobIndicator) {
            this.knobIndicator.rotation.z = this.heatLevel * Math.PI;
        }
    }

    updatePressureGauge() {
        // Map pressure (1-2 atm) to needle angle
        // -126 degrees (low) to +126 degrees (high)
        const minAngle = -Math.PI * 0.7;
        const maxAngle = Math.PI * 0.6;
        const pressureRange = 2 - 1;
        const normalizedPressure = Math.min(1, Math.max(0, (this.state.pressure - 1) / pressureRange));
        const angle = minAngle + normalizedPressure * (maxAngle - minAngle);

        if (this.pressureNeedle) {
            this.pressureNeedle.rotation.z = angle;
        }
    }

    updateSteamValve() {
        // Valve jiggles when pressure is high
        if (this.valveCap && this.state.pressure > 1.5) {
            const jiggle = Math.sin(this.flameTime * 10) * 0.02 * (this.state.pressure - 1.5);
            this.valveCap.position.y = 0.15 + jiggle;
            this.valveCap.rotation.y = Math.sin(this.flameTime * 15) * 0.1;
        }
    }

    setTemperature(temp) {
        this.state.temperature = temp;
        // Gay-Lussac's Law: P₁/T₁ = P₂/T₂ = k
        this.state.pressure = this.state.k * temp;

        // Update particle speeds
        this.particleSystem.setTemperature(temp);

        this.updatePressureGauge();

        return this.state;
    }

    setHeatLevel(level) {
        this.heatLevel = level / 100;
    }

    getState() {
        return { ...this.state };
    }

    update(deltaTime) {
        this.updateFlames();
        this.updateSteamValve();

        if (this.particleSystem) {
            // Offset for cooker position
            this.particleSystem.particles.forEach(p => {
                p.mesh.position.y -= 1.1;
            });

            this.particleSystem.update(deltaTime);

            this.particleSystem.particles.forEach(p => {
                p.mesh.position.y += 1.1;
            });
        }
    }

    setParticleCount(count) {
        if (this.particleSystem) {
            const currentCount = this.particleSystem.getCount();
            this.particleSystem.setParticleCount(count);

            if (count > currentCount) {
                this.particleSystem.particles.slice(currentCount).forEach(p => {
                    p.mesh.position.y += 1.1;
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
            temperature: 350,
            pressure: 1.17,
            volume: 10.0,
            moles: 1.0,
            k: 0.00333
        };
        this.heatLevel = 0.5;
        this.setTemperature(350);
    }
}
