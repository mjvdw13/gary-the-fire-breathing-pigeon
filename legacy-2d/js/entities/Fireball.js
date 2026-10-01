class Fireball extends Entity {
    constructor(x, y, movingRight, poweredUp = false) {
        const size = poweredUp ? 35 : 20;
        super(x, y, size, size);
        this.speed = 500;
        this.vx = movingRight ? this.speed : -this.speed;
        this.vy = 0;
        this.affectedByGravity = false;
        this.pixel = poweredUp ? 3 : 2;
        this.animTimer = 0;
        this.animFrame = 0;
        this.flickerOffset = Math.random() * Math.PI * 2;
        this.poweredUp = poweredUp;
        this.damage = poweredUp ? 2 : 1;
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Animate
        this.animTimer += deltaTime;
        if (this.animTimer >= 0.08) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        this.flickerOffset += deltaTime * 15;
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -this.width ||
               this.x > canvasWidth ||
               this.y < -this.height ||
               this.y > canvasHeight;
    }

    render(ctx) {
        const p = this.pixel;
        const baseX = Math.floor(this.x);
        const baseY = Math.floor(this.y);
        const centerX = baseX + this.width / 2;
        const centerY = baseY + this.height / 2;

        // Colors - gold/white for powered up
        let coreWhite, coreYellow, innerOrange, midOrange, outerRed, tipRed;

        if (this.poweredUp) {
            coreWhite = '#FFFFFF';
            coreYellow = '#FFFFAA';
            innerOrange = '#FFD700';
            midOrange = '#FFC125';
            outerRed = '#FFB90F';
            tipRed = '#DAA520';
        } else {
            coreWhite = '#FFFFEE';
            coreYellow = '#FFEE66';
            innerOrange = '#FFAA33';
            midOrange = '#FF7711';
            outerRed = '#EE4400';
            tipRed = '#CC2200';
        }

        // Determine direction for flame trail
        const dir = this.vx > 0 ? 1 : -1;

        // Outer glow (animated) - bigger for powered up
        const baseGlow = this.poweredUp ? 20 : 12;
        const glowSize = baseGlow + Math.sin(this.flickerOffset) * (this.poweredUp ? 4 : 2);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
        gradient.addColorStop(0, 'rgba(255, 150, 50, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 30, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Flame trail (opposite to direction of travel)
        const trailX = baseX + (dir > 0 ? -2 : 14);
        this.drawFlameTrail(ctx, trailX, baseY, dir);

        // Main fireball body - pixel art style
        // Outer layer (red)
        this.drawPixelRect(ctx, baseX + 4, baseY + 2, 6, 2, outerRed);
        this.drawPixelRect(ctx, baseX + 2, baseY + 4, 10, 2, outerRed);
        this.drawPixelRect(ctx, baseX + 2, baseY + 12, 10, 2, outerRed);
        this.drawPixelRect(ctx, baseX + 4, baseY + 14, 6, 2, tipRed);

        // Middle layer (orange)
        this.drawPixelRect(ctx, baseX + 4, baseY + 4, 8, 2, midOrange);
        this.drawPixelRect(ctx, baseX + 2, baseY + 6, 10, 4, innerOrange);
        this.drawPixelRect(ctx, baseX + 4, baseY + 10, 8, 2, midOrange);

        // Inner layer (yellow/orange)
        this.drawPixelRect(ctx, baseX + 4, baseY + 6, 6, 2, coreYellow);
        this.drawPixelRect(ctx, baseX + 4, baseY + 8, 6, 2, coreYellow);

        // Core (white/bright yellow)
        this.drawPixelRect(ctx, baseX + 6, baseY + 6, 3, 4, coreWhite);

        // Animated flicker highlights
        if (this.animFrame === 0 || this.animFrame === 2) {
            this.drawPixelRect(ctx, baseX + 4, baseY + 4, 2, 2, coreYellow);
        }
        if (this.animFrame === 1 || this.animFrame === 3) {
            this.drawPixelRect(ctx, baseX + 10, baseY + 8, 2, 2, coreYellow);
        }

        // Sparkle particles
        this.drawSparkles(ctx, centerX, centerY, dir);
    }

    drawFlameTrail(ctx, x, y, dir) {
        const p = this.pixel;
        const frame = this.animFrame;

        // Colors for trail
        const colors = ['#FF7711', '#EE4400', '#CC2200', '#AA1100'];

        // Wavy trail segments
        const segments = [
            { xOff: 0, yOff: 4, h: 6 },
            { xOff: -4 * dir, yOff: 5 + (frame % 2), h: 4 },
            { xOff: -8 * dir, yOff: 6 + ((frame + 1) % 2), h: 3 },
            { xOff: -11 * dir, yOff: 7, h: 2 }
        ];

        segments.forEach((seg, i) => {
            ctx.fillStyle = colors[i];
            ctx.fillRect(
                x + seg.xOff,
                y + seg.yOff * p,
                p * 2,
                p * seg.h
            );
        });
    }

    drawSparkles(ctx, cx, cy, dir) {
        const time = this.flickerOffset;
        const sparkles = [
            { angle: time, dist: 14, size: 2 },
            { angle: time + 2, dist: 12, size: 1.5 },
            { angle: time + 4, dist: 16, size: 1 },
        ];

        ctx.fillStyle = '#FFDD44';
        sparkles.forEach(spark => {
            const sx = cx - dir * spark.dist + Math.cos(spark.angle) * 3;
            const sy = cy + Math.sin(spark.angle * 2) * 4;
            ctx.fillRect(sx, sy, spark.size * this.pixel, spark.size * this.pixel);
        });
    }

    drawPixelRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * this.pixel, h * this.pixel);
    }
}
