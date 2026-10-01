class PlayerBase extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.vx = 0;
        this.vy = 0;
        this.speed = 200;
        this.jumpForce = 400;
        this.grounded = false;
        this.facingRight = true;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;

        // Shooting
        this.shootCooldown = 0;
        this.shootDelay = 0.3;

        // Animation
        this.animTimer = 0;
        this.walkFrame = 0;
        this.isJumping = false;
        this.isShooting = false;
        this.shootAnimTimer = 0;

        // Character info (override in subclasses)
        this.characterName = 'Base';
        this.characterColor = '#888888';
    }

    update(deltaTime, input) {
        // Horizontal movement
        if (input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft')) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) {
            this.vx = this.speed;
            this.facingRight = true;
        } else {
            this.vx = 0;
        }

        // Jumping
        if (input.isKeyJustPressed('KeyW') || input.isKeyJustPressed('ArrowUp')) {
            this.tryJump();
        }

        // Reset double jump when grounded
        if (this.grounded) {
            this.hasDoubleJumped = false;
            this.isJumping = false;
        } else {
            this.isJumping = true;
        }

        // Update cooldowns
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        // Animation
        this.updateAnimation(deltaTime);
    }

    tryJump() {
        if (this.grounded) {
            this.vy = -this.jumpForce;
            this.grounded = false;
            this.isJumping = true;
        } else if (this.canDoubleJump && !this.hasDoubleJumped) {
            this.vy = -this.jumpForce;
            this.hasDoubleJumped = true;
        }
    }

    updateAnimation(deltaTime) {
        // Walking animation
        if (this.vx !== 0 && this.grounded) {
            this.animTimer += deltaTime;
            if (this.animTimer >= 0.1) {
                this.animTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 4;
            }
        } else {
            this.walkFrame = 0;
        }

        // Shooting animation
        if (this.isShooting) {
            this.shootAnimTimer += deltaTime;
            if (this.shootAnimTimer >= 0.2) {
                this.isShooting = false;
                this.shootAnimTimer = 0;
            }
        }
    }

    shoot(godMode) {
        // Override in subclass
        return null;
    }

    render(ctx, godMode) {
        // Override in subclass
    }

    // Helper methods for pixel art rendering
    drawPixel(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.pixel, this.pixel);
    }

    drawRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * this.pixel, h * this.pixel);
    }
}
