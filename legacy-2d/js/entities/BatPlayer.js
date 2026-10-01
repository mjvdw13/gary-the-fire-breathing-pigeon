class BatPlayer extends Entity {
    constructor(x, y) {
        super(x, y, 32, 28);
        this.facingRight = true;
        this.grounded = false;
        this.moveSpeed = 350; // Faster than pigeon
        this.jumpForce = 350; // Lower jump but can fly
        this.canDoubleJump = false; // Uses flight instead
        this.hasDoubleJumped = false;
        this.shootCooldown = 0;
        this.shootCooldownTime = 0.15; // Rapid fire!

        // Flight ability
        this.isFlying = false;
        this.flySpeed = 250;
        this.maxFlyTime = 2.0;
        this.flyTime = this.maxFlyTime;
        this.flyRechargeRate = 1.0; // Recharges when grounded

        // Animation state
        this.animState = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;
        this.wingFrame = 0;
        this.wingTimer = 0;
        this.wingSpeed = 0.06;

        // Shooting animation
        this.shootAnimTimer = 0;
        this.shootAnimDuration = 0.1;
        this.isShooting = false;

        // Pixel size for the art
        this.pixel = 2;

        // Character info
        this.characterName = 'Bat';
        this.characterColor = '#6A4A7A';
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
            // Initial jump from ground
            this.vy = -this.jumpForce;
            this.grounded = false;
        } else if (jumpHeld && !this.grounded && this.flyTime > 0) {
            // Flying - hold jump to hover/rise
            this.isFlying = true;
            this.vy = -this.flySpeed;
            this.flyTime -= deltaTime;
        } else {
            this.isFlying = false;
        }

        // Recharge flight when grounded
        if (this.grounded) {
            this.flyTime = Math.min(this.maxFlyTime, this.flyTime + this.flyRechargeRate * deltaTime);
            this.hasDoubleJumped = false;
        }

        // Update cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        // Update animation state
        this.updateAnimation(deltaTime);

        // Call parent update
        super.update(deltaTime);
    }

    updateAnimation(deltaTime) {
        // Update shoot animation
        if (this.isShooting) {
            this.shootAnimTimer -= deltaTime;
            if (this.shootAnimTimer <= 0) {
                this.isShooting = false;
            }
        }

        // Determine animation state
        if (!this.grounded) {
            this.animState = this.isFlying ? 'fly' : 'fall';
        } else if (Math.abs(this.vx) > 0) {
            this.animState = 'walk';
        } else {
            this.animState = 'idle';
        }

        // Wing animation - faster when flying
        this.wingTimer += deltaTime;
        const wingSpeedMod = this.isFlying ? 0.03 : (this.grounded ? 0.15 : 0.08);
        if (this.wingTimer >= wingSpeedMod) {
            this.wingTimer = 0;
            this.wingFrame = (this.wingFrame + 1) % 4;
        }

        // Walking animation
        if (this.animState === 'walk') {
            this.animTimer += deltaTime;
            if (this.animTimer >= 0.1) {
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

        const laserX = this.facingRight ? this.x + this.width : this.x - 16;
        const laserY = this.y + this.height / 2 - 2;

        // Return a laser instead of fireball
        const laser = new Laser(laserX, laserY, this.facingRight);
        if (godMode) {
            laser.damage = 2;
        }
        return laser;
    }

    drawPixel(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.pixel, this.pixel);
    }

    drawPixelRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * this.pixel, h * this.pixel);
    }

    render(ctx, godMode = false) {
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
        let bodyDark, bodyMain, bodyLight, wingMembrane, wingBone, earPink, eyeColor;

        if (godMode) {
            bodyDark = '#B8860B';
            bodyMain = '#DAA520';
            bodyLight = '#FFD700';
            wingMembrane = '#CD950C';
            wingBone = '#FFC125';
            earPink = '#FFB6C1';
            eyeColor = '#FF6600';
        } else {
            bodyDark = '#2A1A3A';
            bodyMain = '#4A2A5A';
            bodyLight = '#6A4A7A';
            wingMembrane = '#3A2040';
            wingBone = '#5A3A6A';
            earPink = '#AA6688';
            eyeColor = '#FF4488';
        }

        // Wing positions based on frame
        const wingOffsets = [0, -3, -5, -3];
        const wingY = wingOffsets[this.wingFrame];

        // Left wing (behind body)
        this.drawWing(ctx, baseX - 4, baseY + 8 + wingY, wingMembrane, wingBone, false);

        // Body
        this.drawPixelRect(ctx, baseX + 8, baseY + 4, 8, 5, bodyLight);
        this.drawPixelRect(ctx, baseX + 6, baseY + 8, 12, 8, bodyMain);
        this.drawPixelRect(ctx, baseX + 8, baseY + 16, 8, 4, bodyDark);

        // Right wing (in front)
        this.drawWing(ctx, baseX + 24, baseY + 8 + wingY, wingMembrane, wingBone, true);

        // Ears
        this.drawPixelRect(ctx, baseX + 6, baseY, 4, 5, bodyMain);
        this.drawPixelRect(ctx, baseX + 7, baseY + 1, 2, 3, earPink);
        this.drawPixelRect(ctx, baseX + 14, baseY, 4, 5, bodyMain);
        this.drawPixelRect(ctx, baseX + 15, baseY + 1, 2, 3, earPink);

        // Face
        // Eyes (glowing)
        this.drawPixelRect(ctx, baseX + 7, baseY + 8, 3, 3, eyeColor);
        this.drawPixelRect(ctx, baseX + 14, baseY + 8, 3, 3, eyeColor);
        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(baseX + 7, baseY + 8, p, p);
        ctx.fillRect(baseX + 14, baseY + 8, p, p);

        // Nose
        this.drawPixelRect(ctx, baseX + 10, baseY + 12, 4, 2, earPink);

        // Mouth
        if (this.isShooting) {
            // Open mouth shooting
            this.drawPixelRect(ctx, baseX + 9, baseY + 15, 6, 3, '#440022');
            // Energy charging
            this.drawPixelRect(ctx, baseX + 10, baseY + 16, 4, 2, eyeColor);
        } else {
            // Fangs
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(baseX + 9, baseY + 14, p, p * 2);
            ctx.fillRect(baseX + 14, baseY + 14, p, p * 2);
        }

        // Feet
        if (this.grounded) {
            this.drawPixelRect(ctx, baseX + 8, baseY + 20, 3, 3, bodyDark);
            this.drawPixelRect(ctx, baseX + 13, baseY + 20, 3, 3, bodyDark);
        } else {
            // Feet tucked when flying
            this.drawPixelRect(ctx, baseX + 9, baseY + 18, 2, 2, bodyDark);
            this.drawPixelRect(ctx, baseX + 13, baseY + 18, 2, 2, bodyDark);
        }

        ctx.restore();

        // Draw flight meter if not full
        if (this.flyTime < this.maxFlyTime) {
            this.drawFlightMeter(ctx, baseX, baseY - 10);
        }
    }

    drawWing(ctx, x, y, membrane, bone, flip) {
        const p = this.pixel;

        ctx.save();
        if (flip) {
            ctx.translate(x + 8, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(x + 8), 0);
        }

        // Wing membrane - larger wings
        ctx.fillStyle = membrane;
        ctx.fillRect(x, y + 3 * p, p * 7, p * 5);
        ctx.fillRect(x - p, y + 4 * p, p * 3, p * 4);

        // Wing bones
        ctx.fillStyle = bone;
        ctx.fillRect(x + p * 5, y, p, p * 7);
        ctx.fillRect(x + p * 3, y + p, p, p * 6);
        ctx.fillRect(x + p, y + p * 2, p, p * 5);
        ctx.fillRect(x - p, y + p * 3, p, p * 4);

        ctx.restore();
    }

    drawFlightMeter(ctx, x, y) {
        const width = this.width;
        const height = 4;
        const percent = this.flyTime / this.maxFlyTime;

        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, height);

        // Flight energy (purple/magenta)
        ctx.fillStyle = percent > 0.3 ? '#AA44FF' : '#FF4444';
        ctx.fillRect(x + 1, y + 1, (width - 2) * percent, height - 2);

        // Border
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(x, y, width, height);
    }
}
