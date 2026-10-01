class GiantCat extends Enemy {
    constructor(x, y, groundY) {
        super(x, y, 90, 70);
        this.health = 15;
        this.maxHealth = 15;
        this.points = 1000;
        this.groundY = groundY;
        this.pixel = 3;

        // States: idle, jumping, landing, spitting
        this.state = 'idle';
        this.stateTimer = 0;

        // Movement
        this.facingRight = false;
        this.jumpForce = 600;
        this.targetX = x;
        this.affectedByGravity = false;
        this.grounded = true;

        // Attack patterns
        this.attackCooldown = 2;
        this.attackTimer = 0;
        this.hairballs = [];

        // Animation
        this.tailWag = 0;
        this.eyeAnger = 0;

        // Position on ground
        this.y = groundY - this.height;
    }

    update(deltaTime, player, canvasWidth) {
        this.tailWag += deltaTime * 5;
        this.attackTimer += deltaTime;
        this.stateTimer += deltaTime;

        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime, player, canvasWidth);
                break;
            case 'jumping':
                this.updateJumping(deltaTime, canvasWidth);
                break;
            case 'landing':
                this.updateLanding(deltaTime);
                break;
            case 'spitting':
                this.updateSpitting(deltaTime);
                break;
        }

        for (let i = this.hairballs.length - 1; i >= 0; i--) {
            this.hairballs[i].update(deltaTime, this.groundY, canvasWidth);
            if (!this.hairballs[i].active) {
                this.hairballs.splice(i, 1);
            }
        }

        this.eyeAnger = 1 - (this.health / this.maxHealth);
        Enemy.prototype.update.call(this, deltaTime);
    }

    updateIdle(deltaTime, player, canvasWidth) {
        if (player) {
            this.facingRight = player.x > this.x + this.width / 2;
        }

        if (this.attackTimer >= this.attackCooldown) {
            this.attackTimer = 0;
            const jumpChance = 0.4 + this.eyeAnger * 0.3;

            if (Math.random() < jumpChance) {
                this.state = 'jumping';
                this.stateTimer = 0;
                if (player) {
                    this.targetX = player.x - this.width / 2;
                    this.targetX = Math.max(0, Math.min(canvasWidth - this.width, this.targetX));
                }
                const jumpDir = this.targetX > this.x ? 1 : -1;
                this.vx = jumpDir * 200;
                this.vy = -this.jumpForce;
                this.grounded = false;
            } else {
                this.state = 'spitting';
                this.stateTimer = 0;
            }
        }
    }

    updateJumping(deltaTime, canvasWidth) {
        this.vy += 1000 * deltaTime;
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        if (this.x <= 0) { this.x = 0; this.vx = 0; }
        if (this.x + this.width >= canvasWidth) { this.x = canvasWidth - this.width; this.vx = 0; }

        if (this.y + this.height >= this.groundY) {
            this.y = this.groundY - this.height;
            this.vy = 0;
            this.vx = 0;
            this.grounded = true;
            this.state = 'landing';
            this.stateTimer = 0;
        }
    }

    updateLanding(deltaTime) {
        if (this.stateTimer >= 0.3) {
            this.state = 'idle';
        }
    }

    updateSpitting(deltaTime) {
        if (this.stateTimer >= 0.2 && this.stateTimer < 0.25) {
            this.spitHairball();
        }
        if (this.eyeAnger > 0.5 && this.stateTimer >= 0.4 && this.stateTimer < 0.45) {
            this.spitHairball();
        }
        if (this.stateTimer >= 0.6) {
            this.state = 'idle';
        }
    }

    spitHairball() {
        const mouthX = this.facingRight ? this.x + this.width - 5 : this.x + 5;
        const mouthY = this.y + 25;
        const speed = 300 + this.eyeAnger * 150;
        const vx = this.facingRight ? speed : -speed;
        const vy = -200 - Math.random() * 100;
        this.hairballs.push(new Hairball(mouthX, mouthY, vx, vy));
    }

    render(ctx) {
        if (this.isHit) {
            ctx.globalAlpha = 0.5;
        }

        const p = this.pixel;
        const baseX = Math.floor(this.x);
        const baseY = Math.floor(this.y);

        ctx.save();

        // Flip horizontally if facing left
        if (!this.facingRight) {
            ctx.translate(baseX + this.width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(baseX + this.width / 2), 0);
        }

        // Colors
        const furMain = '#FF9944';
        const furLight = '#FFBB66';
        const furDark = '#DD7722';
        const furStripe = '#CC5500';
        const belly = '#FFDDBB';
        const earPink = '#FFAAAA';
        const nose = '#FF6666';

        // Draw cat facing RIGHT (tail on left, head on right)

        // === TAIL (far left, behind everything) ===
        const tailWave = Math.sin(this.tailWag) * 6;
        ctx.save();
        ctx.translate(baseX + 8, baseY + 35);
        ctx.rotate((tailWave - 30) * Math.PI / 180);
        this.drawRect(ctx, -3, 0, 3, 5, furMain);
        this.drawRect(ctx, -4, 5 * p, 3, 5, furDark);
        this.drawRect(ctx, -5, 10 * p, 3, 4, furDark);
        this.drawRect(ctx, -3, 2 * p, 2, 2, furStripe);
        this.drawRect(ctx, -4, 7 * p, 2, 2, furStripe);
        ctx.restore();

        // === BACK LEGS (behind body) ===
        const crouch = this.state === 'landing' ? 3 : 0;
        // Back leg (left side)
        this.drawRect(ctx, baseX + 12, baseY + 42 + crouch, 4, 6, furDark);
        this.drawRect(ctx, baseX + 10, baseY + 52 + crouch, 5, 4, furDark);
        this.drawRect(ctx, baseX + 8, baseY + 60 + crouch, 6, 3, furDark);

        // === BODY ===
        // Main body oval
        this.drawRect(ctx, baseX + 15, baseY + 28, 12, 5, furLight);
        this.drawRect(ctx, baseX + 12, baseY + 33, 18, 8, furMain);
        this.drawRect(ctx, baseX + 14, baseY + 41, 16, 6, furMain);
        this.drawRect(ctx, baseX + 16, baseY + 47, 12, 4, furDark);

        // Belly (underneath, towards front)
        this.drawRect(ctx, baseX + 28, baseY + 40, 6, 8, belly);

        // Body stripes
        this.drawRect(ctx, baseX + 18, baseY + 31, 2, 6, furStripe);
        this.drawRect(ctx, baseX + 24, baseY + 30, 2, 7, furStripe);

        // === FRONT LEGS ===
        const lift = this.state === 'spitting' ? -4 : 0;
        // Front leg (right side, in front)
        this.drawRect(ctx, baseX + 38, baseY + 40 + lift, 4, 7, furMain);
        this.drawRect(ctx, baseX + 36, baseY + 51 + lift, 5, 4, furLight);
        this.drawRect(ctx, baseX + 34, baseY + 59 + lift, 6, 3, furMain);
        // Paw
        this.drawRect(ctx, baseX + 35, baseY + 62 + lift, 2, 1, earPink);

        // Second front leg (slightly behind)
        this.drawRect(ctx, baseX + 32, baseY + 42, 3, 6, furDark);
        this.drawRect(ctx, baseX + 30, baseY + 52, 4, 4, furDark);
        this.drawRect(ctx, baseX + 28, baseY + 60, 5, 3, furDark);

        // === HEAD (on the right, in front of body) ===
        const headX = baseX + 42;
        const headY = baseY + 5;

        // Ears - pointed triangular shape
        this.drawRect(ctx, headX + 2, headY + 2, 4, 3, furMain);
        this.drawRect(ctx, headX + 3, headY, 2, 2, furMain);
        this.drawRect(ctx, headX + 3, headY + 3, 2, 1, earPink);
        this.drawRect(ctx, headX + 18, headY + 2, 4, 3, furMain);
        this.drawRect(ctx, headX + 19, headY, 2, 2, furMain);
        this.drawRect(ctx, headX + 19, headY + 3, 2, 1, earPink);

        // Head shape - rounder
        this.drawRect(ctx, headX + 5, headY + 5, 14, 3, furLight);
        this.drawRect(ctx, headX + 3, headY + 8, 18, 7, furMain);
        this.drawRect(ctx, headX + 4, headY + 15, 16, 5, furMain);
        this.drawRect(ctx, headX + 6, headY + 20, 12, 2, furDark);

        // Forehead stripes (tabby M)
        this.drawRect(ctx, headX + 7, headY + 6, 2, 3, furStripe);
        this.drawRect(ctx, headX + 11, headY + 5, 2, 4, furStripe);
        this.drawRect(ctx, headX + 15, headY + 6, 2, 3, furStripe);

        // Eyes - bigger and cuter
        this.drawRect(ctx, headX + 5, headY + 10, 5, 4, '#FFFFFF');
        this.drawRect(ctx, headX + 14, headY + 10, 5, 4, '#FFFFFF');

        // Pupils - react to anger
        const pupilSize = this.eyeAnger > 0.5 ? 2 : 3;
        const eyeColor = this.eyeAnger > 0.5 ? '#44BB44' : '#55DD55';
        this.drawRect(ctx, headX + 6, headY + 11, pupilSize, pupilSize, eyeColor);
        this.drawRect(ctx, headX + 15, headY + 11, pupilSize, pupilSize, eyeColor);
        // Pupil center
        this.drawPixel(ctx, headX + 7, headY + 11, '#111111');
        this.drawPixel(ctx, headX + 16, headY + 11, '#111111');

        // Eye shine
        this.drawPixel(ctx, headX + 5, headY + 10, '#FFFFFF');
        this.drawPixel(ctx, headX + 14, headY + 10, '#FFFFFF');

        // Angry eyebrows when damaged
        if (this.eyeAnger > 0.3) {
            this.drawRect(ctx, headX + 4, headY + 8, 5, 1, '#553322');
            this.drawRect(ctx, headX + 15, headY + 8, 5, 1, '#553322');
        }

        // Muzzle - rounder
        this.drawRect(ctx, headX + 8, headY + 14, 8, 5, belly);

        // Nose - cute inverted triangle
        this.drawRect(ctx, headX + 10, headY + 14, 4, 2, nose);
        this.drawRect(ctx, headX + 11, headY + 16, 2, 1, nose);

        // Mouth
        const mouthOpen = this.state === 'spitting' && this.stateTimer > 0.15;
        if (mouthOpen) {
            this.drawRect(ctx, headX + 9, headY + 18, 6, 3, '#DD5555');
            this.drawRect(ctx, headX + 10, headY + 18, 4, 1, '#FFFFFF'); // Teeth
            // Tongue
            this.drawRect(ctx, headX + 11, headY + 19, 2, 2, '#FF8888');
        } else {
            // Cat smile :3
            this.drawPixel(ctx, headX + 11, headY + 18, '#775544');
            this.drawRect(ctx, headX + 8, headY + 18, 2, 1, '#775544');
            this.drawRect(ctx, headX + 14, headY + 18, 2, 1, '#775544');
        }

        ctx.restore();

        // Hairballs (not flipped)
        for (const hairball of this.hairballs) {
            hairball.render(ctx);
        }

        // Health bar
        this.drawHealthBar(ctx, this.x, this.y - 15, this.width);
        ctx.globalAlpha = 1;
    }

    drawPixel(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.pixel, this.pixel);
    }

    drawRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w * this.pixel, h * this.pixel);
    }

    drawHealthBar(ctx, x, y, width) {
        const barHeight = 8;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, barHeight);

        const healthColor = healthPercent > 0.5 ? '#44DD44' : healthPercent > 0.25 ? '#DDDD44' : '#DD4444';
        ctx.fillStyle = healthColor;
        ctx.fillRect(x + 1, y + 1, (width - 2) * healthPercent, barHeight - 2);

        ctx.strokeStyle = '#000000';
        ctx.strokeRect(x, y, width, barHeight);
    }
}
