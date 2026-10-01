class Feather extends Entity {
    constructor(x, y, facingRight, angleOffset = 0) {
        super(x, y, 12, 6);
        this.facingRight = facingRight;
        this.speed = 350;
        this.trackingSpeed = 4; // How fast it turns toward target
        this.damage = 1;
        this.active = true;
        this.affectedByGravity = false;

        // Initial angle with offset for spread
        this.angle = facingRight ? angleOffset : Math.PI + angleOffset;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        // Target tracking
        this.target = null;
        this.trackingRange = 300;
        this.hasLockedOn = false;

        // Visual
        this.rotation = this.angle;
        this.trailParticles = [];
        this.flickerTimer = 0;
    }

    findTarget(enemies, boss) {
        let closestDist = this.trackingRange;
        let closestEnemy = null;

        // Check regular enemies
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dx = (enemy.x + enemy.width / 2) - (this.x + this.width / 2);
            const dy = (enemy.y + enemy.height / 2) - (this.y + this.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }

        // Check boss
        if (boss && boss.active) {
            const dx = (boss.x + boss.width / 2) - (this.x + this.width / 2);
            const dy = (boss.y + boss.height / 2) - (this.y + this.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestEnemy = boss;
            }
        }

        return closestEnemy;
    }

    update(deltaTime, enemies = [], boss = null) {
        this.flickerTimer += deltaTime;

        // Find target if we don't have one
        if (!this.target || !this.target.active) {
            this.target = this.findTarget(enemies, boss);
        }

        // Track toward target
        if (this.target && this.target.active) {
            const targetX = this.target.x + this.target.width / 2;
            const targetY = this.target.y + this.target.height / 2;
            const dx = targetX - (this.x + this.width / 2);
            const dy = targetY - (this.y + this.height / 2);
            const targetAngle = Math.atan2(dy, dx);

            // Smoothly rotate toward target
            let angleDiff = targetAngle - this.angle;

            // Normalize angle difference to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            this.angle += angleDiff * this.trackingSpeed * deltaTime;
            this.hasLockedOn = true;
        }

        // Update velocity based on angle
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.rotation = this.angle;

        // Move
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Add trail particles
        if (Math.random() < 0.5) {
            this.trailParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                life: 0.15,
                size: 2 + Math.random() * 2
            });
        }

        // Update trail
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            this.trailParticles[i].life -= deltaTime;
            if (this.trailParticles[i].life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -50 ||
               this.x > canvasWidth + 50 ||
               this.y < -50 ||
               this.y > canvasHeight + 50;
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();

        // Draw trail
        for (const particle of this.trailParticles) {
            const alpha = particle.life / 0.15;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        }

        // Translate and rotate to feather position
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);

        // Feather colors
        const quillColor = '#F5F5DC';
        const vaneColor = this.hasLockedOn ? '#FFD700' : '#FFFFFF';
        const vaneEdge = this.hasLockedOn ? '#FFA500' : '#DDDDDD';

        // Draw feather shape
        // Quill (center shaft)
        ctx.fillStyle = quillColor;
        ctx.fillRect(-6, -1, 14, 2);

        // Vane (feathery part) - top
        ctx.fillStyle = vaneColor;
        ctx.beginPath();
        ctx.moveTo(-4, -1);
        ctx.lineTo(4, -4);
        ctx.lineTo(6, -1);
        ctx.closePath();
        ctx.fill();

        // Vane - bottom
        ctx.beginPath();
        ctx.moveTo(-4, 1);
        ctx.lineTo(4, 4);
        ctx.lineTo(6, 1);
        ctx.closePath();
        ctx.fill();

        // Edge detail
        ctx.strokeStyle = vaneEdge;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-4, -1);
        ctx.lineTo(4, -4);
        ctx.moveTo(-4, 1);
        ctx.lineTo(4, 4);
        ctx.stroke();

        // Tip glow when locked on
        if (this.hasLockedOn) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(6, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
