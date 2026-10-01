class Player extends Entity {
    constructor(x, y) {
        super(x, y, 32, 36);
        this.facingRight = true;
        this.grounded = false;
        this.moveSpeed = 300;
        this.jumpForce = 500;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.shootCooldown = 0;
        this.shootCooldownTime = 0.3;

        // Animation state
        this.animState = 'idle'; // idle, walk, jump, shoot
        this.animFrame = 0;
        this.animTimer = 0;
        this.walkFrameDuration = 0.1;
        this.legOffset = 0;

        // Shooting animation
        this.shootAnimTimer = 0;
        this.shootAnimDuration = 0.15;
        this.isShooting = false;

        // Pixel size for the art
        this.pixel = 2;
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

        // Jump
        const jumpPressed = input.isKeyJustPressed('KeyW') || input.isKeyJustPressed('ArrowUp');
        if (jumpPressed) {
            if (this.grounded) {
                // Regular jump from ground
                this.vy = -this.jumpForce;
                this.grounded = false;
                this.hasDoubleJumped = false;
            } else if (this.canDoubleJump && !this.hasDoubleJumped) {
                // Double jump in air
                this.vy = -this.jumpForce;
                this.hasDoubleJumped = true;
            }
        }

        // Reset double jump when landing
        if (this.grounded) {
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
            this.animState = 'jump';
        } else if (Math.abs(this.vx) > 0) {
            this.animState = 'walk';
        } else {
            this.animState = 'idle';
        }

        // Update walk animation
        if (this.animState === 'walk') {
            this.animTimer += deltaTime;
            if (this.animTimer >= this.walkFrameDuration) {
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

        const fireballX = this.facingRight
            ? this.x + this.width
            : this.x - (godMode ? 25 : 15);
        const fireballY = this.y + (godMode ? 0 : 8);

        return new Fireball(fireballX, fireballY, this.facingRight, godMode);
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

        // Flip context if facing left
        ctx.save();
        if (!this.facingRight) {
            ctx.translate(baseX + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(baseX + this.width / 2), 0);
        }

        // Colors - gold/shiny in god mode
        let bodyMain, bodyLight, bodyDark, bodyDarker, wingColor, wingDark, legColor, legDark;

        if (godMode) {
            // Shiny gold colors
            bodyMain = '#FFD700';
            bodyLight = '#FFEC8B';
            bodyDark = '#DAA520';
            bodyDarker = '#B8860B';
            wingColor = '#FFC125';
            wingDark = '#CD950C';
            legColor = '#FF8C00';
            legDark = '#D2691E';
        } else {
            // Normal colors
            bodyMain = '#8899AA';
            bodyLight = '#AAB8C8';
            bodyDark = '#667788';
            bodyDarker = '#556677';
            wingColor = '#778899';
            wingDark = '#556677';
            legColor = '#DD7755';
            legDark = '#BB5533';
        }

        const beakOrange = '#FF8844';
        const beakDark = '#DD6622';
        const eyeWhite = '#FFFFFF';
        const eyeBlack = '#222222';

        // Get leg positions based on animation
        const legPositions = this.getLegPositions();

        // Draw legs (behind body)
        this.drawLegs(ctx, baseX, baseY, legPositions, legColor, legDark);

        // Draw tail
        this.drawTail(ctx, baseX, baseY, bodyDark, bodyDarker);

        // Draw body (slimmer, more oval)
        this.drawBody(ctx, baseX, baseY, bodyMain, bodyLight, bodyDark);

        // Draw wing
        this.drawWing(ctx, baseX, baseY, wingColor, wingDark);

        // Draw head
        this.drawHead(ctx, baseX, baseY, bodyMain, bodyLight, bodyDark);

        // Draw beak (open if shooting)
        this.drawBeak(ctx, baseX, baseY, beakOrange, beakDark);

        // Draw eye
        this.drawEye(ctx, baseX, baseY, eyeWhite, eyeBlack);

        ctx.restore();
    }

    getLegPositions() {
        // Returns leg offsets for animation
        // Each leg: {x offset, y offset, lifted}
        if (this.animState === 'jump') {
            // Legs tucked up slightly when jumping
            return {
                back: { xOff: 0, yOff: -2, lifted: true },
                front: { xOff: 2, yOff: -4, lifted: true }
            };
        } else if (this.animState === 'walk') {
            // Walking animation - 4 frames
            const frames = [
                { back: { xOff: -2, yOff: 0, lifted: false }, front: { xOff: 3, yOff: -2, lifted: true } },
                { back: { xOff: 0, yOff: 0, lifted: false }, front: { xOff: 1, yOff: 0, lifted: false } },
                { back: { xOff: 3, yOff: -2, lifted: true }, front: { xOff: -2, yOff: 0, lifted: false } },
                { back: { xOff: 1, yOff: 0, lifted: false }, front: { xOff: 0, yOff: 0, lifted: false } }
            ];
            return frames[this.animFrame];
        } else {
            // Idle - standing normally
            return {
                back: { xOff: 0, yOff: 0, lifted: false },
                front: { xOff: 2, yOff: 0, lifted: false }
            };
        }
    }

    drawLegs(ctx, baseX, baseY, positions, legColor, legDark) {
        const p = this.pixel;
        const legBaseY = baseY + 26;

        // Back leg
        const backX = baseX + 6 + positions.back.xOff * p;
        const backY = legBaseY + positions.back.yOff * p;
        // Thigh
        this.drawPixelRect(ctx, backX, backY, 2, 3, legDark);
        // Foot
        if (!positions.back.lifted) {
            this.drawPixelRect(ctx, backX - p, backY + 3 * p, 3, 1, legDark);
        }

        // Front leg
        const frontX = baseX + 14 + positions.front.xOff * p;
        const frontY = legBaseY + positions.front.yOff * p;
        // Thigh
        this.drawPixelRect(ctx, frontX, frontY, 2, 3, legColor);
        // Foot
        if (!positions.front.lifted) {
            this.drawPixelRect(ctx, frontX - p, frontY + 3 * p, 3, 1, legColor);
        }
    }

    drawTail(ctx, baseX, baseY, bodyDark, bodyDarker) {
        const p = this.pixel;
        // Tail feathers sticking out the back
        this.drawPixelRect(ctx, baseX - 2 * p, baseY + 16, 3, 2, bodyDarker);
        this.drawPixelRect(ctx, baseX - 3 * p, baseY + 18, 4, 2, bodyDark);
        this.drawPixelRect(ctx, baseX - 2 * p, baseY + 20, 3, 1, bodyDarker);
    }

    drawBody(ctx, baseX, baseY, bodyMain, bodyLight, bodyDark) {
        const p = this.pixel;

        // Main body - slimmer oval shape
        // Top of body
        this.drawPixelRect(ctx, baseX + 4, baseY + 10, 8, 1, bodyLight);
        // Upper body
        this.drawPixelRect(ctx, baseX + 2, baseY + 12, 10, 2, bodyLight);
        this.drawPixelRect(ctx, baseX + 12, baseY + 12, 2, 2, bodyMain);
        // Middle body
        this.drawPixelRect(ctx, baseX + 0, baseY + 16, 2, 4, bodyDark);
        this.drawPixelRect(ctx, baseX + 2, baseY + 16, 10, 4, bodyMain);
        this.drawPixelRect(ctx, baseX + 12, baseY + 16, 3, 4, bodyDark);
        // Lower body
        this.drawPixelRect(ctx, baseX + 2, baseY + 22, 10, 2, bodyDark);
        this.drawPixelRect(ctx, baseX + 4, baseY + 24, 6, 2, bodyDark);

        // Chest highlight
        this.drawPixelRect(ctx, baseX + 10, baseY + 14, 2, 4, bodyLight);
    }

    drawWing(ctx, baseX, baseY, wingColor, wingDark) {
        const p = this.pixel;

        let wingYOffset = 0;
        if (this.animState === 'jump') {
            wingYOffset = -2; // Wing up when jumping
        }

        // Wing shape
        this.drawPixelRect(ctx, baseX + 2, baseY + 14 + wingYOffset * p, 6, 2, wingColor);
        this.drawPixelRect(ctx, baseX + 0, baseY + 16 + wingYOffset * p, 8, 3, wingColor);
        this.drawPixelRect(ctx, baseX + 0, baseY + 19 + wingYOffset * p, 6, 2, wingDark);

        // Wing feather details
        this.drawPixel(ctx, baseX - p, baseY + 18 + wingYOffset * p, wingDark);
        this.drawPixel(ctx, baseX - p, baseY + 20 + wingYOffset * p, wingDark);
    }

    drawHead(ctx, baseX, baseY, bodyMain, bodyLight, bodyDark) {
        const p = this.pixel;

        // Head - rounder, cuter
        // Top of head
        this.drawPixelRect(ctx, baseX + 14, baseY + 2, 6, 2, bodyLight);
        // Main head
        this.drawPixelRect(ctx, baseX + 12, baseY + 4, 10, 3, bodyLight);
        this.drawPixelRect(ctx, baseX + 12, baseY + 7, 10, 3, bodyMain);
        // Bottom of head connecting to body
        this.drawPixelRect(ctx, baseX + 14, baseY + 10, 6, 2, bodyMain);

        // Cute cheek highlight
        this.drawPixelRect(ctx, baseX + 18, baseY + 6, 2, 2, '#BBCCDD');
    }

    drawBeak(ctx, baseX, baseY, beakOrange, beakDark) {
        const p = this.pixel;
        const beakX = baseX + 22;

        if (this.isShooting) {
            // Open beak when shooting
            // Upper beak
            this.drawPixelRect(ctx, beakX, baseY + 5, 4, 2, beakOrange);
            this.drawPixelRect(ctx, beakX + 4 * p, baseY + 5, 2, 1, beakDark);
            // Lower beak (dropped down)
            this.drawPixelRect(ctx, beakX, baseY + 9, 3, 2, beakDark);
            // Fire glow in mouth
            this.drawPixelRect(ctx, beakX, baseY + 7, 2, 2, '#FF6600');
        } else {
            // Closed beak
            this.drawPixelRect(ctx, beakX, baseY + 6, 4, 2, beakOrange);
            this.drawPixelRect(ctx, beakX + 4 * p, baseY + 6, 2, 1, beakDark);
            // Beak line
            this.drawPixelRect(ctx, beakX, baseY + 8, 3, 1, beakDark);
        }
    }

    drawEye(ctx, baseX, baseY, eyeWhite, eyeBlack) {
        const p = this.pixel;

        // Eye white
        this.drawPixelRect(ctx, baseX + 16, baseY + 4, 3, 3, eyeWhite);

        // Pupil
        this.drawPixelRect(ctx, baseX + 18, baseY + 4, 2, 2, eyeBlack);

        // Eye shine
        this.drawPixel(ctx, baseX + 18, baseY + 4, '#FFFFFF');
    }
}
