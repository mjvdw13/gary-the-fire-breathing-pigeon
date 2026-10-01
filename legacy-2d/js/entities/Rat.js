class Rat extends Enemy {
    constructor(x, y, groundY) {
        super(x, y, 24, 16);
        this.health = 1;
        this.points = 100;
        this.speed = 180;
        this.groundY = groundY;

        // Movement
        this.moveDirection = -1;
        this.vx = this.speed * this.moveDirection;
        this.facingRight = false;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.08;

        // Keep on ground
        this.y = groundY - this.height;
        this.affectedByGravity = false;
    }

    update(deltaTime, player, canvasWidth) {
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

        // Run animation
        this.animTimer += deltaTime;
        if (this.animTimer >= this.animSpeed) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
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

        ctx.save();
        if (this.facingRight) {
            ctx.translate(baseX + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(baseX + this.width / 2), 0);
        }

        // Colors
        const furMain = '#8B7355';
        const furLight = '#A08060';
        const furDark = '#6B5344';
        const earPink = '#DDAAAA';
        const tailColor = '#CCAABB';
        const eyeColor = '#111111';
        const noseColor = '#FF9999';

        // Tail (wavy)
        const tailWave = Math.sin(this.animFrame * 1.5) * 2;
        this.drawPixelRect(ctx, baseX - 4, baseY + 6 + tailWave, 4, 1, tailColor);
        this.drawPixelRect(ctx, baseX - 6, baseY + 5 + tailWave, 2, 1, tailColor);

        // Back legs (animated)
        const backLegOffset = this.animFrame === 1 || this.animFrame === 3 ? -2 : 0;
        this.drawPixelRect(ctx, baseX + 2, baseY + 10 + backLegOffset, 2, 3, furDark);

        // Front legs (animated, opposite phase)
        const frontLegOffset = this.animFrame === 0 || this.animFrame === 2 ? -2 : 0;
        this.drawPixelRect(ctx, baseX + 12, baseY + 10 + frontLegOffset, 2, 3, furMain);

        // Body
        this.drawPixelRect(ctx, baseX + 2, baseY + 4, 8, 3, furLight);
        this.drawPixelRect(ctx, baseX, baseY + 6, 12, 4, furMain);
        this.drawPixelRect(ctx, baseX + 2, baseY + 10, 8, 2, furDark);

        // Head
        this.drawPixelRect(ctx, baseX + 10, baseY + 2, 6, 3, furLight);
        this.drawPixelRect(ctx, baseX + 10, baseY + 4, 8, 4, furMain);
        this.drawPixelRect(ctx, baseX + 12, baseY + 8, 4, 2, furDark);

        // Ears
        this.drawPixelRect(ctx, baseX + 10, baseY, 2, 3, furMain);
        this.drawPixelRect(ctx, baseX + 10, baseY + 1, 1, 1, earPink);
        this.drawPixelRect(ctx, baseX + 14, baseY, 2, 3, furMain);
        this.drawPixelRect(ctx, baseX + 14, baseY + 1, 1, 1, earPink);

        // Snout
        this.drawPixelRect(ctx, baseX + 18, baseY + 5, 3, 2, furLight);

        // Nose
        this.drawPixelRect(ctx, baseX + 20, baseY + 5, 1, 1, noseColor);

        // Eye
        this.drawPixelRect(ctx, baseX + 14, baseY + 4, 2, 2, eyeColor);
        this.drawPixel(ctx, baseX + 14 * p / 2, baseY + 4, '#FFFFFF');

        // Whiskers
        this.drawPixel(ctx, baseX + 18, baseY + 8, furDark);
        this.drawPixel(ctx, baseX + 20, baseY + 7, furDark);

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}
