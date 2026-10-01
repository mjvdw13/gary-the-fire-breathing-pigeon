class Laser extends Entity {
    constructor(x, y, movingRight) {
        super(x, y, 16, 4);
        this.speed = 700;
        this.vx = movingRight ? this.speed : -this.speed;
        this.vy = 0;
        this.affectedByGravity = false;
        this.damage = 1;
        this.pixel = 2;
        this.flickerTimer = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.flickerTimer += deltaTime * 20;
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

        // Laser glow
        ctx.fillStyle = 'rgba(255, 0, 100, 0.3)';
        ctx.fillRect(baseX - 2, baseY - 2, this.width + 4, this.height + 4);

        // Laser core - bright magenta/pink
        const flicker = Math.sin(this.flickerTimer) > 0;
        ctx.fillStyle = flicker ? '#FF44AA' : '#FF66BB';
        ctx.fillRect(baseX, baseY, this.width, this.height);

        // Bright center line
        ctx.fillStyle = '#FFAADD';
        ctx.fillRect(baseX, baseY + p, this.width, p);

        // Hot white center
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(baseX + 2, baseY + p, this.width - 4, p);
    }
}
