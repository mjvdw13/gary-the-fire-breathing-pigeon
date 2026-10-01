class FalconPlayer extends Entity {
    constructor(x, y) {
        super(x, y, 36, 38);
        this.facingRight = true;
        this.grounded = false;
        this.moveSpeed = 400; // Fastest character
        this.jumpForce = 480;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.shootCooldown = 0;
        this.shootCooldownTime = 0.4; // Slightly slower due to power

        // Dash ability
        this.canDash = true;
        this.isDashing = false;
        this.dashSpeed = 800;
        this.dashDuration = 0.15;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.dashCooldownTime = 0.8;

        // Animation state
        this.animState = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;
        this.wingFrame = 0;
        this.wingTimer = 0;

        // Attack animation
        this.isAttacking = false;
        this.attackAnimTimer = 0;
        this.attackAnimDuration = 0.2;

        // Extra fine pixel art (smaller pixels = more detail)
        this.pixel = 1;

        // Character info
        this.characterName = 'Fang';
        this.characterColor = '#4A3728';

        // Electricity effect
        this.sparkTimer = 0;
        this.sparks = [];
    }

    update(deltaTime, input) {
        // Handle dashing
        if (this.isDashing) {
            this.dashTimer += deltaTime;
            if (this.dashTimer >= this.dashDuration) {
                this.isDashing = false;
                this.vx = this.facingRight ? this.moveSpeed : -this.moveSpeed;
            }
        } else {
            // Normal horizontal movement
            if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) {
                this.vx = -this.moveSpeed;
                this.facingRight = false;
            } else if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) {
                this.vx = this.moveSpeed;
                this.facingRight = true;
            } else {
                this.vx = 0;
            }
        }

        // Dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
            if (this.dashCooldown <= 0) {
                this.canDash = true;
            }
        }

        // Dash activation (double-tap or shift)
        if (input.isKeyJustPressed('ShiftLeft') || input.isKeyJustPressed('ShiftRight')) {
            if (this.canDash && !this.isDashing) {
                this.isDashing = true;
                this.dashTimer = 0;
                this.canDash = false;
                this.dashCooldown = this.dashCooldownTime;
                this.vx = this.facingRight ? this.dashSpeed : -this.dashSpeed;
                // Generate sparks during dash
                this.generateDashSparks();
            }
        }

        // Jump
        const jumpPressed = input.isKeyJustPressed('KeyW') || input.isKeyJustPressed('ArrowUp');
        if (jumpPressed) {
            if (this.grounded) {
                this.vy = -this.jumpForce;
                this.grounded = false;
                this.hasDoubleJumped = false;
            } else if (this.canDoubleJump && !this.hasDoubleJumped) {
                this.vy = -this.jumpForce;
                this.hasDoubleJumped = true;
            }
        }

        // Reset when grounded
        if (this.grounded) {
            this.hasDoubleJumped = false;
        }

        // Update cooldowns
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        // Update animation
        this.updateAnimation(deltaTime);

        // Update sparks
        this.updateSparks(deltaTime);

        super.update(deltaTime);
    }

    generateDashSparks() {
        for (let i = 0; i < 8; i++) {
            this.sparks.push({
                x: this.x + this.width / 2,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.3
            });
        }
    }

    updateSparks(deltaTime) {
        this.sparkTimer += deltaTime;

        // Add ambient sparks occasionally
        if (this.sparkTimer > 0.2) {
            this.sparkTimer = 0;
            if (Math.random() < 0.3) {
                this.sparks.push({
                    x: this.x + Math.random() * this.width,
                    y: this.y + Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 50,
                    vy: (Math.random() - 0.5) * 50,
                    life: 0.2
                });
            }
        }

        // Update existing sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const spark = this.sparks[i];
            spark.x += spark.vx * deltaTime;
            spark.y += spark.vy * deltaTime;
            spark.life -= deltaTime;
            if (spark.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
    }

    updateAnimation(deltaTime) {
        // Attack animation
        if (this.isAttacking) {
            this.attackAnimTimer -= deltaTime;
            if (this.attackAnimTimer <= 0) {
                this.isAttacking = false;
            }
        }

        // Determine animation state
        if (this.isDashing) {
            this.animState = 'dash';
        } else if (!this.grounded) {
            this.animState = 'jump';
        } else if (Math.abs(this.vx) > 0) {
            this.animState = 'walk';
        } else {
            this.animState = 'idle';
        }

        // Wing animation
        this.wingTimer += deltaTime;
        const wingSpeed = this.animState === 'jump' ? 0.05 : 0.12;
        if (this.wingTimer >= wingSpeed) {
            this.wingTimer = 0;
            this.wingFrame = (this.wingFrame + 1) % 4;
        }

        // Walk animation
        if (this.animState === 'walk') {
            this.animTimer += deltaTime;
            if (this.animTimer >= 0.08) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 6;
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
        this.isAttacking = true;
        this.attackAnimTimer = this.attackAnimDuration;

        // Generate attack sparks at launch point
        for (let i = 0; i < 5; i++) {
            const sparkX = this.facingRight ? this.x + this.width : this.x;
            this.sparks.push({
                x: sparkX,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 20,
                vx: (this.facingRight ? 1 : -1) * (50 + Math.random() * 50),
                vy: (Math.random() - 0.5) * 80,
                life: 0.15
            });
        }

        // Spawn lightning projectile
        const strikeX = this.facingRight ? this.x + this.width : this.x - 20;
        const strikeY = this.y + this.height / 2 - 8;

        const strike = new LightningStrike(strikeX, strikeY, this.facingRight);
        if (godMode) {
            strike.damage = 6; // Extra powerful in god mode
        }
        return strike;
    }

    drawPixel(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.pixel, this.pixel);
    }

    drawRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }

    render(ctx, godMode = false) {
        const baseX = Math.floor(this.x);
        const baseY = Math.floor(this.y);

        ctx.save();
        if (!this.facingRight) {
            ctx.translate(baseX + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(baseX + this.width / 2), 0);
        }

        // Colors
        let bodyDark, bodyMain, bodyLight, bodyAccent;
        let wingDark, wingMain, wingLight, wingTip;
        let beakColor, beakDark, eyeColor, talon;

        if (godMode) {
            // Golden electric falcon
            bodyDark = '#8B7500';
            bodyMain = '#DAA520';
            bodyLight = '#FFD700';
            bodyAccent = '#FFF8DC';
            wingDark = '#B8860B';
            wingMain = '#F0C040';
            wingLight = '#FFEC8B';
            wingTip = '#FFD700';
            beakColor = '#FF8C00';
            beakDark = '#D2691E';
            eyeColor = '#00FFFF';
            talon = '#FFD700';
        } else {
            // Peregrine falcon colors - detailed
            bodyDark = '#2C2416';
            bodyMain = '#4A3728';
            bodyLight = '#6B5344';
            bodyAccent = '#8B7355';
            wingDark = '#1A1510';
            wingMain = '#3A2A1E';
            wingLight = '#5A4A3E';
            wingTip = '#2A2218';
            beakColor = '#4A4A4A';
            beakDark = '#2A2A2A';
            eyeColor = '#FFD700';
            talon = '#3A3A3A';
        }

        const white = '#F5F5DC';
        const cream = '#FFFDD0';
        const stripe = '#1A1510';

        // === EXTRA FINE PIXEL ART FALCON ===

        // Wing position based on animation
        const wingOffsets = [0, -2, -4, -2];
        const wingY = wingOffsets[this.wingFrame];

        // === TAIL FEATHERS ===
        this.drawRect(ctx, baseX - 2, baseY + 28, 8, 3, bodyDark);
        this.drawRect(ctx, baseX - 4, baseY + 31, 10, 4, wingMain);
        this.drawRect(ctx, baseX - 3, baseY + 35, 8, 3, wingDark);
        // Tail stripes
        this.drawRect(ctx, baseX - 2, baseY + 32, 2, 4, stripe);
        this.drawRect(ctx, baseX + 2, baseY + 32, 2, 4, stripe);

        // === LEFT WING (behind body, extends left) ===
        this.drawWing(ctx, baseX + 4, baseY + 10 + wingY, wingDark, wingMain, wingLight, wingTip, false);

        // === LEGS ===
        const legAnim = this.animState === 'walk' ? Math.sin(this.animFrame * Math.PI / 3) * 3 : 0;

        // Left leg
        this.drawRect(ctx, baseX + 8, baseY + 28, 3, 8 - legAnim, bodyAccent);
        this.drawRect(ctx, baseX + 7, baseY + 34 - legAnim, 5, 2, talon);
        // Talons
        this.drawRect(ctx, baseX + 5, baseY + 36 - legAnim, 2, 3, talon);
        this.drawRect(ctx, baseX + 8, baseY + 36 - legAnim, 2, 3, talon);
        this.drawRect(ctx, baseX + 11, baseY + 36 - legAnim, 2, 2, talon);

        // Right leg
        this.drawRect(ctx, baseX + 18, baseY + 28, 3, 8 + legAnim, bodyAccent);
        this.drawRect(ctx, baseX + 17, baseY + 34 + legAnim, 5, 2, talon);
        // Talons
        this.drawRect(ctx, baseX + 15, baseY + 36 + legAnim, 2, 3, talon);
        this.drawRect(ctx, baseX + 18, baseY + 36 + legAnim, 2, 3, talon);
        this.drawRect(ctx, baseX + 21, baseY + 36 + legAnim, 2, 2, talon);

        // === BODY ===
        // Back/upper body
        this.drawRect(ctx, baseX + 6, baseY + 12, 18, 4, bodyLight);
        this.drawRect(ctx, baseX + 4, baseY + 16, 22, 6, bodyMain);
        this.drawRect(ctx, baseX + 6, baseY + 22, 18, 6, bodyDark);

        // Chest/belly - cream colored with spots
        this.drawRect(ctx, baseX + 10, baseY + 16, 12, 12, cream);
        this.drawRect(ctx, baseX + 12, baseY + 14, 8, 2, white);
        // Chest spots/streaks
        this.drawRect(ctx, baseX + 11, baseY + 19, 2, 2, bodyMain);
        this.drawRect(ctx, baseX + 15, baseY + 18, 2, 3, bodyMain);
        this.drawRect(ctx, baseX + 19, baseY + 20, 2, 2, bodyMain);
        this.drawRect(ctx, baseX + 12, baseY + 23, 2, 2, bodyMain);
        this.drawRect(ctx, baseX + 17, baseY + 24, 2, 2, bodyMain);

        // === RIGHT WING (in front, extends right) ===
        this.drawWing(ctx, baseX + 32, baseY + 10 + wingY, wingDark, wingMain, wingLight, wingTip, true);

        // === HEAD ===
        // Main head shape
        this.drawRect(ctx, baseX + 22, baseY + 2, 10, 4, bodyLight);
        this.drawRect(ctx, baseX + 20, baseY + 6, 14, 6, bodyMain);
        this.drawRect(ctx, baseX + 22, baseY + 12, 10, 3, bodyDark);

        // Falcon "helmet" - dark crown
        this.drawRect(ctx, baseX + 22, baseY + 1, 10, 3, bodyDark);
        this.drawRect(ctx, baseX + 24, baseY, 6, 2, wingDark);

        // Malar stripe (falcon's distinctive cheek stripe)
        this.drawRect(ctx, baseX + 30, baseY + 6, 4, 8, stripe);
        this.drawRect(ctx, baseX + 32, baseY + 8, 2, 4, wingDark);

        // White cheek patch
        this.drawRect(ctx, baseX + 22, baseY + 8, 8, 4, white);
        this.drawRect(ctx, baseX + 20, baseY + 10, 4, 3, cream);

        // Eye - fierce golden
        this.drawRect(ctx, baseX + 24, baseY + 5, 5, 4, '#000000');
        this.drawRect(ctx, baseX + 25, baseY + 6, 3, 2, eyeColor);
        // Eye shine
        this.drawRect(ctx, baseX + 25, baseY + 6, 1, 1, '#FFFFFF');
        // Eye ring
        this.drawRect(ctx, baseX + 23, baseY + 5, 1, 4, eyeColor);

        // Beak - hooked raptor beak
        this.drawRect(ctx, baseX + 30, baseY + 9, 6, 3, beakColor);
        this.drawRect(ctx, baseX + 34, baseY + 10, 3, 2, beakColor);
        this.drawRect(ctx, baseX + 35, baseY + 12, 2, 2, beakDark);
        // Beak hook
        this.drawRect(ctx, baseX + 36, baseY + 11, 2, 1, beakDark);
        // Cere (fleshy part above beak)
        this.drawRect(ctx, baseX + 30, baseY + 8, 3, 2, '#FFD700');
        // Nostril
        this.drawRect(ctx, baseX + 31, baseY + 9, 1, 1, '#000000');

        // Attack effect - lightning around talons
        if (this.isAttacking) {
            this.drawAttackEffect(ctx, baseX, baseY);
        }

        ctx.restore();

        // Draw sparks (not flipped)
        this.renderSparks(ctx);

        // Draw dash trail if dashing
        if (this.isDashing) {
            this.drawDashTrail(ctx, baseX, baseY);
        }
    }

    drawWing(ctx, x, y, dark, main, light, tip, isRightWing) {
        ctx.save();

        if (isRightWing) {
            // Right wing - extends to the right
            // Primary feathers (longest, at tip)
            this.drawRect(ctx, x + 2, y + 8, 4, 14, dark);
            this.drawRect(ctx, x - 1, y + 6, 4, 16, tip);
            this.drawRect(ctx, x - 4, y + 4, 4, 16, main);

            // Secondary feathers
            this.drawRect(ctx, x - 7, y + 2, 4, 14, main);
            this.drawRect(ctx, x - 10, y, 4, 12, light);

            // Coverts
            this.drawRect(ctx, x - 12, y, 4, 8, light);

            // Wing bars
            this.drawRect(ctx, x - 10, y + 10, 14, 2, dark);
            this.drawRect(ctx, x - 8, y + 14, 10, 2, dark);
        } else {
            // Left wing - extends to the left
            // Primary feathers (longest, at tip)
            this.drawRect(ctx, x - 6, y + 8, 4, 14, dark);
            this.drawRect(ctx, x - 3, y + 6, 4, 16, tip);
            this.drawRect(ctx, x, y + 4, 4, 16, main);

            // Secondary feathers
            this.drawRect(ctx, x + 3, y + 2, 4, 14, main);
            this.drawRect(ctx, x + 6, y, 4, 12, light);

            // Coverts
            this.drawRect(ctx, x + 8, y, 4, 8, light);

            // Wing bars
            this.drawRect(ctx, x - 4, y + 10, 14, 2, dark);
            this.drawRect(ctx, x - 2, y + 14, 10, 2, dark);
        }

        ctx.restore();
    }

    drawAttackEffect(ctx, baseX, baseY) {
        // Lightning crackle around body
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            let x = baseX + 15 + Math.random() * 10;
            let y = baseY + Math.random() * this.height;
            ctx.moveTo(x, y);

            for (let j = 0; j < 3; j++) {
                x += (Math.random() - 0.5) * 15;
                y += 5 + Math.random() * 5;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Glowing talons
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fillRect(baseX + 5, baseY + 34, 20, 6);
    }

    renderSparks(ctx) {
        for (const spark of this.sparks) {
            const alpha = spark.life / 0.3;
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.fillRect(spark.x, spark.y, 2, 2);

            // White core
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(spark.x, spark.y, 1, 1);
        }
    }

    drawDashTrail(ctx, baseX, baseY) {
        ctx.globalAlpha = 0.3;
        for (let i = 1; i <= 3; i++) {
            const trailX = this.facingRight ? baseX - i * 15 : baseX + i * 15;
            ctx.fillStyle = '#00FFFF';
            ctx.fillRect(trailX, baseY + 5, this.width, this.height - 10);
        }
        ctx.globalAlpha = 1;
    }
}
