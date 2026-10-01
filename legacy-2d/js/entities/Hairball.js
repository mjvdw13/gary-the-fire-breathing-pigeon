class Hairball extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 16, 16);
        this.vx = vx;
        this.vy = vy;
        this.damage = 1;
        this.bounceCount = 0;
        this.maxBounces = 3;
        this.bounciness = 0.8;
        this.pixel = 2;
        this.rotation = 0;
        this.rotationSpeed = 10;
        this.affectedByGravity = true;
        this.gravity = 600;
    }

    update(deltaTime, groundY, canvasWidth) {
        // Apply gravity
        this.vy += this.gravity * deltaTime;

        // Move
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Rotate
        this.rotation += this.rotationSpeed * deltaTime;

        // Bounce off ground
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.vy = -this.vy * this.bounciness;
            this.bounceCount++;

            if (this.bounceCount >= this.maxBounces) {
                this.active = false;
            }
        }

        // Bounce off walls
        if (this.x <= 0 || this.x + this.width >= canvasWidth) {
            this.vx = -this.vx;
            if (this.x <= 0) this.x = 0;
            if (this.x + this.width >= canvasWidth) this.x = canvasWidth - this.width;
        }
    }

    render(ctx) {
        const p = this.pixel;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);

        // Colors
        const furMain = '#AA8866';
        const furLight = '#CCAA88';
        const furDark = '#886644';
        const gunkColor = '#88AA77';

        // Main hairball shape (messy circle)
        ctx.fillStyle = furMain;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Fur tufts sticking out
        ctx.fillStyle = furLight;
        this.drawTuft(ctx, -6, -2, p);
        this.drawTuft(ctx, 4, -5, p);
        this.drawTuft(ctx, 5, 3, p);
        this.drawTuft(ctx, -3, 5, p);

        ctx.fillStyle = furDark;
        this.drawTuft(ctx, -4, -4, p);
        this.drawTuft(ctx, 3, 4, p);
        this.drawTuft(ctx, -5, 2, p);

        // Gross bits
        ctx.fillStyle = gunkColor;
        ctx.fillRect(-2, -2, p, p);
        ctx.fillRect(2, 1, p, p);

        ctx.restore();
    }

    drawTuft(ctx, x, y, p) {
        ctx.fillRect(x, y, p, p);
        ctx.fillRect(x + p/2, y - p, p/2, p);
    }
}
