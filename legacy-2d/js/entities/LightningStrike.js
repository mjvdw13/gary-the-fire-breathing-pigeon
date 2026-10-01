class LightningStrike extends Entity {
    constructor(x, y, facingRight) {
        super(x, y, 20, 16);
        this.facingRight = facingRight;
        this.speed = 600;
        this.vx = facingRight ? this.speed : -this.speed;
        this.vy = 0;
        this.affectedByGravity = false;
        this.damage = 3; // Powerful!
        this.active = true;

        // Visual effect
        this.flickerTimer = 0;
        this.trailParticles = [];
        this.boltTimer = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.flickerTimer += deltaTime * 25;
        this.boltTimer += deltaTime;

        // Add trail particles
        if (this.boltTimer > 0.02) {
            this.boltTimer = 0;
            this.trailParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 10,
                life: 0.15,
                size: 3 + Math.random() * 4
            });
        }

        // Update trail particles
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            this.trailParticles[i].life -= deltaTime;
            if (this.trailParticles[i].life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -this.width ||
               this.x > canvasWidth ||
               this.y < -this.height ||
               this.y > canvasHeight;
    }

    render(ctx) {
        if (!this.active) return;

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();

        // Draw trail particles first
        for (const particle of this.trailParticles) {
            const alpha = particle.life / 0.15;
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.6})`;
            ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        }

        // Outer glow
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 20;

        // Lightning ball core - electric blue
        const flicker = Math.sin(this.flickerTimer) * 0.3 + 0.7;

        // Outer ring
        ctx.fillStyle = `rgba(0, 200, 255, ${flicker * 0.5})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
        ctx.fill();

        // Middle ring
        ctx.fillStyle = `rgba(100, 255, 255, ${flicker * 0.7})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Mini lightning bolts shooting out
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;

        for (let i = 0; i < 4; i++) {
            const angle = (this.flickerTimer * 2 + i * Math.PI / 2) % (Math.PI * 2);
            const boltLength = 8 + Math.sin(this.flickerTimer * 3 + i) * 4;

            const startX = centerX + Math.cos(angle) * 6;
            const startY = centerY + Math.sin(angle) * 6;
            const midX = centerX + Math.cos(angle) * (6 + boltLength / 2) + (Math.random() - 0.5) * 4;
            const midY = centerY + Math.sin(angle) * (6 + boltLength / 2) + (Math.random() - 0.5) * 4;
            const endX = centerX + Math.cos(angle) * (6 + boltLength);
            const endY = centerY + Math.sin(angle) * (6 + boltLength);

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(midX, midY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Direction bolt (longer, in travel direction)
        const dirAngle = this.facingRight ? 0 : Math.PI;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(dirAngle) * 15, centerY + (Math.random() - 0.5) * 6);
        ctx.lineTo(centerX + Math.cos(dirAngle) * 12, centerY + (Math.random() - 0.5) * 4);
        ctx.lineTo(centerX + Math.cos(dirAngle) * 20, centerY);
        ctx.stroke();

        ctx.restore();
    }
}
