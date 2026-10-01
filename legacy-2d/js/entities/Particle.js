class Particle {
    constructor(x, y, type = 'poof') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.lifetime = 0;
        this.maxLifetime = 0.5;
        this.pixel = 3;

        // Particle properties
        this.particles = [];
        this.createParticles();
    }

    createParticles() {
        const numParticles = 15 + Math.floor(Math.random() * 8);

        // Fire/spark colors
        const fireColors = [
            '#FFFFCC', // White hot
            '#FFFF66', // Bright yellow
            '#FFDD33', // Yellow
            '#FFAA00', // Orange yellow
            '#FF8800', // Orange
            '#FF5500', // Red orange
            '#EE3300', // Red
            '#CC2200', // Dark red
        ];

        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 / numParticles) * i + (Math.random() - 0.5) * 0.8;
            const speed = 100 + Math.random() * 150;
            const size = 1 + Math.floor(Math.random() * 3); // Pixel sizes: 1, 2, or 3

            // Hotter (brighter) particles move faster and are smaller
            const colorIndex = Math.min(Math.floor(Math.random() * fireColors.length), fireColors.length - 1);
            const color = fireColors[colorIndex];

            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 10,
                y: this.y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 80, // Upward bias (fire rises)
                size: size,
                color: color,
                colorIndex: colorIndex,
                gravity: 300 + Math.random() * 100,
                type: 'fire'
            });
        }

        // Add ember particles (small, slow, float up)
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: -50 - Math.random() * 80, // Float upward
                size: 1,
                color: '#FF6600',
                colorIndex: 4,
                gravity: -20, // Negative gravity - embers float up
                type: 'ember'
            });
        }

        // Add spark trails
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.5;
            const speed = 150 + Math.random() * 100;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                size: 2,
                color: '#FFFF88',
                colorIndex: 0,
                gravity: 400,
                type: 'spark',
                trail: []
            });
        }
    }

    update(deltaTime) {
        this.lifetime += deltaTime;

        if (this.lifetime >= this.maxLifetime) {
            this.active = false;
            return;
        }

        const progress = this.lifetime / this.maxLifetime;

        // Update each particle
        for (const p of this.particles) {
            // Store trail for sparks
            if (p.type === 'spark' && p.trail) {
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 5) {
                    p.trail.shift();
                }
            }

            p.vy += p.gravity * deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vx *= 0.96; // Air resistance

            // Fire particles get cooler (change color) over time
            if (p.type === 'fire') {
                const newColorIndex = Math.min(
                    Math.floor(p.colorIndex + progress * 4),
                    7
                );
                const fireColors = ['#FFFFCC', '#FFFF66', '#FFDD33', '#FFAA00', '#FF8800', '#FF5500', '#EE3300', '#CC2200'];
                p.color = fireColors[newColorIndex];
            }
        }
    }

    render(ctx) {
        const progress = this.lifetime / this.maxLifetime;
        const alpha = 1 - progress * 0.7;
        const p = this.pixel;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Draw spark trails first (behind)
        for (const particle of this.particles) {
            if (particle.type === 'spark' && particle.trail) {
                for (let i = 0; i < particle.trail.length; i++) {
                    const t = particle.trail[i];
                    const trailAlpha = (i / particle.trail.length) * 0.5;
                    ctx.globalAlpha = trailAlpha * alpha;
                    ctx.fillStyle = '#FF8844';
                    ctx.fillRect(
                        Math.floor(t.x),
                        Math.floor(t.y),
                        p,
                        p
                    );
                }
            }
        }

        ctx.globalAlpha = alpha;

        // Draw main particles
        for (const particle of this.particles) {
            const size = particle.size * p;
            const shrink = particle.type === 'ember' ? 1 : (1 - progress * 0.5);
            const finalSize = Math.max(p, Math.floor(size * shrink));

            ctx.fillStyle = particle.color;

            // Pixel-art style: just rectangles
            ctx.fillRect(
                Math.floor(particle.x - finalSize / 2),
                Math.floor(particle.y - finalSize / 2),
                finalSize,
                finalSize
            );

            // Add a brighter center pixel for larger fire particles
            if (particle.type === 'fire' && particle.size >= 2 && progress < 0.5) {
                ctx.fillStyle = '#FFFFAA';
                ctx.fillRect(
                    Math.floor(particle.x),
                    Math.floor(particle.y),
                    p,
                    p
                );
            }
        }

        ctx.restore();
    }
}
