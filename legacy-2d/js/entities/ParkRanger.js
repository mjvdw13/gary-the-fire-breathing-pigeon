class ParkRanger extends Enemy {
    constructor(x, y, groundY) {
        super(x, y, 32, 56);
        this.health = 3;
        this.points = 250;
        this.speed = 60;
        this.groundY = groundY;

        // Movement
        this.moveDirection = -1;
        this.vx = this.speed * this.moveDirection;
        this.facingRight = false;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.walkAnimSpeed = 0.15;

        // Sweeping attack
        this.sweepTimer = 0;
        this.sweepCooldown = 2;
        this.isSweeping = false;
        this.sweepFrame = 0;
        this.sweepDuration = 0.5;

        // Position on ground
        this.y = groundY - this.height;
        this.affectedByGravity = false;
    }

    update(deltaTime, player, canvasWidth) {
        // Update sweep attack
        if (this.isSweeping) {
            this.sweepTimer += deltaTime;
            this.sweepFrame = Math.floor((this.sweepTimer / this.sweepDuration) * 3);
            if (this.sweepTimer >= this.sweepDuration) {
                this.isSweeping = false;
                this.sweepTimer = 0;
            }
        } else {
            // Move towards player slowly
            this.x += this.vx * deltaTime;

            // Update facing direction
            if (player) {
                this.facingRight = player.x > this.x;
                this.moveDirection = this.facingRight ? 1 : -1;
                this.vx = this.speed * this.moveDirection;
            }

            // Reverse at screen edges
            if (this.x <= 0) {
                this.x = 0;
            } else if (this.x + this.width >= canvasWidth) {
                this.x = canvasWidth - this.width;
            }

            // Check if should sweep
            this.sweepTimer += deltaTime;
            if (player && this.sweepTimer >= this.sweepCooldown) {
                const dist = Math.abs(player.x - this.x);
                if (dist < 80) {
                    this.isSweeping = true;
                    this.sweepTimer = 0;
                    this.sweepFrame = 0;
                }
            }

            // Walk animation
            this.animTimer += deltaTime;
            if (this.animTimer >= this.walkAnimSpeed) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
        }

        Enemy.prototype.update.call(this, deltaTime);
    }

    getSweepHitbox() {
        if (!this.isSweeping || this.sweepFrame < 1) return null;

        const sweepWidth = 40;
        const sweepX = this.facingRight ? this.x + this.width : this.x - sweepWidth;
        return {
            x: sweepX,
            y: this.y + 20,
            width: sweepWidth,
            height: 40
        };
    }

    render(ctx) {
        if (this.isHit) {
            ctx.globalAlpha = 0.5;
        }

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
        const skinColor = '#FFCC99';
        const skinDark = '#DDAA77';
        const shirtGreen = '#336633';
        const shirtLight = '#448844';
        const shirtDark = '#225522';
        const pantsColor = '#554433';
        const pantsDark = '#443322';
        const hatColor = '#445544';
        const hatBand = '#AA8844';
        const broomStick = '#AA8855';
        const broomBristles = '#DDCC88';
        const broomDark = '#BBAA66';

        // Legs (animated)
        const legOffset1 = this.animFrame === 0 || this.animFrame === 2 ? 2 : -2;
        const legOffset2 = this.animFrame === 1 || this.animFrame === 3 ? 2 : -2;

        // Back leg
        this.drawPixelRect(ctx, baseX + 6 + legOffset1, baseY + 36, 4, 10, pantsColor);
        this.drawPixelRect(ctx, baseX + 4 + legOffset1, baseY + 46, 6, 4, pantsDark);

        // Front leg
        this.drawPixelRect(ctx, baseX + 14 + legOffset2, baseY + 36, 4, 10, pantsColor);
        this.drawPixelRect(ctx, baseX + 12 + legOffset2, baseY + 46, 6, 4, pantsDark);

        // Broom
        this.drawBroom(ctx, baseX, baseY, broomStick, broomBristles, broomDark);

        // Body/shirt
        this.drawPixelRect(ctx, baseX + 6, baseY + 16, 12, 4, shirtLight);
        this.drawPixelRect(ctx, baseX + 4, baseY + 20, 16, 10, shirtGreen);
        this.drawPixelRect(ctx, baseX + 6, baseY + 30, 12, 6, shirtDark);

        // Arms
        const armRaise = this.isSweeping ? -this.sweepFrame * 4 : 0;
        this.drawPixelRect(ctx, baseX, baseY + 20 + armRaise, 4, 8, shirtGreen);
        this.drawPixelRect(ctx, baseX, baseY + 28 + armRaise, 3, 4, skinColor);
        this.drawPixelRect(ctx, baseX + 20, baseY + 20, 4, 8, shirtGreen);
        this.drawPixelRect(ctx, baseX + 20, baseY + 28, 3, 4, skinColor);

        // Head
        this.drawPixelRect(ctx, baseX + 8, baseY + 6, 10, 4, skinColor);
        this.drawPixelRect(ctx, baseX + 6, baseY + 8, 14, 8, skinColor);
        this.drawPixelRect(ctx, baseX + 8, baseY + 14, 10, 3, skinDark);

        // Face
        this.drawPixelRect(ctx, baseX + 16, baseY + 10, 2, 2, '#111111'); // Eye
        this.drawPixel(ctx, baseX + 16, baseY + 10, '#FFFFFF'); // Eye shine
        this.drawPixelRect(ctx, baseX + 18, baseY + 12, 2, 2, skinDark); // Nose

        // Mustache
        this.drawPixelRect(ctx, baseX + 14, baseY + 14, 6, 1, '#553322');

        // Hat
        this.drawPixelRect(ctx, baseX + 4, baseY + 4, 16, 4, hatColor);
        this.drawPixelRect(ctx, baseX + 6, baseY, 10, 4, hatColor);
        this.drawPixelRect(ctx, baseX + 6, baseY + 4, 10, 1, hatBand);

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    drawBroom(ctx, baseX, baseY, stick, bristles, dark) {
        const sweepAngle = this.isSweeping ? this.sweepFrame * 15 : 0;

        ctx.save();
        ctx.translate(baseX + 4, baseY + 24);
        ctx.rotate((-30 + sweepAngle) * Math.PI / 180);

        // Stick
        this.drawPixelRect(ctx, 0, 0, 2, 20, stick);

        // Bristles
        this.drawPixelRect(ctx, -4, 36, 10, 2, bristles);
        this.drawPixelRect(ctx, -6, 38, 14, 4, bristles);
        this.drawPixelRect(ctx, -4, 42, 10, 3, dark);

        ctx.restore();
    }
}
