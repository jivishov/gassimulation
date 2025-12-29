/**
 * Boyle's Law Visualization
 * P₁V₁ = P₂V₂ (at constant temperature)
 *
 * Scene: Piston-Cylinder system
 * - Adjustable piston that changes volume
 * - Particles compress as volume decreases
 * - Visual pressure indicator
 */

import { ParticleSystem } from './particles.js';

export class BoyleScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Gas state
        this.state = {
            volume: 5.0,        // Liters
            pressure: 2.0,      // atm
            temperature: 273,   // K (constant)
            moles: 1.0,         // mol (constant)
            k: 10.0             // P*V constant
        };

        // Cylinder dimensions
        this.cylinderRadius = 1.5;
        this.maxHeight = 4;
        this.minHeight = 1;

        // Scene objects
        this.cylinder = null;
        this.piston = null;
        this.pistonHandle = null;
        this.pressureGauge = null;
        this.pressureNeedle = null;

        // Particle system
        this.particleSystem = null;

        this.init();
    }

    init() {
        this.createCylinder();
        this.createPiston();
        this.createPressureGauge();
        this.createParticles();
        this.createLabels();
        this.setupLighting();

        // Set camera position
        this.camera.position.set(6, 4, 6);
        this.camera.lookAt(0, 0, 0);
    }

    createCylinder() {
        // Glass cylinder (transparent tube)
        const cylinderGeometry = new THREE.CylinderGeometry(
            this.cylinderRadius,
            this.cylinderRadius,
            this.maxHeight,
            32,
            1,
            true // Open ended
        );

        const cylinderMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.9
        });

        this.cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        this.cylinder.position.y = this.maxHeight / 2;
        this.group.add(this.cylinder);

        // Cylinder base (solid)
        const baseGeometry = new THREE.CylinderGeometry(
            this.cylinderRadius + 0.1,
            this.cylinderRadius + 0.2,
            0.3,
            32
        );
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.15;
        this.group.add(base);

        // Cylinder rim at top
        const rimGeometry = new THREE.TorusGeometry(this.cylinderRadius, 0.05, 8, 32);
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.2
        });
        const topRim = new THREE.Mesh(rimGeometry, rimMaterial);
        topRim.rotation.x = Math.PI / 2;
        topRim.position.y = this.maxHeight;
        this.group.add(topRim);
    }

    createPiston() {
        // Piston head
        const pistonGeometry = new THREE.CylinderGeometry(
            this.cylinderRadius - 0.05,
            this.cylinderRadius - 0.05,
            0.2,
            32
        );
        const pistonMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.9,
            roughness: 0.2
        });

        this.piston = new THREE.Mesh(pistonGeometry, pistonMaterial);
        this.group.add(this.piston);

        // Piston rod
        const rodGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 16);
        const rodMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.3
        });
        const rod = new THREE.Mesh(rodGeometry, rodMaterial);
        rod.position.y = 1.1;
        this.piston.add(rod);

        // Piston handle (T-shape)
        const handleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 16);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc4444,
            metalness: 0.3,
            roughness: 0.5
        });
        this.pistonHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        this.pistonHandle.rotation.z = Math.PI / 2;
        this.pistonHandle.position.y = 2.2;
        this.piston.add(this.pistonHandle);

        // Handle grips
        const gripGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const grip1 = new THREE.Mesh(gripGeometry, handleMaterial);
        grip1.position.x = 0.6;
        this.pistonHandle.add(grip1);
        const grip2 = new THREE.Mesh(gripGeometry, handleMaterial);
        grip2.position.x = -0.6;
        this.pistonHandle.add(grip2);

        // Rubber seal ring on piston
        const sealGeometry = new THREE.TorusGeometry(this.cylinderRadius - 0.1, 0.03, 8, 32);
        const sealMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });
        const seal = new THREE.Mesh(sealGeometry, sealMaterial);
        seal.rotation.x = Math.PI / 2;
        seal.position.y = -0.1;
        this.piston.add(seal);

        this.updatePistonPosition();
    }

    createPressureGauge() {
        const gaugeGroup = new THREE.Group();
        gaugeGroup.position.set(this.cylinderRadius + 1.2, 2, 0);
        this.group.add(gaugeGroup);

        // Gauge body
        const gaugeBody = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 32);
        const gaugeMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        });
        const gauge = new THREE.Mesh(gaugeBody, gaugeMaterial);
        gauge.rotation.z = Math.PI / 2;
        gaugeGroup.add(gauge);

        // Gauge face
        const faceGeometry = new THREE.CircleGeometry(0.55, 32);
        const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.x = 0.11;
        face.rotation.y = Math.PI / 2;
        gaugeGroup.add(face);

        // Gauge markings (arc)
        const arcGeometry = new THREE.RingGeometry(0.35, 0.45, 32, 1, -Math.PI * 0.75, Math.PI * 1.5);
        const arcMaterial = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            side: THREE.DoubleSide
        });
        const arc = new THREE.Mesh(arcGeometry, arcMaterial);
        arc.position.x = 0.12;
        arc.rotation.y = Math.PI / 2;
        gaugeGroup.add(arc);

        // Pressure zones (green-yellow-red)
        const greenZone = new THREE.RingGeometry(0.36, 0.44, 16, 1, -Math.PI * 0.75, Math.PI * 0.5);
        const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x22cc22, side: THREE.DoubleSide });
        const green = new THREE.Mesh(greenZone, greenMaterial);
        green.position.x = 0.115;
        green.rotation.y = Math.PI / 2;
        gaugeGroup.add(green);

        const yellowZone = new THREE.RingGeometry(0.36, 0.44, 16, 1, -Math.PI * 0.25, Math.PI * 0.5);
        const yellowMaterial = new THREE.MeshBasicMaterial({ color: 0xcccc22, side: THREE.DoubleSide });
        const yellow = new THREE.Mesh(yellowZone, yellowMaterial);
        yellow.position.x = 0.115;
        yellow.rotation.y = Math.PI / 2;
        gaugeGroup.add(yellow);

        const redZone = new THREE.RingGeometry(0.36, 0.44, 16, 1, Math.PI * 0.25, Math.PI * 0.5);
        const redMaterial = new THREE.MeshBasicMaterial({ color: 0xcc2222, side: THREE.DoubleSide });
        const red = new THREE.Mesh(redZone, redMaterial);
        red.position.x = 0.115;
        red.rotation.y = Math.PI / 2;
        gaugeGroup.add(red);

        // Needle
        const needleGeometry = new THREE.BoxGeometry(0.02, 0.4, 0.02);
        const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.pressureNeedle = new THREE.Mesh(needleGeometry, needleMaterial);
        this.pressureNeedle.position.set(0.13, 0, 0);
        this.pressureNeedle.geometry.translate(0, 0.15, 0);
        gaugeGroup.add(this.pressureNeedle);

        // Needle pivot
        const pivotGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const pivot = new THREE.Mesh(pivotGeometry, needleMaterial);
        pivot.position.x = 0.13;
        gaugeGroup.add(pivot);

        // Connection pipe
        const pipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
        const pipeMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.8
        });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(-0.5, 0, 0);
        gaugeGroup.add(pipe);

        this.pressureGauge = gaugeGroup;
        this.updatePressureGauge();
    }

    createLabels() {
        // Create volume indicator arrow
        const arrowGroup = new THREE.Group();
        arrowGroup.position.set(-this.cylinderRadius - 0.5, 0, 0);
        this.group.add(arrowGroup);

        // Arrow shaft
        const shaftGeometry = new THREE.BoxGeometry(0.05, 1, 0.05);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x4f46e5 });
        const shaft = new THREE.Mesh(shaftGeometry, arrowMaterial);
        arrowGroup.add(shaft);

        // Arrow heads
        const headGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
        const headUp = new THREE.Mesh(headGeometry, arrowMaterial);
        headUp.position.y = 0.6;
        arrowGroup.add(headUp);

        const headDown = new THREE.Mesh(headGeometry, arrowMaterial);
        headDown.position.y = -0.6;
        headDown.rotation.z = Math.PI;
        arrowGroup.add(headDown);

        this.volumeArrow = arrowGroup;
    }

    createParticles() {
        this.particleSystem = new ParticleSystem(this.scene, {
            count: 50,
            baseSpeed: 0.015,
            particleSize: 0.06,
            showCollisions: true
        });

        this.updateParticleBounds();
        this.particleSystem.createParticles();
    }

    setupLighting() {
        // Additional point light inside cylinder
        const innerLight = new THREE.PointLight(0x4488ff, 0.5, 5);
        innerLight.position.set(0, 2, 0);
        this.group.add(innerLight);
    }

    updatePistonPosition() {
        // Map volume (2-10 L) to piston height
        const volumeRange = 10 - 2;
        const heightRange = this.maxHeight - this.minHeight;
        const normalizedVolume = (this.state.volume - 2) / volumeRange;
        const pistonHeight = this.minHeight + normalizedVolume * heightRange;

        this.piston.position.y = pistonHeight;

        // Update volume arrow position
        if (this.volumeArrow) {
            this.volumeArrow.position.y = pistonHeight / 2;
            this.volumeArrow.scale.y = pistonHeight / 2;
        }
    }

    updatePressureGauge() {
        // Map pressure (1-5 atm) to needle angle
        // -135 degrees (low) to +135 degrees (high)
        const minAngle = -Math.PI * 0.75;
        const maxAngle = Math.PI * 0.75;
        const pressureRange = 5 - 1;
        const normalizedPressure = Math.min(1, Math.max(0, (this.state.pressure - 1) / pressureRange));
        const angle = minAngle + normalizedPressure * (maxAngle - minAngle);

        if (this.pressureNeedle) {
            this.pressureNeedle.rotation.x = angle;
        }
    }

    updateParticleBounds() {
        // Calculate cylinder height based on volume
        const volumeRange = 10 - 2;
        const heightRange = this.maxHeight - this.minHeight;
        const normalizedVolume = (this.state.volume - 2) / volumeRange;
        const height = this.minHeight + normalizedVolume * heightRange;

        // Set bounds for particles (cylinder shape approximated as box)
        const halfHeight = height / 2;
        const halfRadius = this.cylinderRadius - 0.15;

        this.particleSystem.setBounds(halfRadius, halfHeight - 0.1, halfRadius);

        // Move particles that are outside new bounds
        this.particleSystem.particles.forEach(particle => {
            if (particle.mesh.position.y > halfHeight - 0.1) {
                particle.mesh.position.y = halfHeight - 0.2;
            }
            if (particle.mesh.position.y < 0.1) {
                particle.mesh.position.y = 0.2;
            }
        });
    }

    setVolume(volume) {
        this.state.volume = volume;
        // Boyle's Law: P₁V₁ = P₂V₂ = k
        this.state.pressure = this.state.k / volume;

        this.updatePistonPosition();
        this.updatePressureGauge();
        this.updateParticleBounds();

        return this.state;
    }

    getState() {
        return { ...this.state };
    }

    update(deltaTime) {
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
    }

    setParticleCount(count) {
        if (this.particleSystem) {
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
            volume: 5.0,
            pressure: 2.0,
            temperature: 273,
            moles: 1.0,
            k: 10.0
        };
        this.setVolume(5.0);
        this.particleSystem.setTemperature(273);
    }
}
