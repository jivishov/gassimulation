/**
 * Shared Particle Physics System
 * Handles particle creation, movement, and collisions
 */

export class ParticleSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.particles = [];
        this.options = {
            count: options.count || 50,
            baseSpeed: options.baseSpeed || 0.02,
            particleSize: options.particleSize || 0.08,
            showTrails: options.showTrails || false,
            showCollisions: options.showCollisions || true,
            ...options
        };
        this.temperature = 273; // Kelvin
        this.animationSpeed = 1;
        this.bounds = { x: 2, y: 2, z: 2 }; // Half-extents
    }

    createParticles(count = this.options.count) {
        this.clearParticles();

        for (let i = 0; i < count; i++) {
            this.addParticle();
        }

        return this.particles;
    }

    addParticle(position = null) {
        const radius = this.options.particleSize + Math.random() * 0.02;
        const geometry = new THREE.SphereGeometry(radius, 12, 12);

        const speedFactor = Math.sqrt(this.temperature / 273);
        const color = this.getParticleColor(speedFactor);

        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position
        if (position) {
            mesh.position.copy(position);
        } else {
            mesh.position.set(
                (Math.random() - 0.5) * this.bounds.x * 1.8,
                (Math.random() - 0.5) * this.bounds.y * 1.8,
                (Math.random() - 0.5) * this.bounds.z * 1.8
            );
        }

        // Velocity based on temperature
        const baseSpeed = this.options.baseSpeed * speedFactor;
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * baseSpeed,
            (Math.random() - 0.5) * baseSpeed,
            (Math.random() - 0.5) * baseSpeed
        );

        this.scene.add(mesh);

        // Trail (optional)
        let trail = null;
        if (this.options.showTrails) {
            const trailGeometry = new THREE.BufferGeometry();
            const trailPositions = new Float32Array(30 * 3);
            trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
            const trailMaterial = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            });
            trail = new THREE.Line(trailGeometry, trailMaterial);
            this.scene.add(trail);
        }

        const particle = {
            mesh,
            velocity,
            trail,
            trailPositions: [],
            radius,
            colliding: false,
            collisionTime: 0
        };

        this.particles.push(particle);
        return particle;
    }

    removeParticle() {
        if (this.particles.length === 0) return;

        const particle = this.particles.pop();
        this.scene.remove(particle.mesh);
        if (particle.trail) {
            this.scene.remove(particle.trail);
        }
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
    }

    clearParticles() {
        while (this.particles.length > 0) {
            this.removeParticle();
        }
    }

    getParticleColor(speedFactor) {
        if (speedFactor < 0.8) {
            return new THREE.Color(0x3b82f6); // Blue - cold/slow
        } else if (speedFactor < 1.2) {
            return new THREE.Color(0x10b981); // Green - medium
        } else {
            return new THREE.Color(0xef4444); // Red - hot/fast
        }
    }

    setTemperature(temp) {
        this.temperature = temp;
        const speedFactor = Math.sqrt(temp / 273);
        const baseSpeed = this.options.baseSpeed * speedFactor;

        this.particles.forEach(particle => {
            // Update velocity magnitude
            const currentSpeed = particle.velocity.length();
            if (currentSpeed > 0.0001) {
                particle.velocity.normalize().multiplyScalar(baseSpeed);
            } else {
                particle.velocity.set(
                    (Math.random() - 0.5) * baseSpeed,
                    (Math.random() - 0.5) * baseSpeed,
                    (Math.random() - 0.5) * baseSpeed
                );
            }

            // Update color
            const color = this.getParticleColor(speedFactor);
            particle.mesh.material.color = color;
            particle.mesh.material.emissive = color;
        });
    }

    setBounds(x, y, z) {
        this.bounds = { x, y, z };
    }

    setParticleCount(count) {
        const diff = count - this.particles.length;
        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                this.addParticle();
            }
        } else if (diff < 0) {
            for (let i = 0; i < -diff; i++) {
                this.removeParticle();
            }
        }
    }

    update(deltaTime) {
        const speedFactor = Math.sqrt(this.temperature / 273);

        this.particles.forEach((particle, index) => {
            const mesh = particle.mesh;
            const velocity = particle.velocity;
            const radius = particle.radius;

            // Apply velocity
            const speedMultiplier = this.animationSpeed * deltaTime * 50;
            mesh.position.x += velocity.x * speedMultiplier;
            mesh.position.y += velocity.y * speedMultiplier;
            mesh.position.z += velocity.z * speedMultiplier;

            // Update color based on current speed
            const speed = velocity.length() * speedFactor;
            const color = this.getParticleColor(speed * 30);
            mesh.material.color = color;
            mesh.material.emissive = color;

            // Wall collisions
            let collided = false;

            if (mesh.position.x + radius > this.bounds.x) {
                mesh.position.x = this.bounds.x - radius;
                velocity.x *= -1;
                collided = true;
            } else if (mesh.position.x - radius < -this.bounds.x) {
                mesh.position.x = -this.bounds.x + radius;
                velocity.x *= -1;
                collided = true;
            }

            if (mesh.position.y + radius > this.bounds.y) {
                mesh.position.y = this.bounds.y - radius;
                velocity.y *= -1;
                collided = true;
            } else if (mesh.position.y - radius < -this.bounds.y) {
                mesh.position.y = -this.bounds.y + radius;
                velocity.y *= -1;
                collided = true;
            }

            if (mesh.position.z + radius > this.bounds.z) {
                mesh.position.z = this.bounds.z - radius;
                velocity.z *= -1;
                collided = true;
            } else if (mesh.position.z - radius < -this.bounds.z) {
                mesh.position.z = -this.bounds.z + radius;
                velocity.z *= -1;
                collided = true;
            }

            // Collision highlighting
            if (collided && this.options.showCollisions) {
                particle.colliding = true;
                particle.collisionTime = 10;
                mesh.material.emissiveIntensity = 0.8;
            } else if (particle.collisionTime > 0) {
                particle.collisionTime -= deltaTime;
                mesh.material.emissiveIntensity = 0.3 + 0.5 * (particle.collisionTime / 10);
            } else {
                mesh.material.emissiveIntensity = 0.3;
            }

            // Particle-particle collisions
            for (let j = index + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = mesh.position.x - other.mesh.position.x;
                const dy = mesh.position.y - other.mesh.position.y;
                const dz = mesh.position.z - other.mesh.position.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const minDist = radius + other.radius;

                if (dist < minDist && dist > 0.001) {
                    // Elastic collision
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const nz = dz / dist;

                    const dvx = velocity.x - other.velocity.x;
                    const dvy = velocity.y - other.velocity.y;
                    const dvz = velocity.z - other.velocity.z;

                    const dvn = dvx * nx + dvy * ny + dvz * nz;

                    if (dvn > 0) continue; // Already separating

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
            if (this.options.showTrails && particle.trail) {
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
            }
        });
    }

    getCount() {
        return this.particles.length;
    }
}
