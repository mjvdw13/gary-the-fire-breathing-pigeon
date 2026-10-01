class Enemy extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.health = 1;
        this.damage = 1;
        this.points = 100;
        this.pixel = 2;
        this.facingRight = false;
        this.flashTimer = 0;
        this.isHit = false;
    }

    takeDamage(amount = 1) {
        this.health -= amount;
        this.isHit = true;
        this.flashTimer = 0.1;

        if (this.health <= 0) {
            this.active = false;
            return true; // Enemy died
        }
        return false;
    }

    update(deltaTime) {
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) {
                this.isHit = false;
            }
        }
        super.update(deltaTime);
    }

    drawPixel(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.pixel, this.pixel);
    }

    drawPixelRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * this.pixel, h * this.pixel);
    }
}
