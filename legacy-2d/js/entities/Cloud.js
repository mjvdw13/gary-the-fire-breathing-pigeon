class Cloud extends Entity {
    constructor(x, y) {
        super(x, y, 64, 20);
        this.pixel = 2;
        this.fadeTimer = 0;
        this.fadeDuration = 0.5;
        this.isFading = false;
        this.respawnTimer = 0;
        this.respawnDelay = 3;
        this.isVisible = true;
        this.originalY = y;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 2;
        this.bobAmount = 3;
        this.affectedByGravity = false;
    }

    startFade() {
        if (!this.isFading && this.isVisible) {
            this.isFading = true;
            this.fadeTimer = 0;
        }
    }

    update(deltaTime) {
        // Gentle bobbing
        this.bobOffset += this.bobSpeed * deltaTime;
        this.y = this.originalY + Math.sin(this.bobOffset) * this.bobAmount;

        if (this.isFading) {
            this.fadeTimer += deltaTime;
            if (this.fadeTimer >= this.fadeDuration) {
                this.isVisible = false;
                this.isFading = false;
                this.respawnTimer = 0;
            }
        } else if (!this.isVisible) {
            this.respawnTimer += deltaTime;
            if (this.respawnTimer >= this.respawnDelay) {
                this.isVisible = true;
                this.respawnTimer = 0;
            }
        }
    }

    render(ctx) {
        if (!this.isVisible) return;

        const p = this.pixel;
        const baseX = Math.floor(this.x);
        const baseY = Math.floor(this.y);

        // Fade effect
        if (this.isFading) {
            ctx.globalAlpha = 1 - (this.fadeTimer / this.fadeDuration);
        }

        // Cloud colors
        const cloudWhite = '#FFFFFF';
        const cloudLight = '#F0F8FF';
        const cloudMid = '#E8F4FF';
        const cloudShadow = '#D0E8FF';

        // Main cloud body - fluffy shape
        // Bottom layer (shadow)
        this.drawPixelRect(ctx, baseX + 8, baseY + 14, 24, 3, cloudShadow);

        // Middle sections
        this.drawPixelRect(ctx, baseX + 4, baseY + 10, 28, 4, cloudMid);
        this.drawPixelRect(ctx, baseX + 2, baseY + 6, 30, 4, cloudLight);

        // Top puffs
        this.drawPixelRect(ctx, baseX + 6, baseY + 2, 8, 4, cloudWhite);
        this.drawPixelRect(ctx, baseX + 16, baseY + 4, 10, 4, cloudWhite);
        this.drawPixelRect(ctx, baseX + 24, baseY + 6, 6, 4, cloudLight);

        // Extra puffs for fluffiness
        this.drawPixelRect(ctx, baseX, baseY + 8, 4, 4, cloudLight);
        this.drawPixelRect(ctx, baseX + 30, baseY + 8, 4, 4, cloudMid);

        // Highlights
        this.drawPixelRect(ctx, baseX + 8, baseY + 4, 4, 2, '#FFFFFF');
        this.drawPixelRect(ctx, baseX + 18, baseY + 6, 3, 2, '#FFFFFF');

        ctx.globalAlpha = 1;
    }

    drawPixelRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * this.pixel, h * this.pixel);
    }
}
