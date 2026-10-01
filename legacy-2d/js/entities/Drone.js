class Drone extends Enemy {
    constructor(x, y) {
        super(x, y, 28, 20);
        this.health = 1;
        this.points = 150;
        this.speed = 120;
        this.baseY = y;
        this.hoverOffset = 0;
        this.hoverSpeed = 4;
        this.propellerFrame = 0;
        this.propellerTimer = 0;
        this.affectedByGravity = false;

        // Movement pattern
        this.moveDirection = -1;
        this.vx = this.speed * this.moveDirection;
    }

    update(deltaTime, player, canvasWidth) {
        // Hover up and down
        this.hoverOffset += this.hoverSpeed * deltaTime;
        this.y = this.baseY + Math.sin(this.hoverOffset * 2) * 15;

        // Move horizontally
        this.x += this.vx * deltaTime;

        // Reverse at screen edges
        if (this.x <= 0) {
            this.x = 0;
            this.moveDirection = 1;
            this.vx = this.speed;
            this.facingRight = true;
        } else if (this.x + this.width >= canvasWidth) {
            this.x = canvasWidth - this.width;
            this.moveDirection = -1;
            this.vx = -this.speed;
            this.facingRight = false;
        }

        // Animate propeller
        this.propellerTimer += deltaTime;
        if (this.propellerTimer >= 0.05) {
            this.propellerTimer = 0;
            this.propellerFrame = (this.propellerFrame + 1) % 2;
        }

        Enemy.prototype.update.call(this, deltaTime);
    }

    render(ctx) {
        if (this.isHit) {
            ctx.globalAlpha = 0.5;
        }

        const p = this.pixel;
        const baseX = Math.floor(this.x);
        const baseY = Math.floor(this.y);

        // Colors
        const bodyMain = '#445566';
        const bodyLight = '#667788';
        const bodyDark = '#334455';
        const propColor = '#888888';
        const lightRed = '#FF4444';
        const lightGreen = '#44FF44';
        const lensColor = '#223344';

        // Propeller (animated)
        if (this.propellerFrame === 0) {
            this.drawPixelRect(ctx, baseX + 8, baseY, 6, 1, propColor);
        } else {
            this.drawPixelRect(ctx, baseX + 10, baseY, 2, 2, propColor);
        }

        // Propeller mount
        this.drawPixelRect(ctx, baseX + 10, baseY + 2, 2, 2, bodyDark);

        // Main body
        this.drawPixelRect(ctx, baseX + 4, baseY + 4, 10, 3, bodyLight);
        this.drawPixelRect(ctx, baseX + 2, baseY + 6, 14, 4, bodyMain);
        this.drawPixelRect(ctx, baseX + 4, baseY + 10, 10, 2, bodyDark);

        // Camera lens
        this.drawPixelRect(ctx, baseX + 8, baseY + 8, 4, 3, lensColor);
        this.drawPixelRect(ctx, baseX + 9, baseY + 9, 2, 1, '#4488AA');

        // Arms/legs
        this.drawPixelRect(ctx, baseX, baseY + 8, 2, 2, bodyDark);
        this.drawPixelRect(ctx, baseX + 18, baseY + 8, 2, 2, bodyDark);
        this.drawPixelRect(ctx, baseX - 2, baseY + 10, 3, 1, bodyDark);
        this.drawPixelRect(ctx, baseX + 18, baseY + 10, 3, 1, bodyDark);

        // Status lights
        this.drawPixelRect(ctx, baseX + 4, baseY + 6, 1, 1, lightRed);
        this.drawPixelRect(ctx, baseX + 16, baseY + 6, 1, 1, lightGreen);

        ctx.globalAlpha = 1;
    }
}
