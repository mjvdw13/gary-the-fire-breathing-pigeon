class ConstructionWorker extends Enemy {
    constructor(x, y, groundY) {
        super(x, y, 50, 70);
        this.health = 20;
        this.maxHealth = 20;
        this.points = 1500;
        this.groundY = groundY;
        this.pixel = 3;

        // States: idle, walking, winding_up, pounding, throwing
        this.state = 'idle';
        this.stateTimer = 0;

        // Movement
        this.facingRight = false;
        this.walkSpeed = 80;
        this.affectedByGravity = false;
        this.grounded = true;

        // Attack patterns
        this.attackCooldown = 2.5;
        this.attackTimer = 0;
        this.nails = [];
        this.anger = 0;

        // Hammer pound area damage
        this.hammerZone = null;      // {x, y, width, height} - telegraph rect
        this.hammerZoneTimer = 0;
        this.hammerZoneDuration = 1.0; // How long the warning shows
        this.shockwave = null;       // {x, y, radius, maxRadius}
        this.shockwaveDamaged = false;

        // Animation
        this.hammerAngle = 0;
        this.walkFrame = 0;

        // Position on ground
        this.y = groundY - this.height;
    }

    update(deltaTime, player, canvasWidth) {
        this.walkFrame += deltaTime * 5;
        this.attackTimer += deltaTime;
        this.stateTimer += deltaTime;

        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime, player, canvasWidth);
                break;
            case 'walking':
                this.updateWalking(deltaTime, player, canvasWidth);
                break;
            case 'winding_up':
                this.updateWindingUp(deltaTime, player);
                break;
            case 'pounding':
                this.updatePounding(deltaTime, player, canvasWidth);
                break;
            case 'throwing':
                this.updateThrowing(deltaTime, player);
                break;
        }

        // Update nails
        for (let i = this.nails.length - 1; i >= 0; i--) {
            this.nails[i].update(deltaTime);
            if (this.nails[i].isOffScreen(canvasWidth, 700)) {
                this.nails.splice(i, 1);
            }
        }

        // Update shockwave
        if (this.shockwave) {
            this.shockwave.radius += 400 * deltaTime;
            if (this.shockwave.radius >= this.shockwave.maxRadius) {
                this.shockwave = null;
            }
        }

        this.anger = 1 - (this.health / this.maxHealth);
        Enemy.prototype.update.call(this, deltaTime);
    }

    updateIdle(deltaTime, player, canvasWidth) {
        if (player) {
            this.facingRight = player.x > this.x + this.width / 2;
        }

        if (this.attackTimer >= this.attackCooldown) {
            this.attackTimer = 0;
            const poundChance = 0.5 + this.anger * 0.2;

            if (Math.random() < poundChance) {
                // Hammer pound - walk toward player first
                this.state = 'walking';
                this.stateTimer = 0;
                if (player) {
                    this.targetX = player.x - this.width / 2;
                    this.targetX = Math.max(0, Math.min(canvasWidth - this.width, this.targetX));
                }
            } else {
                // Throw nails
                this.state = 'throwing';
                this.stateTimer = 0;
            }
        }
    }

    updateWalking(deltaTime, player, canvasWidth) {
        const dx = this.targetX - this.x;
        const dist = Math.abs(dx);

        if (dist < 60 || this.stateTimer > 2.0) {
            // Close enough or took too long, start hammer wind-up
            this.state = 'winding_up';
            this.stateTimer = 0;
            this.hammerAngle = 0;

            // Create telegraph zone where hammer will hit
            const zoneWidth = 120 + this.anger * 60;
            const zoneX = this.facingRight
                ? this.x + this.width - 10
                : this.x + 10 - zoneWidth;
            this.hammerZone = {
                x: Math.max(0, Math.min(canvasWidth - zoneWidth, zoneX)),
                y: this.groundY - 50,
                width: zoneWidth,
                height: 50
            };
            this.hammerZoneTimer = 0;
        } else {
            const dir = dx > 0 ? 1 : -1;
            this.facingRight = dir > 0;
            this.x += dir * this.walkSpeed * deltaTime;
            this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        }
    }

    updateWindingUp(deltaTime, player) {
        this.hammerZoneTimer += deltaTime;
        // Raise hammer over time
        this.hammerAngle = Math.min(this.stateTimer / this.hammerZoneDuration, 1) * -90;

        if (this.stateTimer >= this.hammerZoneDuration) {
            this.state = 'pounding';
            this.stateTimer = 0;
            this.shockwaveDamaged = false;
        }
    }

    updatePounding(deltaTime, player, canvasWidth) {
        // Slam hammer down quickly
        this.hammerAngle = -90 + Math.min(this.stateTimer / 0.1, 1) * 90;

        if (this.stateTimer >= 0.1 && !this.shockwave) {
            // Create shockwave at hammer impact
            const impactX = this.hammerZone
                ? this.hammerZone.x + this.hammerZone.width / 2
                : this.x + this.width / 2;
            this.shockwave = {
                x: impactX,
                y: this.groundY,
                radius: 0,
                maxRadius: this.hammerZone ? this.hammerZone.width / 2 + 30 : 100
            };
        }

        if (this.stateTimer >= 0.6) {
            this.hammerZone = null;
            this.state = 'idle';
            this.hammerAngle = 0;
        }
    }

    updateThrowing(deltaTime, player) {
        const throwCount = this.anger > 0.5 ? 3 : 2;

        for (let i = 0; i < throwCount; i++) {
            const throwTime = 0.2 + i * 0.25;
            if (this.stateTimer >= throwTime && this.stateTimer < throwTime + 0.05) {
                this.throwNail(player);
            }
        }

        const totalDuration = 0.2 + throwCount * 0.25 + 0.2;
        if (this.stateTimer >= totalDuration) {
            this.state = 'idle';
        }
    }

    throwNail(player) {
        const handX = this.facingRight ? this.x + this.width : this.x;
        const handY = this.y + 20;
        const speed = 280 + this.anger * 120;
        let vx, vy;

        if (player) {
            const dx = player.x + player.width / 2 - handX;
            const dy = player.y + player.height / 2 - handY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            vx = (dx / dist) * speed;
            vy = (dy / dist) * speed - 50;
        } else {
            vx = this.facingRight ? speed : -speed;
            vy = -50;
        }

        // Add some spread
        vx += (Math.random() - 0.5) * 60;
        vy += (Math.random() - 0.5) * 40;

        this.nails.push(new Nail(handX, handY, vx, vy));
    }

    // Check if player is in the hammer pound damage zone
    isPlayerInHammerZone(playerBounds) {
        if (!this.hammerZone || this.state !== 'pounding' || this.stateTimer < 0.1) {
            return false;
        }
        if (this.shockwaveDamaged) return false;

        const zone = this.hammerZone;
        const hit = playerBounds.left < zone.x + zone.width &&
                    playerBounds.right > zone.x &&
                    playerBounds.top < zone.y + zone.height &&
                    playerBounds.bottom > zone.y;

        if (hit) this.shockwaveDamaged = true;
        return hit;
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
        const skinColor = '#D4956A';
        const skinDark = '#BA7A52';
        const hatYellow = '#FFD700';
        const hatDark = '#DAA520';
        const vestOrange = '#FF8C00';
        const vestDark = '#CC7000';
        const shirtBlue = '#4682B4';
        const pantsColor = '#4A4A2A';
        const pantsDark = '#3A3A1A';
        const bootColor = '#5C4033';
        const bootDark = '#3E2A1F';
        const hammerHead = '#777777';
        const hammerHandle = '#8B6914';

        // === HARD HAT ===
        this.drawRect(ctx, baseX + 8, baseY + 2, 12, 2, hatYellow);
        this.drawRect(ctx, baseX + 5, baseY + 5, 16, 3, hatYellow);
        this.drawRect(ctx, baseX + 3, baseY + 11, 20, 2, hatDark);
        this.drawRect(ctx, baseX + 11, baseY + 2, 4, 2, '#FFEC8B');

        // === HEAD / FACE ===
        this.drawRect(ctx, baseX + 8, baseY + 14, 12, 4, skinColor);
        this.drawRect(ctx, baseX + 6, baseY + 18, 14, 5, skinColor);

        // Eyes
        this.drawRect(ctx, baseX + 9, baseY + 18, 2, 2, '#FFFFFF');
        this.drawRect(ctx, baseX + 16, baseY + 18, 2, 2, '#FFFFFF');
        ctx.fillStyle = '#333333';
        ctx.fillRect(baseX + 10, baseY + 19, p, p);
        ctx.fillRect(baseX + 17, baseY + 19, p, p);

        // Angry eyebrows when damaged
        if (this.anger > 0.3) {
            this.drawRect(ctx, baseX + 8, baseY + 16, 4, 1, '#553322');
            this.drawRect(ctx, baseX + 15, baseY + 16, 4, 1, '#553322');
        }

        // Mouth
        if (this.state === 'pounding' && this.stateTimer < 0.3) {
            this.drawRect(ctx, baseX + 11, baseY + 24, 4, 2, '#CC3333');
        } else {
            this.drawRect(ctx, baseX + 12, baseY + 24, 3, 1, skinDark);
        }

        // === BODY / VEST ===
        this.drawRect(ctx, baseX + 6, baseY + 28, 14, 3, vestOrange);
        this.drawRect(ctx, baseX + 5, baseY + 31, 16, 6, vestOrange);
        this.drawRect(ctx, baseX + 6, baseY + 37, 14, 4, shirtBlue);

        // Vest reflective stripes
        this.drawRect(ctx, baseX + 6, baseY + 33, 14, 1, '#FFFF44');
        this.drawRect(ctx, baseX + 6, baseY + 36, 14, 1, '#FFFF44');

        // Vest edge highlights
        this.drawRect(ctx, baseX + 5, baseY + 31, 2, 6, vestDark);
        this.drawRect(ctx, baseX + 19, baseY + 31, 2, 6, vestDark);

        // === ARMS ===
        const armLift = this.state === 'throwing' && this.stateTimer > 0.1 ? -4 : 0;
        // Left arm (back)
        this.drawRect(ctx, baseX + 2, baseY + 29 + armLift, 3, 5, shirtBlue);
        this.drawRect(ctx, baseX + 1, baseY + 37 + armLift, 3, 3, skinColor);

        // Right arm (front, holds hammer)
        this.drawRect(ctx, baseX + 21, baseY + 29, 4, 5, shirtBlue);
        this.drawRect(ctx, baseX + 22, baseY + 37, 3, 3, skinColor);

        // === HAMMER (on right arm) ===
        ctx.save();
        const hammerPivotX = baseX + 24;
        const hammerPivotY = baseY + 34;
        ctx.translate(hammerPivotX, hammerPivotY);
        ctx.rotate(this.hammerAngle * Math.PI / 180);

        // Handle
        ctx.fillStyle = hammerHandle;
        ctx.fillRect(0, -2, 20, 4);

        // Head
        ctx.fillStyle = hammerHead;
        ctx.fillRect(18, -7, 10, 14);
        ctx.fillStyle = '#999999';
        ctx.fillRect(19, -6, 8, 3);
        ctx.fillStyle = '#666666';
        ctx.fillRect(19, 4, 8, 3);

        ctx.restore();

        // === PANTS ===
        const walkBob = Math.sin(this.walkFrame) * 2;
        const isWalking = this.state === 'walking';
        this.drawRect(ctx, baseX + 6, baseY + 41, 6, 7, pantsColor);
        this.drawRect(ctx, baseX + 14, baseY + 41, 6, 7, pantsColor);
        // Belt
        this.drawRect(ctx, baseX + 5, baseY + 41, 16, 1, '#8B6914');
        // Belt buckle
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(baseX + 12, baseY + 41, p + 1, p);

        // === LEGS ===
        if (isWalking) {
            const legOff = Math.sin(this.walkFrame * 2) * 3;
            this.drawRect(ctx, baseX + 7, baseY + 48 + legOff, 4, 6, pantsColor);
            this.drawRect(ctx, baseX + 15, baseY + 48 - legOff, 4, 6, pantsColor);
            this.drawRect(ctx, baseX + 6, baseY + 57 + legOff, 5, 4, bootColor);
            this.drawRect(ctx, baseX + 14, baseY + 57 - legOff, 5, 4, bootColor);
        } else {
            this.drawRect(ctx, baseX + 7, baseY + 48, 4, 7, pantsColor);
            this.drawRect(ctx, baseX + 15, baseY + 48, 4, 7, pantsColor);
            this.drawRect(ctx, baseX + 6, baseY + 58, 5, 4, bootColor);
            this.drawRect(ctx, baseX + 14, baseY + 58, 5, 4, bootColor);
        }

        // Boot soles
        this.drawRect(ctx, baseX + 5, baseY + 62, 6, 2, bootDark);
        this.drawRect(ctx, baseX + 13, baseY + 62, 6, 2, bootDark);

        ctx.restore();

        // === HAMMER ZONE TELEGRAPH (not flipped) ===
        if (this.hammerZone && (this.state === 'winding_up' || (this.state === 'pounding' && this.stateTimer < 0.3))) {
            const zone = this.hammerZone;
            const flashAlpha = this.state === 'winding_up'
                ? 0.15 + Math.sin(this.stateTimer * 12) * 0.1
                : 0.4;
            ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
            ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            ctx.strokeStyle = `rgba(255, 50, 50, ${flashAlpha + 0.2})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        }

        // === SHOCKWAVE (not flipped) ===
        if (this.shockwave) {
            const sw = this.shockwave;
            const progress = sw.radius / sw.maxRadius;
            const alpha = (1 - progress) * 0.6;
            ctx.strokeStyle = `rgba(255, 200, 50, ${alpha})`;
            ctx.lineWidth = 4 - progress * 3;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, Math.PI, 0, true);
            ctx.stroke();

            // Ground dust
            ctx.fillStyle = `rgba(180, 160, 120, ${alpha * 0.5})`;
            const dustWidth = sw.radius * 2;
            ctx.fillRect(sw.x - sw.radius, sw.y - 8, dustWidth, 8);
        }

        // Nails (not flipped)
        for (const nail of this.nails) {
            nail.render(ctx);
        }

        // Health bar
        this.drawHealthBar(ctx, this.x, this.y - 15, this.width);
        ctx.globalAlpha = 1;
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
