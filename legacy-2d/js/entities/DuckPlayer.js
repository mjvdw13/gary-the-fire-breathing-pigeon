class DuckPlayer extends Entity {
    constructor(x, y) {
        super(x, y, 28, 26); // Slimmer hitbox
        this.facingRight = true;
        this.grounded = false;
        this.moveSpeed = 280;
        this.jumpForce = 380;
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;
        this.shootCooldown = 0;
        this.shootCooldownTime = 0.5;

        // Flight ability (like bat but better)
        this.isFlying = false;
        this.flySpeed = 220;
        this.maxFlyTime = 3.0; // Longer flight than bat
        this.flyTime = this.maxFlyTime;
        this.flyRechargeRate = 0.8;

        // Animation state
        this.animState = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;
        this.wingFrame = 0;
        this.wingTimer = 0;

        // Shooting animation
        this.isShooting = false;
        this.shootAnimTimer = 0;
        this.shootAnimDuration = 0.2;

        // Pixel size
        this.pixel = 2;

        // Character info
        this.characterName = 'Duck';
        this.characterColor = '#FFFFFF';

        // Quacking animation
        this.quackTimer = 0;
        this.isQuacking = false;
    }

    update(deltaTime, input) {
        // Horizontal movement
        if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) {
            this.vx = -this.moveSpeed;
            this.facingRight = false;
        } else if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) {
            this.vx = this.moveSpeed;
            this.facingRight = true;
        } else {
            this.vx = 0;
        }

        // Jump / Fly
        const jumpHeld = input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp');
        const jumpPressed = input.isKeyJustPressed('KeyW') || input.isKeyJustPressed('ArrowUp');

        if (jumpPressed && this.grounded) {
            this.vy = -this.jumpForce;
            this.grounded = false;
        } else if (jumpHeld && !this.grounded && this.flyTime > 0) {
            this.isFlying = true;
            this.vy = -this.flySpeed;
            this.flyTime -= deltaTime;
        } else {
            this.isFlying = false;
        }

        // Recharge flight when grounded
        if (this.grounded) {
            this.flyTime = Math.min(this.maxFlyTime, this.flyTime + this.flyRechargeRate * deltaTime);
        }

        // Update cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        // Update animation
        this.updateAnimation(deltaTime);

        super.update(deltaTime);
    }

    updateAnimation(deltaTime) {
        // Shooting animation
        if (this.isShooting) {
            this.shootAnimTimer -= deltaTime;
            if (this.shootAnimTimer <= 0) {
                this.isShooting = false;
            }
        }

        // Quack animation (when shooting)
        if (this.isQuacking) {
            this.quackTimer -= deltaTime;
            if (this.quackTimer <= 0) {
                this.isQuacking = false;
            }
        }

        // Determine animation state
        if (!this.grounded) {
            this.animState = this.isFlying ? 'fly' : 'fall';
        } else if (Math.abs(this.vx) > 0) {
            this.animState = 'waddle';
        } else {
            this.animState = 'idle';
        }

        // Wing animation
        this.wingTimer += deltaTime;
        const wingSpeed = this.isFlying ? 0.04 : (this.grounded ? 0.2 : 0.1);
        if (this.wingTimer >= wingSpeed) {
            this.wingTimer = 0;
            this.wingFrame = (this.wingFrame + 1) % 4;
        }

        // Waddle animation
        if (this.animState === 'waddle') {
            this.animTimer += deltaTime;
            if (this.animTimer >= 0.12) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
        } else {
            this.animFrame = 0;
            this.animTimer = 0;
        }
    }

    canShoot() {
        return this.shootCooldown <= 0;
    }

    shoot(godMode = false) {
        if (!this.canShoot()) return null;

        this.shootCooldown = this.shootCooldownTime;
        this.isShooting = true;
        this.shootAnimTimer = this.shootAnimDuration;
        this.isQuacking = true;
        this.quackTimer = 0.15;

        // Spawn position
        const spawnX = this.facingRight ? this.x + this.width : this.x - 12;
        const spawnY = this.y + this.height / 2 - 3;

        // Create 3 feathers with spread
        const feathers = [];
        const spreadAngle = 0.25; // About 15 degrees spread

        feathers.push(new Feather(spawnX, spawnY - 8, this.facingRight, -spreadAngle));
        feathers.push(new Feather(spawnX, spawnY, this.facingRight, 0));
        feathers.push(new Feather(spawnX, spawnY + 8, this.facingRight, spreadAngle));

        if (godMode) {
            feathers.forEach(f => f.damage = 2);
        }

        return feathers;
    }

    drawPixel(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.pixel, this.pixel);
    }

    drawRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * this.pixel, h * this.pixel);
    }

    render(ctx, godMode = false) {
        const p = this.pixel;
        const baseX = Math.floor(this.x);
        const baseY = Math.floor(this.y);

        ctx.save();
        if (!this.facingRight) {
            ctx.translate(baseX + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(baseX + this.width / 2), 0);
        }

        // Colors - White duck
        let bodyMain, bodyLight, bodyDark, wingColor, wingDark;
        let billColor, billDark, eyeColor;

        if (godMode) {
            // Golden duck
            bodyMain = '#FFD700';
            bodyLight = '#FFEC8B';
            bodyDark = '#DAA520';
            wingColor = '#FFC125';
            wingDark = '#CD950C';
            billColor = '#FF8C00';
            billDark = '#D2691E';
            eyeColor = '#FF0000';
        } else {
            // White duck colors
            bodyMain = '#FFFFFF';
            bodyLight = '#FFFFFF';
            bodyDark = '#DDDDDD';
            wingColor = '#EEEEEE';
            wingDark = '#CCCCCC';
            billColor = '#FF8C00'; // Orange bill
            billDark = '#DD6600';
            eyeColor = '#111111';
        }

        // Waddle offset
        const waddleY = this.animState === 'waddle' ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;

        // Wing position
        const wingOffsets = [0, -2, -3, -2];
        const wingY = wingOffsets[this.wingFrame];

        // === TAIL (small cute tail) ===
        this.drawRect(ctx, baseX - 2, baseY + 12 + waddleY, 3, 2, bodyDark);
        this.drawRect(ctx, baseX - 3, baseY + 10 + waddleY, 2, 3, bodyMain);

        // === LEFT WING (behind) ===
        this.drawRect(ctx, baseX + 1, baseY + 8 + wingY + waddleY, 6, 2, wingColor);
        this.drawRect(ctx, baseX, baseY + 10 + wingY + waddleY, 7, 4, wingDark);

        // === BODY (slimmer) ===
        this.drawRect(ctx, baseX + 4, baseY + 6 + waddleY, 8, 3, bodyLight);
        this.drawRect(ctx, baseX + 2, baseY + 9 + waddleY, 10, 5, bodyMain);
        this.drawRect(ctx, baseX + 4, baseY + 14 + waddleY, 8, 3, bodyDark);

        // === RIGHT WING (in front) ===
        this.drawRect(ctx, baseX + 8, baseY + 8 + wingY + waddleY, 6, 2, wingColor);
        this.drawRect(ctx, baseX + 7, baseY + 10 + wingY + waddleY, 7, 4, wingDark);

        // === LEGS (slim orange) ===
        const legAnim = this.animState === 'waddle' ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;
        this.drawRect(ctx, baseX + 5, baseY + 17 + waddleY, 1, 3 - legAnim / 2, billColor);
        this.drawRect(ctx, baseX + 3, baseY + 19 + waddleY - legAnim / 2, 4, 1, billColor);
        this.drawRect(ctx, baseX + 10, baseY + 17 + waddleY, 1, 3 + legAnim / 2, billColor);
        this.drawRect(ctx, baseX + 8, baseY + 19 + waddleY + legAnim / 2, 4, 1, billColor);

        // === HEAD (white, rounder) ===
        this.drawRect(ctx, baseX + 12, baseY + 2 + waddleY, 6, 3, bodyMain);
        this.drawRect(ctx, baseX + 10, baseY + 4 + waddleY, 8, 5, bodyMain);
        this.drawRect(ctx, baseX + 12, baseY + 9 + waddleY, 4, 2, bodyMain);

        // Eye
        this.drawRect(ctx, baseX + 14, baseY + 4 + waddleY, 2, 2, '#FFFFFF');
        this.drawRect(ctx, baseX + 14, baseY + 4 + waddleY, 1, 1, eyeColor);
        this.drawPixel(ctx, baseX + 15, baseY + 5 + waddleY, eyeColor);

        // === BILL (orange, cute) ===
        const billOpen = this.isQuacking ? 2 : 0;
        // Upper bill
        this.drawRect(ctx, baseX + 18, baseY + 5 + waddleY, 4, 2, billColor);
        // Lower bill (drops when quacking)
        this.drawRect(ctx, baseX + 18, baseY + 7 + waddleY + billOpen, 3, 1, billDark);

        ctx.restore();

        // Draw flight meter if not full
        if (this.flyTime < this.maxFlyTime) {
            this.drawFlightMeter(ctx, baseX, baseY - 10);
        }
    }

    drawFlightMeter(ctx, x, y) {
        const width = this.width;
        const height = 4;
        const percent = this.flyTime / this.maxFlyTime;

        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, height);

        ctx.fillStyle = percent > 0.3 ? '#44AAFF' : '#FF4444';
        ctx.fillRect(x + 1, y + 1, (width - 2) * percent, height - 2);

        ctx.strokeStyle = '#000000';
        ctx.strokeRect(x, y, width, height);
    }
}
