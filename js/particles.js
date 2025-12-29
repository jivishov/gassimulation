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
        this.centerOffset = { x: 0, y: 0, z: 0 }; // Container center position
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
            emissiveIntensity: 0.4,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position relative to center offset
        if (position) {
            mesh.position.copy(position);
        } else {
            mesh.position.set(
                this.centerOffset.x + (Math.random() - 0.5) * this.bounds.x * 1.6,
                this.centerOffset.y + (Math.random() - 0.5) * this.bounds.y * 1.6,
                this.centerOffset.z + (Math.random() - 0.5) * this.bounds.z * 1.6
            );
        }

        // Velocity based on temperature (Maxwell-Boltzmann distribution approximation)
        const baseSpeed = this.options.baseSpeed * speedFactor;
        // Random direction with Gaussian-like speed distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = baseSpeed * (0.5 + Math.random());

        const velocity = new THREE.Vector3(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
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
                opacity: 0.4
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
            collisionTime: 0,
            baseColor: color.clone()
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
        // Smooth color gradient based on temperature/speed
        // Blue (cold) -> Green (normal) -> Orange -> Red (hot)
        if (speedFactor < 0.85) {
            // Cold: blue
            return new THREE.Color(0x3b82f6);
        } else if (speedFactor < 1.0) {
            // Cool: cyan-green
            return new THREE.Color(0x06b6d4);
        } else if (speedFactor < 1.15) {
            // Normal: green
            return new THREE.Color(0x10b981);
        } else if (speedFactor < 1.3) {
            // Warm: yellow-orange
            return new THREE.Color(0xf59e0b);
        } else {
            // Hot: red
            return new THREE.Color(0xef4444);
        }
    }

    setTemperature(temp) {
        this.temperature = temp;
        const speedFactor = Math.sqrt(temp / 273);
        const baseSpeed = this.options.baseSpeed * speedFactor;
        const color = this.getParticleColor(speedFactor);

        this.particles.forEach(particle => {
            // Preserve direction, scale speed
            const currentSpeed = particle.velocity.length();
            if (currentSpeed > 0.0001) {
                // Scale to new temperature-based speed with some randomness
                const newSpeed = baseSpeed * (0.7 + Math.random() * 0.6);
                particle.velocity.normalize().multiplyScalar(newSpeed);
            } else {
                // Particle was stationary, give it new random velocity
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const speed = baseSpeed * (0.5 + Math.random());
                particle.velocity.set(
                    speed * Math.sin(phi) * Math.cos(theta),
                    speed * Math.sin(phi) * Math.sin(theta),
                    speed * Math.cos(phi)
                );
            }

            // Update color based on temperature
            particle.mesh.material.color.copy(color);
            particle.mesh.material.emissive.copy(color);
            particle.baseColor = color.clone();
        });
    }

    setCenterOffset(x, y, z) {
        this.centerOffset = { x, y, z };
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

    // Constrain particles to cylindrical bounds (for piston, cooker, etc.)
    constrainToCylinder(particle, cylinderRadius, yMin, yMax) {
        const mesh = particle.mesh;
        const velocity = particle.velocity;
        const radius = particle.radius;
        let collided = false;

        // Radial constraint (circular cross-section)
        const dx = mesh.position.x - this.centerOffset.x;
        const dz = mesh.position.z - this.centerOffset.z;
        const distFromAxis = Math.sqrt(dx * dx + dz * dz);
        const maxDist = cylinderRadius - radius;

        if (distFromAxis > maxDist) {
            // Push back to cylinder wall
            const scale = maxDist / distFromAxis;
            mesh.position.x = this.centerOffset.x + dx * scale;
            mesh.position.z = this.centerOffset.z + dz * scale;

            // Reflect velocity (tangent to cylinder wall)
            const nx = dx / distFromAxis;
            const nz = dz / distFromAxis;
            const dot = velocity.x * nx + velocity.z * nz;
            velocity.x -= 2 * dot * nx;
            velocity.z -= 2 * dot * nz;
            collided = true;
        }

        // Y bounds (floor and ceiling/piston)
        if (mesh.position.y - radius < yMin) {
            mesh.position.y = yMin + radius;
            velocity.y = Math.abs(velocity.y);
            collided = true;
        } else if (mesh.position.y + radius > yMax) {
            mesh.position.y = yMax - radius;
            velocity.y = -Math.abs(velocity.y);
            collided = true;
        }

        return collided;
    }

    update(deltaTime, useBoxBounds = true, cylinderParams = null) {
        const speedFactor = Math.sqrt(this.temperature / 273);

        this.particles.forEach((particle, index) => {
            const mesh = particle.mesh;
            const velocity = particle.velocity;
            const radius = particle.radius;

            // Apply velocity with frame-rate independent movement
            const speedMultiplier = this.animationSpeed * deltaTime * 50;
            mesh.position.x += velocity.x * speedMultiplier;
            mesh.position.y += velocity.y * speedMultiplier;
            mesh.position.z += velocity.z * speedMultiplier;

            let collided = false;

            if (cylinderParams) {
                // Use cylindrical bounds
                collided = this.constrainToCylinder(
                    particle,
                    cylinderParams.radius,
                    cylinderParams.yMin,
                    cylinderParams.yMax
                );
            } else if (useBoxBounds) {
                // Use box bounds (default)
                const minX = this.centerOffset.x - this.bounds.x;
                const maxX = this.centerOffset.x + this.bounds.x;
                const minY = this.centerOffset.y - this.bounds.y;
                const maxY = this.centerOffset.y + this.bounds.y;
                const minZ = this.centerOffset.z - this.bounds.z;
                const maxZ = this.centerOffset.z + this.bounds.z;

                if (mesh.position.x + radius > maxX) {
                    mesh.position.x = maxX - radius;
                    velocity.x *= -1;
                    collided = true;
                } else if (mesh.position.x - radius < minX) {
                    mesh.position.x = minX + radius;
                    velocity.x *= -1;
                    collided = true;
                }

                if (mesh.position.y + radius > maxY) {
                    mesh.position.y = maxY - radius;
                    velocity.y *= -1;
                    collided = true;
                } else if (mesh.position.y - radius < minY) {
                    mesh.position.y = minY + radius;
                    velocity.y *= -1;
                    collided = true;
                }

                if (mesh.position.z + radius > maxZ) {
                    mesh.position.z = maxZ - radius;
                    velocity.z *= -1;
                    collided = true;
                } else if (mesh.position.z - radius < minZ) {
                    mesh.position.z = minZ + radius;
                    velocity.z *= -1;
                    collided = true;
                }
            }

            // Collision highlighting with smooth fade
            if (collided && this.options.showCollisions) {
                particle.colliding = true;
                particle.collisionTime = 8;
                mesh.material.emissiveIntensity = 1.0;
            } else if (particle.collisionTime > 0) {
                particle.collisionTime -= deltaTime;
                const fade = Math.max(0, particle.collisionTime / 8);
                mesh.material.emissiveIntensity = 0.4 + 0.6 * fade;
            } else {
                mesh.material.emissiveIntensity = 0.4;
            }

            // Particle-particle collisions (elastic)
            for (let j = index + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = mesh.position.x - other.mesh.position.x;
                const dy = mesh.position.y - other.mesh.position.y;
                const dz = mesh.position.z - other.mesh.position.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const minDist = radius + other.radius;

                if (dist < minDist && dist > 0.001) {
                    // Elastic collision response
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const nz = dz / dist;

                    const dvx = velocity.x - other.velocity.x;
                    const dvy = velocity.y - other.velocity.y;
                    const dvz = velocity.z - other.velocity.z;

                    const dvn = dvx * nx + dvy * ny + dvz * nz;

                    if (dvn > 0) continue; // Already separating

                    // Apply impulse
                    velocity.x -= dvn * nx;
                    velocity.y -= dvn * ny;
                    velocity.z -= dvn * nz;

                    other.velocity.x += dvn * nx;
                    other.velocity.y += dvn * ny;
                    other.velocity.z += dvn * nz;

                    // Separate overlapping particles
                    const overlap = minDist - dist;
                    mesh.position.x += overlap * nx * 0.5;
                    mesh.position.y += overlap * ny * 0.5;
                    mesh.position.z += overlap * nz * 0.5;
                    other.mesh.position.x -= overlap * nx * 0.5;
                    other.mesh.position.y -= overlap * ny * 0.5;
                    other.mesh.position.z -= overlap * nz * 0.5;

                    // Both particles flash on collision
                    if (this.options.showCollisions) {
                        particle.collisionTime = 5;
                        other.collisionTime = 5;
                    }
                }
            }

            // Update trail if enabled
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
            } else if (particle.trail) {
                particle.trail.visible = false;
            }
        });
    }

    // Reposition all particles within current bounds
    repositionParticles() {
        this.particles.forEach(particle => {
            particle.mesh.position.set(
                this.centerOffset.x + (Math.random() - 0.5) * this.bounds.x * 1.6,
                this.centerOffset.y + (Math.random() - 0.5) * this.bounds.y * 1.6,
                this.centerOffset.z + (Math.random() - 0.5) * this.bounds.z * 1.6
            );
        });
    }

    getCount() {
        return this.particles.length;
    }
}
