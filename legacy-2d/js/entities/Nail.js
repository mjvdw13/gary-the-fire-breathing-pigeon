class Nail extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 12, 4);
        this.vx = vx;
        this.vy = vy;
        this.damage = 1;
        this.pixel = 2;
        this.rotation = 0;
        this.rotationSpeed = 12;
        this.gravity = 200;
    }

    update(deltaTime) {
        this.vy += this.gravity * deltaTime;
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.rotation += this.rotationSpeed * deltaTime;
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -20 || this.x > canvasWidth + 20 ||
               this.y < -20 || this.y > canvasHeight + 20;
    }

    render(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);

        // Nail shaft
        ctx.fillStyle = '#AAAAAA';
        ctx.fillRect(-8, -1, 14, 3);

        // Nail head (flat top)
        ctx.fillStyle = '#888888';
        ctx.fillRect(-8, -3, 3, 7);

        // Nail point
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.moveTo(6, -2);
        ctx.lineTo(10, 0.5);
        ctx.lineTo(6, 3);
        ctx.fill();

        // Metallic highlight
        ctx.fillStyle = '#DDDDDD';
        ctx.fillRect(-5, -1, 8, 1);

        ctx.restore();
    }
}
