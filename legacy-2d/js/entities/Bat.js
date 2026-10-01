class Bat extends Entity {
    constructor(x, y) {
        super(x, y, 24, 20);
        this.pixel = 2;
        this.affectedByGravity = false;

        // Following behavior
        this.targetX = x;
        this.targetY = y;
        this.followSpeed = 200;
        this.hoverOffset = 0;
        this.hoverSpeed = 5;

        // Shooting
        this.shootTimer = 0;
        this.shootInterval = 0.25; // Rapid fire!
        this.facingRight = true;

        // Animation
        this.wingFrame = 0;
        this.wingTimer = 0;
        this.wingSpeed = 0.08;
    }

    update(deltaTime, player, lasers) {
        // Follow player with offset
        if (player) {
            this.targetX = player.x - 30;
            this.targetY = player.y - 40;
            this.facingRight = player.facingRight;
        }

        // Smooth movement towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.x += dx * 5 * deltaTime;
        this.y += dy * 5 * deltaTime;

        // Hover animation
        this.hoverOffset += this.hoverSpeed * deltaTime;
        const hoverY = Math.sin(this.hoverOffset * 3) * 5;
        this.y += hoverY * deltaTime * 10;

        // Wing animation
        this.wingTimer += deltaTime;
        if (this.wingTimer >= this.wingSpeed) {
            this.wingTimer = 0;
            this.wingFrame = (this.wingFrame + 1) % 4;
        }

        // Rapid fire lasers
        this.shootTimer += deltaTime;
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.shoot(lasers);
        }
    }

    shoot(lasers) {
        const laserX = this.facingRight ? this.x + this.width : this.x - 16;
        const laserY = this.y + this.height / 2 - 2;
        lasers.push(new Laser(laserX, laserY, this.facingRight));
    }

    render(ctx) {
        const p = this.pixel;
        const baseX = Math.floor(this.x);
        const baseY = Math.floor(this.y);

        ctx.save();
        if (!this.facingRight) {
            ctx.translate(baseX + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(baseX + this.width / 2), 0);
        }

        // Colors
        const bodyDark = '#2A1A3A';
        const bodyMain = '#4A2A5A';
        const bodyLight = '#6A4A7A';
        const wingMembrane = '#3A2040';
        const wingBone = '#5A3A6A';
        const earPink = '#AA6688';
        const eyeColor = '#FF4488';

        // Wing positions based on frame
        const wingOffsets = [0, -2, -3, -2];
        const wingY = wingOffsets[this.wingFrame];

        // Left wing
        this.drawWing(ctx, baseX - 6, baseY + 6 + wingY, wingMembrane, wingBone, false);

        // Body
        this.drawRect(ctx, baseX + 6, baseY + 4, 6, 4, bodyLight);
        this.drawRect(ctx, baseX + 4, baseY + 6, 10, 6, bodyMain);
        this.drawRect(ctx, baseX + 6, baseY + 12, 6, 3, bodyDark);

        // Right wing
        this.drawWing(ctx, baseX + 18, baseY + 6 + wingY, wingMembrane, wingBone, true);

        // Ears
        this.drawRect(ctx, baseX + 4, baseY, 3, 4, bodyMain);
        this.drawRect(ctx, baseX + 5, baseY + 1, 1, 2, earPink);
        this.drawRect(ctx, baseX + 11, baseY, 3, 4, bodyMain);
        this.drawRect(ctx, baseX + 12, baseY + 1, 1, 2, earPink);

        // Face
        // Eyes (glowing)
        this.drawRect(ctx, baseX + 5, baseY + 6, 2, 2, eyeColor);
        this.drawRect(ctx, baseX + 11, baseY + 6, 2, 2, eyeColor);
        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(baseX + 5 * p / p + 5, baseY + 6, p, p);
        ctx.fillRect(baseX + 11, baseY + 6, p, p);

        // Nose
        this.drawRect(ctx, baseX + 8, baseY + 9, 2, 1, earPink);

        // Fangs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(baseX + 7, baseY + 11, p, p * 2);
        ctx.fillRect(baseX + 10, baseY + 11, p, p * 2);

        // Feet
        this.drawRect(ctx, baseX + 5, baseY + 15, 2, 2, bodyDark);
        this.drawRect(ctx, baseX + 11, baseY + 15, 2, 2, bodyDark);

        ctx.restore();
    }

    drawWing(ctx, x, y, membrane, bone, flip) {
        const p = this.pixel;

        ctx.save();
        if (flip) {
            ctx.translate(x + 6, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(x + 6), 0);
        }

        // Wing membrane
        ctx.fillStyle = membrane;
        ctx.fillRect(x, y + 2, p * 5, p * 4);
        ctx.fillRect(x - p, y + 3, p * 2, p * 3);

        // Wing bones
        ctx.fillStyle = bone;
        ctx.fillRect(x + p * 4, y, p, p * 5);
        ctx.fillRect(x + p * 2, y + p, p, p * 4);
        ctx.fillRect(x, y + p * 2, p, p * 3);

        ctx.restore();
    }

    drawRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * this.pixel, h * this.pixel);
    }
}
