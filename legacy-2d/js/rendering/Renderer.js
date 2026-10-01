class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pixel = 4; // For splash screen pixel art
    }

    clear() {
        // Sky gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderGround(groundY) {
        const ctx = this.ctx;

        // Rooftop main surface
        ctx.fillStyle = '#8B8B83';
        ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);

        // Rooftop edge/lip
        ctx.fillStyle = '#9A9A90';
        ctx.fillRect(0, groundY, this.canvas.width, 6);

        // Rooftop texture lines
        ctx.fillStyle = '#7A7A73';
        for (let x = 0; x < this.canvas.width; x += 40) {
            ctx.fillRect(x, groundY + 8, 2, this.canvas.height - groundY - 8);
        }
        for (let y = groundY + 15; y < this.canvas.height; y += 20) {
            ctx.fillStyle = '#7A7A73';
            ctx.fillRect(0, y, this.canvas.width, 1);
        }

        // AC unit on the left
        this.drawACUnit(ctx, 30, groundY - 35);

        // Vent pipes
        this.drawVentPipe(ctx, 700, groundY - 25);
        this.drawVentPipe(ctx, 730, groundY - 20);

        // Rooftop access door/structure on right
        this.drawRooftopDoor(ctx, 600, groundY - 60);

        // Small satellite dish
        this.drawSatelliteDish(ctx, 500, groundY - 20);

        // Roof edge border at bottom
        ctx.fillStyle = '#666660';
        ctx.fillRect(0, this.canvas.height - 8, this.canvas.width, 8);
        ctx.fillStyle = '#555550';
        ctx.fillRect(0, this.canvas.height - 4, this.canvas.width, 4);
    }

    drawACUnit(ctx, x, y) {
        // Main box
        ctx.fillStyle = '#A0A090';
        ctx.fillRect(x, y, 50, 35);

        // Top vent
        ctx.fillStyle = '#888880';
        ctx.fillRect(x + 5, y, 40, 8);

        // Vent lines
        ctx.fillStyle = '#606058';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(x + 8 + i * 8, y + 2, 5, 4);
        }

        // Side panel
        ctx.fillStyle = '#909088';
        ctx.fillRect(x, y + 10, 50, 25);

        // Side vents
        ctx.fillStyle = '#707068';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 5, y + 14 + i * 7, 40, 3);
        }
    }

    drawVentPipe(ctx, x, y) {
        // Pipe
        ctx.fillStyle = '#707068';
        ctx.fillRect(x, y, 16, 25);

        // Pipe cap
        ctx.fillStyle = '#606058';
        ctx.fillRect(x - 2, y - 4, 20, 6);

        // Highlight
        ctx.fillStyle = '#808078';
        ctx.fillRect(x, y, 4, 25);
    }

    drawRooftopDoor(ctx, x, y) {
        // Structure base
        ctx.fillStyle = '#707068';
        ctx.fillRect(x, y, 60, 60);

        // Door
        ctx.fillStyle = '#505048';
        ctx.fillRect(x + 15, y + 15, 30, 45);

        // Door handle
        ctx.fillStyle = '#909088';
        ctx.fillRect(x + 38, y + 38, 4, 8);

        // Roof of structure
        ctx.fillStyle = '#606058';
        ctx.fillRect(x - 3, y - 5, 66, 8);
    }

    drawSatelliteDish(ctx, x, y) {
        // Pole
        ctx.fillStyle = '#606058';
        ctx.fillRect(x + 8, y, 4, 20);

        // Dish
        ctx.fillStyle = '#A0A098';
        ctx.beginPath();
        ctx.ellipse(x + 10, y - 5, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dish inner
        ctx.fillStyle = '#888880';
        ctx.beginPath();
        ctx.ellipse(x + 10, y - 5, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // LNB arm
        ctx.fillStyle = '#606058';
        ctx.fillRect(x + 8, y - 8, 12, 2);

        // LNB
        ctx.fillStyle = '#505048';
        ctx.fillRect(x + 18, y - 12, 4, 8);
    }

    renderClouds(clouds) {
        for (const cloud of clouds) {
            cloud.render(this.ctx);
        }
    }

    renderEntity(entity) {
        entity.render(this.ctx);
    }

    renderEntities(entities) {
        for (const entity of entities) {
            if (entity.active) {
                this.renderEntity(entity);
            }
        }
    }

    renderGameUI(game) {
        // Health hearts
        this.renderHealth(game.playerHealth, game.maxPlayerHealth);

        // Score
        this.ctx.fillStyle = '#FFF';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.strokeText(`Score: ${game.score}`, this.canvas.width - 150, 30);
        this.ctx.fillText(`Score: ${game.score}`, this.canvas.width - 150, 30);

        // Wave indicator
        if (game.gameMode === 'endless') {
            this.ctx.fillStyle = '#44AAFF';
            this.ctx.strokeText(`Wave ${game.wave}`, this.canvas.width - 150, 55);
            this.ctx.fillText(`Wave ${game.wave}`, this.canvas.width - 150, 55);
        } else if (game.wave <= 3) {
            this.ctx.fillStyle = '#FFF';
            this.ctx.strokeText(`Ch.${game.chapter} - Wave ${game.wave}/3`, this.canvas.width - 190, 55);
            this.ctx.fillText(`Ch.${game.chapter} - Wave ${game.wave}/3`, this.canvas.width - 190, 55);
        } else {
            this.ctx.fillStyle = '#FF6666';
            this.ctx.strokeText('BOSS!', this.canvas.width - 150, 55);
            this.ctx.fillText('BOSS!', this.canvas.width - 150, 55);
        }

        // Controls hint
        this.ctx.fillStyle = '#FFF';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.font = '14px Arial';
        this.ctx.strokeText('WASD/Arrows: Move | Space: Fire', 10, this.canvas.height - 15);
        this.ctx.fillText('WASD/Arrows: Move | Space: Fire', 10, this.canvas.height - 15);

        // Game over / Victory screens
        if (game.state === 'gameover') {
            this.renderOverlay('GAME OVER', '#DD4444', game.score);
        } else if (game.state === 'victory') {
            this.renderOverlay('VICTORY!', '#44DD44', game.score);
        }
    }

    renderHealth(current, max) {
        const heartSize = 24;
        const padding = 5;
        const startX = 15;
        const startY = 15;

        for (let i = 0; i < max; i++) {
            const x = startX + i * (heartSize + padding);
            this.renderHeart(x, startY, heartSize, i < current);
        }
    }

    renderHeart(x, y, size, filled) {
        this.ctx.save();

        if (filled) {
            this.ctx.fillStyle = '#FF4466';
        } else {
            this.ctx.fillStyle = '#666666';
        }

        // Simple pixel heart
        const p = size / 8;
        this.ctx.fillRect(x + p, y, p * 2, p);
        this.ctx.fillRect(x + p * 5, y, p * 2, p);
        this.ctx.fillRect(x, y + p, p * 4, p * 2);
        this.ctx.fillRect(x + p * 4, y + p, p * 4, p * 2);
        this.ctx.fillRect(x, y + p * 3, p * 8, p * 2);
        this.ctx.fillRect(x + p, y + p * 5, p * 6, p);
        this.ctx.fillRect(x + p * 2, y + p * 6, p * 4, p);
        this.ctx.fillRect(x + p * 3, y + p * 7, p * 2, p);

        // Highlight
        if (filled) {
            this.ctx.fillStyle = '#FF8899';
            this.ctx.fillRect(x + p, y + p, p, p);
            this.ctx.fillRect(x + p * 5, y + p, p, p);
        }

        this.ctx.restore();
    }

    renderModeSelect(modes, selectedIndex) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark background
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#0a1628');
        gradient.addColorStop(0.5, '#1a2a4e');
        gradient.addColorStop(1, '#0a1628');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = '#44AAFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT MODE', w / 2, 100);

        // Mode cards
        const cardWidth = 220;
        const cardHeight = 300;
        const cardSpacing = 60;
        const totalWidth = modes.length * cardWidth + (modes.length - 1) * cardSpacing;
        let startX = (w - totalWidth) / 2;

        modes.forEach((mode, i) => {
            const x = startX + i * (cardWidth + cardSpacing);
            const y = 150;
            const selected = i === selectedIndex;

            // Card background
            ctx.fillStyle = selected ? '#2a4a7a' : '#1a2a4a';
            ctx.fillRect(x, y, cardWidth, cardHeight);

            // Card border
            ctx.strokeStyle = selected ? '#44AAFF' : '#335577';
            ctx.lineWidth = selected ? 4 : 2;
            ctx.strokeRect(x, y, cardWidth, cardHeight);

            // Mode icon
            this.drawModeIcon(ctx, mode.icon, x + cardWidth / 2, y + 80, selected);

            // Mode name
            ctx.fillStyle = selected ? '#44AAFF' : '#88AACC';
            ctx.font = 'bold 28px Arial';
            ctx.fillText(mode.name, x + cardWidth / 2, y + 180);

            // Description
            ctx.fillStyle = '#6688AA';
            ctx.font = '16px Arial';
            ctx.fillText(mode.description, x + cardWidth / 2, y + 220);

            // Selection arrow
            if (selected) {
                ctx.fillStyle = '#44AAFF';
                ctx.beginPath();
                ctx.moveTo(x + cardWidth / 2 - 15, y + cardHeight - 30);
                ctx.lineTo(x + cardWidth / 2 + 15, y + cardHeight - 30);
                ctx.lineTo(x + cardWidth / 2, y + cardHeight - 15);
                ctx.fill();
            }
        });

        // Controls hint
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.fillText('A/D to select | SPACE to confirm | ESC to go back', w / 2, h - 60);

        ctx.textAlign = 'left';
    }

    drawModeIcon(ctx, icon, centerX, centerY, animated) {
        const time = animated ? Date.now() / 1000 : 0;

        if (icon === 'boss') {
            // Draw a mini cat face for story mode
            const bounce = animated ? Math.sin(time * 3) * 3 : 0;
            const size = 40;

            // Cat head
            ctx.fillStyle = '#FF9944';
            ctx.beginPath();
            ctx.arc(centerX, centerY + bounce, size, 0, Math.PI * 2);
            ctx.fill();

            // Ears
            ctx.beginPath();
            ctx.moveTo(centerX - 35, centerY - 20 + bounce);
            ctx.lineTo(centerX - 20, centerY - 45 + bounce);
            ctx.lineTo(centerX - 10, centerY - 20 + bounce);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(centerX + 35, centerY - 20 + bounce);
            ctx.lineTo(centerX + 20, centerY - 45 + bounce);
            ctx.lineTo(centerX + 10, centerY - 20 + bounce);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#55DD55';
            ctx.beginPath();
            ctx.arc(centerX - 15, centerY - 5 + bounce, 8, 0, Math.PI * 2);
            ctx.arc(centerX + 15, centerY - 5 + bounce, 8, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.arc(centerX - 15, centerY - 5 + bounce, 4, 0, Math.PI * 2);
            ctx.arc(centerX + 15, centerY - 5 + bounce, 4, 0, Math.PI * 2);
            ctx.fill();

            // Nose
            ctx.fillStyle = '#FF6666';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY + 5 + bounce);
            ctx.lineTo(centerX - 6, centerY + 15 + bounce);
            ctx.lineTo(centerX + 6, centerY + 15 + bounce);
            ctx.fill();

            // Mouth
            ctx.strokeStyle = '#CC5500';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX - 8, centerY + 20 + bounce, 8, 0, Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(centerX + 8, centerY + 20 + bounce, 8, 0, Math.PI);
            ctx.stroke();

        } else if (icon === 'infinity') {
            // Draw infinity symbol for endless mode
            const pulse = animated ? Math.sin(time * 4) * 0.2 + 1 : 1;
            const rotation = animated ? time * 0.5 : 0;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(pulse, pulse);

            // Glowing infinity
            ctx.strokeStyle = '#44AAFF';
            ctx.lineWidth = 8;
            ctx.shadowColor = '#44AAFF';
            ctx.shadowBlur = animated ? 15 : 0;

            ctx.beginPath();
            // Left loop
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-20, -30, -50, -30, -50, 0);
            ctx.bezierCurveTo(-50, 30, -20, 30, 0, 0);
            // Right loop
            ctx.bezierCurveTo(20, -30, 50, -30, 50, 0);
            ctx.bezierCurveTo(50, 30, 20, 30, 0, 0);
            ctx.stroke();

            // Inner bright line
            ctx.strokeStyle = '#AADDFF';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 0;
            ctx.stroke();

            ctx.restore();

            // Floating particles around infinity
            if (animated) {
                for (let i = 0; i < 6; i++) {
                    const angle = time * 2 + i * Math.PI / 3;
                    const radius = 45 + Math.sin(time * 3 + i) * 10;
                    const px = centerX + Math.cos(angle) * radius;
                    const py = centerY + Math.sin(angle) * radius * 0.5;
                    const alpha = (Math.sin(time * 4 + i) + 1) / 2;

                    ctx.fillStyle = `rgba(68, 170, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    renderCharacterSelect(characters, selectedIndex) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark background
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(0.5, '#2d1b4e');
        gradient.addColorStop(1, '#1a0a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = '#FFCC44';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT YOUR HERO', w / 2, 50);

        // Calculate layout based on number of characters
        const padding = 30;
        const availableWidth = w - padding * 2;
        const availableHeight = h - 140; // Space for title and controls

        // Determine grid layout
        const maxCardsPerRow = Math.min(characters.length, 6);
        const numRows = Math.ceil(characters.length / maxCardsPerRow);
        const cardsPerRow = Math.ceil(characters.length / numRows);

        // Calculate card dimensions to fit
        const cardSpacing = 15;
        const maxCardWidth = Math.floor((availableWidth - (cardsPerRow - 1) * cardSpacing) / cardsPerRow);
        const maxCardHeight = Math.floor((availableHeight - (numRows - 1) * cardSpacing) / numRows);

        // Cap card size for aesthetic reasons
        const cardWidth = Math.min(maxCardWidth, 150);
        const cardHeight = Math.min(maxCardHeight, 200);

        // Calculate starting positions to center the grid
        const totalGridWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * cardSpacing;
        const totalGridHeight = numRows * cardHeight + (numRows - 1) * cardSpacing;
        const startX = (w - totalGridWidth) / 2;
        const startY = 70 + (availableHeight - totalGridHeight) / 2;

        // Scale factor for character previews
        const previewScale = cardWidth / 150;

        characters.forEach((char, i) => {
            const row = Math.floor(i / cardsPerRow);
            const col = i % cardsPerRow;

            // Center last row if it has fewer cards
            const cardsInThisRow = row === numRows - 1 ? characters.length - row * cardsPerRow : cardsPerRow;
            const rowWidth = cardsInThisRow * cardWidth + (cardsInThisRow - 1) * cardSpacing;
            const rowStartX = (w - rowWidth) / 2;

            const colInRow = i - row * cardsPerRow;
            const x = rowStartX + colInRow * (cardWidth + cardSpacing);
            const y = startY + row * (cardHeight + cardSpacing);
            const selected = i === selectedIndex;

            // Card background with glow for selected
            if (selected) {
                ctx.shadowColor = '#FFCC44';
                ctx.shadowBlur = 15;
            }
            ctx.fillStyle = selected ? '#4a3a6a' : '#2a1a3a';
            ctx.fillRect(x, y, cardWidth, cardHeight);
            ctx.shadowBlur = 0;

            // Card border
            ctx.strokeStyle = selected ? '#FFCC44' : '#553366';
            ctx.lineWidth = selected ? 3 : 1;
            ctx.strokeRect(x, y, cardWidth, cardHeight);

            // Character preview (scaled)
            const previewY = y + cardHeight * 0.35;
            this.drawCharacterPreviewScaled(ctx, char, x + cardWidth / 2, previewY, selected, previewScale);

            // Character name
            ctx.fillStyle = selected ? '#FFCC44' : '#AAAACC';
            const nameFontSize = Math.max(14, Math.floor(cardWidth / 8));
            ctx.font = `bold ${nameFontSize}px Arial`;
            ctx.fillText(char.name, x + cardWidth / 2, y + cardHeight * 0.72);

            // Description (smaller, may truncate)
            ctx.fillStyle = '#8888AA';
            const descFontSize = Math.max(10, Math.floor(cardWidth / 12));
            ctx.font = `${descFontSize}px Arial`;
            const maxDescWidth = cardWidth - 10;
            let desc = char.description;
            if (ctx.measureText(desc).width > maxDescWidth) {
                while (ctx.measureText(desc + '...').width > maxDescWidth && desc.length > 0) {
                    desc = desc.slice(0, -1);
                }
                desc += '...';
            }
            ctx.fillText(desc, x + cardWidth / 2, y + cardHeight * 0.85);

            // Lock indicator or selection indicator
            if (!char.unlocked) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(x, y, cardWidth, cardHeight);
                ctx.fillStyle = '#FF4444';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('LOCKED', x + cardWidth / 2, y + cardHeight / 2);
            } else if (selected) {
                // Selection indicator - small triangle
                const triSize = Math.max(8, cardWidth / 15);
                ctx.fillStyle = '#FFCC44';
                ctx.beginPath();
                ctx.moveTo(x + cardWidth / 2 - triSize, y + cardHeight - triSize * 2.5);
                ctx.lineTo(x + cardWidth / 2 + triSize, y + cardHeight - triSize * 2.5);
                ctx.lineTo(x + cardWidth / 2, y + cardHeight - triSize);
                ctx.fill();
            }
        });

        // Controls hint
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Arial';
        ctx.fillText('A/D or Arrow Keys to select | SPACE to confirm', w / 2, h - 25);

        ctx.textAlign = 'left';
    }

    drawCharacterPreviewScaled(ctx, char, centerX, centerY, animated, scale = 1) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
        this.drawCharacterPreview(ctx, char, centerX, centerY, animated);
        ctx.restore();
    }

    drawCharacterPreview(ctx, char, centerX, centerY, animated) {
        const p = 3;
        const time = animated ? Date.now() / 1000 : 0;

        if (char.name === 'Gary') {
            // Draw Gary preview (simplified pigeon)
            const bounce = animated ? Math.sin(time * 3) * 3 : 0;
            const bx = centerX - 30;
            const by = centerY - 30 + bounce;

            // Body
            ctx.fillStyle = '#AAB8C8';
            ctx.fillRect(bx + 5 * p, by + 8 * p, 8 * p, 6 * p);
            ctx.fillStyle = '#8899AA';
            ctx.fillRect(bx + 2 * p, by + 10 * p, 12 * p, 8 * p);
            ctx.fillStyle = '#667788';
            ctx.fillRect(bx + 4 * p, by + 16 * p, 8 * p, 4 * p);

            // Head
            ctx.fillStyle = '#AAB8C8';
            ctx.fillRect(bx + 12 * p, by + 2 * p, 6 * p, 4 * p);
            ctx.fillStyle = '#8899AA';
            ctx.fillRect(bx + 10 * p, by + 4 * p, 8 * p, 6 * p);

            // Beak
            ctx.fillStyle = '#FF8844';
            ctx.fillRect(bx + 18 * p, by + 5 * p, 4 * p, 3 * p);

            // Eye
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bx + 14 * p, by + 4 * p, 3 * p, 3 * p);
            ctx.fillStyle = '#222222';
            ctx.fillRect(bx + 15 * p, by + 4 * p, 2 * p, 2 * p);

            // Legs
            ctx.fillStyle = '#DD7755';
            ctx.fillRect(bx + 6 * p, by + 18 * p, 2 * p, 4 * p);
            ctx.fillRect(bx + 10 * p, by + 18 * p, 2 * p, 4 * p);

            // Fire particles when selected
            if (animated) {
                this.drawMiniFireParticles(ctx, bx + 22 * p, by + 5 * p, time);
            }
        } else if (char.name === 'Violet') {
            // Draw Violet preview (bat)
            const wingFrame = animated ? Math.floor(time * 8) % 4 : 0;
            const wingOffsets = [0, -2, -4, -2];
            const wingY = wingOffsets[wingFrame] * p;
            const bx = centerX - 35;
            const by = centerY - 25;

            // Wings
            ctx.fillStyle = '#3A2040';
            ctx.fillRect(bx, by + 8 * p + wingY, 8 * p, 6 * p);
            ctx.fillRect(bx + 18 * p, by + 8 * p + wingY, 8 * p, 6 * p);

            // Wing bones
            ctx.fillStyle = '#5A3A6A';
            ctx.fillRect(bx + 6 * p, by + 6 * p + wingY, p, 6 * p);
            ctx.fillRect(bx + 3 * p, by + 8 * p + wingY, p, 5 * p);
            ctx.fillRect(bx + 19 * p, by + 6 * p + wingY, p, 6 * p);
            ctx.fillRect(bx + 22 * p, by + 8 * p + wingY, p, 5 * p);

            // Body
            ctx.fillStyle = '#6A4A7A';
            ctx.fillRect(bx + 9 * p, by + 4 * p, 8 * p, 5 * p);
            ctx.fillStyle = '#4A2A5A';
            ctx.fillRect(bx + 8 * p, by + 8 * p, 10 * p, 8 * p);
            ctx.fillStyle = '#2A1A3A';
            ctx.fillRect(bx + 10 * p, by + 14 * p, 6 * p, 4 * p);

            // Ears
            ctx.fillStyle = '#4A2A5A';
            ctx.fillRect(bx + 8 * p, by, 3 * p, 5 * p);
            ctx.fillRect(bx + 15 * p, by, 3 * p, 5 * p);
            ctx.fillStyle = '#AA6688';
            ctx.fillRect(bx + 9 * p, by + p, p, 3 * p);
            ctx.fillRect(bx + 16 * p, by + p, p, 3 * p);

            // Eyes
            ctx.fillStyle = '#FF4488';
            ctx.fillRect(bx + 9 * p, by + 8 * p, 2 * p, 2 * p);
            ctx.fillRect(bx + 15 * p, by + 8 * p, 2 * p, 2 * p);

            // Fangs
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bx + 11 * p, by + 12 * p, p, 2 * p);
            ctx.fillRect(bx + 14 * p, by + 12 * p, p, 2 * p);

            // Laser particles when selected
            if (animated) {
                this.drawMiniLaserParticles(ctx, centerX + 35, by + 10 * p, time);
            }
        } else if (char.name === 'Fang') {
            // Draw Fang preview (falcon)
            const bounce = animated ? Math.sin(time * 4) * 2 : 0;
            const wingFrame = animated ? Math.floor(time * 6) % 4 : 0;
            const wingOffsets = [0, -2, -3, -2];
            const wingY = wingOffsets[wingFrame] * p;
            const bx = centerX - 30;
            const by = centerY - 30 + bounce;

            // Colors
            const bodyDark = '#2C2416';
            const bodyMain = '#4A3728';
            const bodyLight = '#6B5344';
            const cream = '#FFFDD0';

            // Tail
            ctx.fillStyle = bodyDark;
            ctx.fillRect(bx + 2 * p, by + 16 * p, 6 * p, 4 * p);

            // Left wing
            ctx.fillStyle = bodyMain;
            ctx.fillRect(bx - 2 * p, by + 8 * p + wingY, 6 * p, 10 * p);
            ctx.fillStyle = bodyDark;
            ctx.fillRect(bx - 3 * p, by + 12 * p + wingY, 4 * p, 6 * p);

            // Body
            ctx.fillStyle = bodyLight;
            ctx.fillRect(bx + 4 * p, by + 6 * p, 10 * p, 4 * p);
            ctx.fillStyle = bodyMain;
            ctx.fillRect(bx + 3 * p, by + 10 * p, 12 * p, 6 * p);
            ctx.fillStyle = cream;
            ctx.fillRect(bx + 6 * p, by + 8 * p, 6 * p, 8 * p);
            // Chest spots
            ctx.fillStyle = bodyMain;
            ctx.fillRect(bx + 7 * p, by + 10 * p, p, p);
            ctx.fillRect(bx + 10 * p, by + 12 * p, p, p);

            // Right wing
            ctx.fillStyle = bodyMain;
            ctx.fillRect(bx + 14 * p, by + 8 * p + wingY, 6 * p, 10 * p);
            ctx.fillStyle = bodyDark;
            ctx.fillRect(bx + 17 * p, by + 12 * p + wingY, 4 * p, 6 * p);

            // Head
            ctx.fillStyle = bodyDark;
            ctx.fillRect(bx + 12 * p, by + p, 6 * p, 3 * p);
            ctx.fillStyle = bodyMain;
            ctx.fillRect(bx + 10 * p, by + 3 * p, 8 * p, 4 * p);
            // White cheek
            ctx.fillStyle = '#F5F5DC';
            ctx.fillRect(bx + 11 * p, by + 4 * p, 4 * p, 3 * p);
            // Malar stripe
            ctx.fillStyle = '#1A1510';
            ctx.fillRect(bx + 16 * p, by + 3 * p, 2 * p, 5 * p);

            // Eye
            ctx.fillStyle = '#000000';
            ctx.fillRect(bx + 13 * p, by + 3 * p, 2 * p, 2 * p);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(bx + 13 * p, by + 3 * p, p, p);

            // Beak
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(bx + 17 * p, by + 5 * p, 4 * p, 2 * p);
            ctx.fillRect(bx + 19 * p, by + 6 * p, 2 * p, 2 * p);

            // Legs
            ctx.fillStyle = '#3A3A3A';
            ctx.fillRect(bx + 6 * p, by + 16 * p, 2 * p, 4 * p);
            ctx.fillRect(bx + 10 * p, by + 16 * p, 2 * p, 4 * p);
            // Talons
            ctx.fillRect(bx + 5 * p, by + 19 * p, p, 2 * p);
            ctx.fillRect(bx + 8 * p, by + 19 * p, p, 2 * p);
            ctx.fillRect(bx + 11 * p, by + 19 * p, p, 2 * p);

            // Lightning particles when selected
            if (animated) {
                this.drawMiniLightningParticles(ctx, bx + 20 * p, by + 10 * p, time);
            }
        } else if (char.name === 'Quacks') {
            // Draw Quacks preview (slim white duck)
            const waddle = animated ? Math.sin(time * 6) * 2 : 0;
            const wingFrame = animated ? Math.floor(time * 5) % 4 : 0;
            const wingOffsets = [0, -1, -2, -1];
            const wingY = wingOffsets[wingFrame] * p;
            const bx = centerX - 20;
            const by = centerY - 20 + waddle;

            // White duck colors
            const bodyMain = '#FFFFFF';
            const bodyDark = '#DDDDDD';
            const wingColor = '#EEEEEE';
            const wingDark = '#CCCCCC';
            const billColor = '#FF8C00';

            // Tail (small)
            ctx.fillStyle = bodyDark;
            ctx.fillRect(bx, by + 10 * p, 2 * p, 2 * p);

            // Wing (behind)
            ctx.fillStyle = wingDark;
            ctx.fillRect(bx + 2 * p, by + 8 * p + wingY, 5 * p, 4 * p);

            // Body (slimmer)
            ctx.fillStyle = bodyMain;
            ctx.fillRect(bx + 3 * p, by + 5 * p, 6 * p, 6 * p);
            ctx.fillStyle = bodyDark;
            ctx.fillRect(bx + 4 * p, by + 10 * p, 4 * p, 2 * p);

            // Wing (front)
            ctx.fillStyle = wingColor;
            ctx.fillRect(bx + 6 * p, by + 7 * p + wingY, 5 * p, 4 * p);

            // Head (white)
            ctx.fillStyle = bodyMain;
            ctx.fillRect(bx + 9 * p, by + 2 * p, 5 * p, 5 * p);

            // Eye
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bx + 11 * p, by + 3 * p, 2 * p, 2 * p);
            ctx.fillStyle = '#111111';
            ctx.fillRect(bx + 11 * p, by + 3 * p, p, p);

            // Bill (orange)
            ctx.fillStyle = billColor;
            ctx.fillRect(bx + 14 * p, by + 4 * p, 3 * p, 2 * p);
            ctx.fillStyle = '#DD6600';
            ctx.fillRect(bx + 14 * p, by + 6 * p, 2 * p, p);

            // Feet (slim)
            ctx.fillStyle = billColor;
            ctx.fillRect(bx + 5 * p, by + 12 * p, p, 2 * p);
            ctx.fillRect(bx + 4 * p, by + 13 * p, 3 * p, p);
            ctx.fillRect(bx + 8 * p, by + 12 * p, p, 2 * p);
            ctx.fillRect(bx + 7 * p, by + 13 * p, 3 * p, p);

            // Feather particles when selected
            if (animated) {
                this.drawMiniFeatherParticles(ctx, bx + 17 * p, by + 4 * p, time);
            }
        }
    }

    drawMiniFeatherParticles(ctx, x, y, time) {
        // Draw tracking feathers
        for (let i = 0; i < 3; i++) {
            const angle = Math.sin(time * 3 + i * 0.5) * 0.3;
            const px = x + i * 12 + Math.cos(time * 5 + i) * 5;
            const py = y + (i - 1) * 10 + Math.sin(time * 4 + i * 2) * 3;

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);

            // Feather
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-5, -1, 10, 2);
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(-3, -1);
            ctx.lineTo(3, -3);
            ctx.lineTo(5, -1);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-3, 1);
            ctx.lineTo(3, 3);
            ctx.lineTo(5, 1);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        // Target reticle
        const reticleX = x + 35 + Math.sin(time * 2) * 10;
        const reticleY = y + Math.cos(time * 2) * 15;
        ctx.strokeStyle = `rgba(255, 0, 0, ${(Math.sin(time * 8) + 1) / 2 * 0.7 + 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(reticleX, reticleY, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(reticleX - 12, reticleY);
        ctx.lineTo(reticleX + 12, reticleY);
        ctx.moveTo(reticleX, reticleY - 12);
        ctx.lineTo(reticleX, reticleY + 12);
        ctx.stroke();
    }

    drawMiniLightningParticles(ctx, x, y, time) {
        // Draw small lightning bolts
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;

        for (let i = 0; i < 2; i++) {
            const startX = x + i * 15;
            const startY = y + Math.sin(time * 8 + i) * 5;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + 5, startY + 8);
            ctx.lineTo(startX + 2, startY + 8);
            ctx.lineTo(startX + 8, startY + 18);
            ctx.stroke();

            // White core
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + 5, startY + 8);
            ctx.lineTo(startX + 2, startY + 8);
            ctx.lineTo(startX + 8, startY + 18);
            ctx.stroke();

            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
        }

        // Sparks
        for (let i = 0; i < 3; i++) {
            const sparkX = x + Math.sin(time * 12 + i * 2) * 10 + i * 8;
            const sparkY = y + 10 + Math.cos(time * 10 + i) * 8;
            ctx.fillStyle = i % 2 === 0 ? '#00FFFF' : '#FFFFFF';
            ctx.fillRect(sparkX, sparkY, 3, 3);
        }
    }

    drawMiniFireParticles(ctx, x, y, time) {
        for (let i = 0; i < 3; i++) {
            const px = x + i * 8 + Math.sin(time * 10 + i) * 3;
            const py = y + Math.sin(time * 8 + i * 2) * 4;
            const colors = ['#FFEE66', '#FFAA33', '#FF4400'];
            ctx.fillStyle = colors[i];
            ctx.fillRect(px, py, 6 - i, 6 - i);
        }
    }

    drawMiniLaserParticles(ctx, x, y, time) {
        for (let i = 0; i < 3; i++) {
            const px = x + i * 12;
            const alpha = ((Math.sin(time * 15 + i * 2) + 1) / 2) * 0.7 + 0.3;
            ctx.fillStyle = `rgba(255, 68, 170, ${alpha})`;
            ctx.fillRect(px, y, 10, 3);
            ctx.fillStyle = `rgba(255, 170, 221, ${alpha})`;
            ctx.fillRect(px + 2, y + 1, 6, 1);
        }
    }

    renderSplashScreen(timer, characterName = 'Gary') {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark background with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(0.5, '#2d1b4e');
        gradient.addColorStop(1, '#1a0a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Animated stars
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73 + timer * 20) % w;
            const y = (i * 47) % h;
            const size = (Math.sin(timer * 3 + i) + 1) * 1.5 + 1;
            ctx.fillRect(x, y, size, size);
        }

        // Draw character sprite
        if (characterName === 'Violet') {
            this.drawSplashViolet(w / 2 - 60, 150, timer);
        } else if (characterName === 'Fang') {
            this.drawSplashFang(w / 2 - 60, 150, timer);
        } else if (characterName === 'Quacks') {
            this.drawSplashQuacks(w / 2 - 60, 150, timer);
        } else {
            this.drawSplashGary(w / 2 - 60, 150, timer);
        }

        // Effects behind character
        if (characterName === 'Fang') {
            this.drawSplashLightning(w / 2 - 100, 180, timer);
            this.drawSplashLightning(w / 2 + 80, 200, timer);
        } else if (characterName === 'Quacks') {
            this.drawSplashFeathers(w / 2 - 80, 200, timer);
            this.drawSplashFeathers(w / 2 + 60, 220, timer);
        } else {
            this.drawSplashFire(w / 2 - 100, 280, timer);
            this.drawSplashFire(w / 2 + 60, 290, timer);
        }

        // Title: Character name in big pixel letters
        this.drawPixelTitle(ctx, w / 2, 80, timer, characterName);

        // Subtitle in pixel style
        let subtitle;
        if (characterName === 'Violet') {
            subtitle = 'THE LASER BAT';
        } else if (characterName === 'Fang') {
            subtitle = 'THE LIGHTNING FALCON';
        } else if (characterName === 'Quacks') {
            subtitle = 'THE TRACKER DUCK';
        } else {
            subtitle = 'THE FIRE PIGEON';
        }
        this.drawPixelSubtitle(ctx, w / 2, 350, timer, subtitle, characterName);

        // Flashing "Press SPACE to start"
        if (Math.floor(timer * 2) % 2 === 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.fillText('Press SPACE to start', w / 2, 450);
        }

        // Controls info
        ctx.fillStyle = '#8888AA';
        ctx.font = '14px Arial';
        ctx.fillText('WASD/Arrows: Move | W/Up: Jump (x2) | Space: Fire', w / 2, 520);

        // Credits
        ctx.fillStyle = '#666688';
        ctx.font = '12px Arial';
        ctx.fillText('A rooftop adventure', w / 2, 560);

        ctx.textAlign = 'left';
    }

    drawPixelTitle(ctx, centerX, y, timer, characterName = 'Gary') {
        const p = 4; // pixel size for title

        // "GARY" in pixel calligraphy style - fancy serifs and curves
        const letters = {
            G: [
                [0,0,0,1,1,1,1,1,0,0],
                [0,0,1,1,1,1,1,1,1,0],
                [0,1,1,1,0,0,0,1,1,0],
                [1,1,1,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,1,1,1,1,0],
                [1,1,0,0,0,1,1,1,1,0],
                [1,1,1,0,0,0,0,1,1,0],
                [0,1,1,1,0,0,0,1,1,0],
                [0,0,1,1,1,1,1,1,1,0],
                [0,0,0,1,1,1,1,1,0,0],
                [0,0,0,0,0,1,1,1,1,1]
            ],
            A: [
                [0,0,0,1,1,1,0,0,0,0],
                [0,0,1,1,1,1,1,0,0,0],
                [0,1,1,1,0,1,1,1,0,0],
                [0,1,1,0,0,0,1,1,0,0],
                [1,1,1,0,0,0,1,1,1,0],
                [1,1,0,0,0,0,0,1,1,0],
                [1,1,1,1,1,1,1,1,1,0],
                [1,1,1,1,1,1,1,1,1,0],
                [1,1,0,0,0,0,0,1,1,0],
                [1,1,0,0,0,0,0,1,1,0],
                [1,1,1,0,0,0,1,1,1,1],
                [1,1,1,0,0,0,1,1,1,1]
            ],
            R: [
                [1,1,1,1,1,1,1,0,0,0],
                [1,1,1,1,1,1,1,1,0,0],
                [1,1,0,0,0,0,1,1,1,0],
                [1,1,0,0,0,0,0,1,1,0],
                [1,1,0,0,0,0,1,1,1,0],
                [1,1,1,1,1,1,1,1,0,0],
                [1,1,1,1,1,1,0,0,0,0],
                [1,1,0,0,1,1,1,0,0,0],
                [1,1,0,0,0,1,1,1,0,0],
                [1,1,0,0,0,0,1,1,1,0],
                [1,1,1,0,0,0,0,1,1,1],
                [1,1,1,0,0,0,0,1,1,1]
            ],
            Y: [
                [1,1,1,0,0,0,0,1,1,1],
                [1,1,1,0,0,0,0,1,1,1],
                [0,1,1,1,0,0,1,1,1,0],
                [0,0,1,1,0,0,1,1,0,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,1,1,1,1,0,0,0],
                [0,0,0,1,1,1,1,0,0,0]
            ],
            V: [
                [1,1,1,0,0,0,0,1,1,1],
                [1,1,1,0,0,0,0,1,1,1],
                [1,1,1,0,0,0,0,1,1,1],
                [0,1,1,0,0,0,0,1,1,0],
                [0,1,1,1,0,0,1,1,1,0],
                [0,0,1,1,0,0,1,1,0,0],
                [0,0,1,1,0,0,1,1,0,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,0,0,1,1,1,1,0,0,0],
                [0,0,0,1,1,1,1,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0]
            ],
            I: [
                [0,1,1,1,1,1,1,1,1,0],
                [0,1,1,1,1,1,1,1,1,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,1,1,1,1,1,1,1,1,0],
                [0,1,1,1,1,1,1,1,1,0]
            ],
            O: [
                [0,0,1,1,1,1,1,1,0,0],
                [0,1,1,1,1,1,1,1,1,0],
                [1,1,1,0,0,0,0,1,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,1,0,0,0,0,1,1,1],
                [0,1,1,1,1,1,1,1,1,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0,0]
            ],
            L: [
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,1,1,1,1,1,1,1,0],
                [1,1,1,1,1,1,1,1,1,0]
            ],
            E: [
                [1,1,1,1,1,1,1,1,1,0],
                [1,1,1,1,1,1,1,1,1,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,1,1,1,1,1,0,0,0],
                [1,1,1,1,1,1,1,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,1,1,1,1,1,1,1,0],
                [1,1,1,1,1,1,1,1,1,0]
            ],
            T: [
                [1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,0,0,0]
            ],
            F: [
                [1,1,1,1,1,1,1,1,1,0],
                [1,1,1,1,1,1,1,1,1,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,1,1,1,1,1,0,0,0],
                [1,1,1,1,1,1,1,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0]
            ],
            N: [
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,1,0,0,0,0,0,1,1],
                [1,1,1,1,0,0,0,0,1,1],
                [1,1,0,1,1,0,0,0,1,1],
                [1,1,0,0,1,1,0,0,1,1],
                [1,1,0,0,0,1,1,0,1,1],
                [1,1,0,0,0,0,1,1,1,1],
                [1,1,0,0,0,0,0,1,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1]
            ],
            Q: [
                [0,0,1,1,1,1,1,1,0,0],
                [0,1,1,1,1,1,1,1,1,0],
                [1,1,1,0,0,0,0,1,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,1,1,0,1,1],
                [1,1,0,0,0,0,1,1,1,1],
                [1,1,1,0,0,0,1,1,1,1],
                [0,1,1,1,1,1,1,1,1,0],
                [0,0,1,1,1,1,1,1,1,1],
                [0,0,0,0,0,0,0,1,1,1]
            ],
            U: [
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,1,0,0,0,0,1,1,1],
                [0,1,1,1,1,1,1,1,1,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0,0]
            ],
            C: [
                [0,0,1,1,1,1,1,1,0,0],
                [0,1,1,1,1,1,1,1,1,0],
                [1,1,1,0,0,0,0,1,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,1,0,0,0,0,1,1,1],
                [0,1,1,1,1,1,1,1,1,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0,0]
            ],
            K: [
                [1,1,0,0,0,0,0,1,1,1],
                [1,1,0,0,0,0,1,1,1,0],
                [1,1,0,0,0,1,1,1,0,0],
                [1,1,0,0,1,1,1,0,0,0],
                [1,1,0,1,1,1,0,0,0,0],
                [1,1,1,1,1,0,0,0,0,0],
                [1,1,1,1,1,0,0,0,0,0],
                [1,1,0,1,1,1,0,0,0,0],
                [1,1,0,0,1,1,1,0,0,0],
                [1,1,0,0,0,1,1,1,0,0],
                [1,1,0,0,0,0,1,1,1,0],
                [1,1,0,0,0,0,0,1,1,1]
            ],
            S: [
                [0,0,1,1,1,1,1,1,0,0],
                [0,1,1,1,1,1,1,1,1,0],
                [1,1,1,0,0,0,0,1,1,1],
                [1,1,0,0,0,0,0,0,0,0],
                [1,1,1,0,0,0,0,0,0,0],
                [0,1,1,1,1,1,1,0,0,0],
                [0,0,0,1,1,1,1,1,1,0],
                [0,0,0,0,0,0,0,1,1,1],
                [1,1,0,0,0,0,0,0,1,1],
                [1,1,1,0,0,0,0,1,1,1],
                [0,1,1,1,1,1,1,1,1,0],
                [0,0,1,1,1,1,1,1,0,0]
            ]
        };

        const word = characterName.toUpperCase().split('');
        const letterWidth = 10 * p + p * 3;
        const totalWidth = word.length * letterWidth - p * 3;
        let startX = centerX - totalWidth / 2;

        // Color schemes based on character
        let fireColors;
        if (characterName === 'Violet') {
            fireColors = ['#FF88DD', '#FF66CC', '#FF44BB', '#EE33AA', '#DD2299', '#CC1188', '#BB0077', '#AA0066', '#990055', '#880044', '#770033', '#660022'];
        } else if (characterName === 'Fang') {
            fireColors = ['#00FFFF', '#00EEFF', '#00DDFF', '#00CCFF', '#00AAFF', '#0088FF', '#0066FF', '#0044FF', '#0022FF', '#0000FF', '#0000DD', '#0000AA'];
        } else if (characterName === 'Quacks') {
            fireColors = ['#FFD700', '#FFC125', '#FFB000', '#FFA000', '#FF8C00', '#FF7700', '#EE6600', '#DD5500', '#CC4400', '#BB3300', '#AA2200', '#991100'];
        } else {
            fireColors = ['#FFDD44', '#FFCC33', '#FFAA22', '#FF8811', '#FF6600', '#FF4400', '#EE3300', '#DD2200', '#CC1100', '#BB0000', '#AA0000', '#990000'];
        }

        word.forEach((char, i) => {
            const letter = letters[char];
            if (!letter) return;
            const letterBounce = Math.sin(timer * 3 + i * 0.6) * 6;

            letter.forEach((row, rowIdx) => {
                row.forEach((pixel, colIdx) => {
                    if (pixel) {
                        const colorIdx = Math.min(rowIdx, fireColors.length - 1);

                        // Main pixel
                        ctx.fillStyle = fireColors[colorIdx];
                        ctx.fillRect(
                            startX + colIdx * p,
                            y + rowIdx * p + letterBounce,
                            p,
                            p
                        );

                        // Glow effect for top pixels
                        if (rowIdx < 3) {
                            ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
                            ctx.fillRect(
                                startX + colIdx * p - 1,
                                y + rowIdx * p + letterBounce - 1,
                                p + 2,
                                p + 2
                            );
                        }
                    }
                });
            });
            startX += letterWidth;
        });

        // Draw decorative fire wisps above letters
        this.drawTitleFireWisps(ctx, centerX, y - 10, timer);
    }

    drawPixelSubtitle(ctx, centerX, y, timer, text = 'THE FIRE PIGEON', characterName = 'Gary') {
        const p = 2;

        const chars = {
            T: [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
            H: [[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
            E: [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,1,1,1]],
            F: [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0]],
            I: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
            R: [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,1,0],[1,0,0,0,1]],
            P: [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0]],
            G: [[0,1,1,1,0],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[0,1,1,1,0]],
            O: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
            N: [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1]],
            L: [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
            A: [[0,1,1,1,0],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
            S: [[0,1,1,1,1],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
            B: [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0]],
            C: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
            K: [[1,0,0,0,1],[1,0,0,1,0],[1,1,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
            U: [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
            D: [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
            ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
        };

        let subtitleColor;
        if (characterName === 'Violet') {
            subtitleColor = '#FF88DD';
        } else if (characterName === 'Fang') {
            subtitleColor = '#00FFFF';
        } else if (characterName === 'Quacks') {
            subtitleColor = '#FFD700';
        } else {
            subtitleColor = '#FFCC66';
        }
        let totalWidth = 0;
        for (const c of text) {
            totalWidth += (chars[c] ? chars[c][0].length : 3) * p + p * 2;
        }

        let startX = centerX - totalWidth / 2;

        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            const letter = chars[c];
            if (!letter) continue;

            const bounce = Math.sin(timer * 5 + i * 0.3) * 2;

            for (let row = 0; row < letter.length; row++) {
                for (let col = 0; col < letter[row].length; col++) {
                    if (letter[row][col]) {
                        ctx.fillStyle = subtitleColor;
                        ctx.fillRect(
                            startX + col * p,
                            y + row * p + bounce,
                            p,
                            p
                        );
                    }
                }
            }
            startX += letter[0].length * p + p * 2;
        }
    }

    drawTitleFireWisps(ctx, centerX, y, timer) {
        const wisps = [
            { x: -80, delay: 0 },
            { x: -30, delay: 0.5 },
            { x: 20, delay: 1 },
            { x: 70, delay: 1.5 },
        ];

        wisps.forEach(wisp => {
            const wispY = y - Math.sin(timer * 4 + wisp.delay) * 15 - 10;
            const alpha = (Math.sin(timer * 3 + wisp.delay) + 1) / 2 * 0.7 + 0.3;

            ctx.fillStyle = `rgba(255, 150, 50, ${alpha})`;
            ctx.beginPath();
            ctx.arc(centerX + wisp.x, wispY, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 220, 100, ${alpha})`;
            ctx.beginPath();
            ctx.arc(centerX + wisp.x, wispY, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawSplashGary(x, y, timer) {
        const ctx = this.ctx;
        const p = 4; // pixel size - matching game style

        // Gary breathing animation
        const breathe = Math.sin(timer * 2) * 2;

        // Colors - same as in-game Player
        const bodyMain = '#8899AA';
        const bodyLight = '#AAB8C8';
        const bodyDark = '#667788';
        const bodyDarker = '#556677';
        const beakOrange = '#FF8844';
        const beakDark = '#DD6622';
        const eyeWhite = '#FFFFFF';
        const eyeBlack = '#222222';
        const legColor = '#DD7755';
        const legDark = '#BB5533';
        const wingColor = '#778899';
        const wingDark = '#556677';

        const bx = x; // base x
        const by = y + breathe; // base y with breathing

        // Legs (behind body) - animated walking pose
        const legAnim = Math.sin(timer * 6) * 2;
        // Back leg
        ctx.fillStyle = legDark;
        ctx.fillRect(bx + 8 * p, by + 52 - legAnim, p * 4, p * 6);
        ctx.fillRect(bx + 6 * p, by + 58 - legAnim, p * 6, p * 2);
        // Front leg
        ctx.fillStyle = legColor;
        ctx.fillRect(bx + 18 * p, by + 52 + legAnim, p * 4, p * 6);
        ctx.fillRect(bx + 16 * p, by + 58 + legAnim, p * 6, p * 2);

        // Tail feathers
        ctx.fillStyle = bodyDarker;
        ctx.fillRect(bx - 4 * p, by + 32, p * 6, p * 4);
        ctx.fillStyle = bodyDark;
        ctx.fillRect(bx - 6 * p, by + 36, p * 8, p * 4);
        ctx.fillRect(bx - 4 * p, by + 40, p * 6, p * 2);

        // Body - slimmer oval shape like in-game
        ctx.fillStyle = bodyLight;
        ctx.fillRect(bx + 4 * p, by + 20, p * 16, p * 2);
        ctx.fillRect(bx + 2 * p, by + 24, p * 20, p * 4);
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx, by + 32, p * 4, p * 8);
        ctx.fillRect(bx + 2 * p, by + 32, p * 20, p * 8);
        ctx.fillRect(bx + 22 * p, by + 32, p * 6, p * 8);
        ctx.fillStyle = bodyDark;
        ctx.fillRect(bx + 2 * p, by + 44, p * 20, p * 4);
        ctx.fillRect(bx + 4 * p, by + 48, p * 12, p * 4);

        // Chest highlight
        ctx.fillStyle = bodyLight;
        ctx.fillRect(bx + 18 * p, by + 28, p * 4, p * 8);

        // Wing
        const wingYOffset = Math.sin(timer * 3) * 2;
        ctx.fillStyle = wingColor;
        ctx.fillRect(bx + 2 * p, by + 28 + wingYOffset, p * 12, p * 4);
        ctx.fillRect(bx, by + 32 + wingYOffset, p * 16, p * 6);
        ctx.fillStyle = wingDark;
        ctx.fillRect(bx, by + 38 + wingYOffset, p * 12, p * 4);
        ctx.fillRect(bx - p, by + 36 + wingYOffset, p * 2, p * 4);

        // Head - rounder, cuter
        ctx.fillStyle = bodyLight;
        ctx.fillRect(bx + 20 * p, by + 4, p * 12, p * 4);
        ctx.fillStyle = bodyLight;
        ctx.fillRect(bx + 18 * p, by + 8, p * 20, p * 6);
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx + 18 * p, by + 14, p * 20, p * 6);
        ctx.fillRect(bx + 20 * p, by + 20, p * 12, p * 4);

        // Cute cheek highlight
        ctx.fillStyle = '#BBCCDD';
        ctx.fillRect(bx + 30 * p, by + 12, p * 4, p * 4);

        // Eye
        ctx.fillStyle = eyeWhite;
        ctx.fillRect(bx + 24 * p, by + 8, p * 6, p * 6);
        ctx.fillStyle = eyeBlack;
        ctx.fillRect(bx + 27 * p, by + 8, p * 4, p * 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(bx + 27 * p, by + 8, p * 2, p * 2);

        // Beak - open with fire!
        ctx.fillStyle = beakOrange;
        ctx.fillRect(bx + 38 * p, by + 10, p * 8, p * 4);
        ctx.fillRect(bx + 46 * p, by + 10, p * 4, p * 2);
        ctx.fillStyle = beakDark;
        ctx.fillRect(bx + 38 * p, by + 18, p * 6, p * 4);
        // Fire glow in mouth
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(bx + 38 * p, by + 14, p * 4, p * 4);

        // Fire breath!
        this.drawFireBreath(bx + 48 * p, by + 8, timer);

        // Cool sunglasses over the eye
        ctx.fillStyle = '#111111';
        ctx.fillRect(bx + 22 * p, by + 6, p * 14, p * 2);
        ctx.fillRect(bx + 22 * p, by + 8, p * 10, p * 6);
        ctx.fillStyle = '#222244';
        ctx.fillRect(bx + 24 * p, by + 10, p * 6, p * 3);
        // Glasses shine
        ctx.fillStyle = '#4444AA';
        ctx.fillRect(bx + 24 * p, by + 10, p * 2, p);
    }

    drawSplashViolet(x, y, timer) {
        const ctx = this.ctx;
        const p = 4;

        // Violet breathing/hover animation
        const hover = Math.sin(timer * 3) * 5;
        const wingFrame = Math.floor(timer * 8) % 4;
        const wingOffsets = [0, -3, -5, -3];
        const wingY = wingOffsets[wingFrame] * p;

        const bx = x;
        const by = y + hover;

        // Colors
        const bodyDark = '#2A1A3A';
        const bodyMain = '#4A2A5A';
        const bodyLight = '#6A4A7A';
        const wingMembrane = '#3A2040';
        const wingBone = '#5A3A6A';
        const earPink = '#AA6688';
        const eyeColor = '#FF4488';

        // Left wing (behind body)
        ctx.fillStyle = wingMembrane;
        ctx.fillRect(bx - 8 * p, by + 16 + wingY, p * 14, p * 10);
        ctx.fillRect(bx - 10 * p, by + 20 + wingY, p * 6, p * 8);

        // Wing bones - left
        ctx.fillStyle = wingBone;
        ctx.fillRect(bx + 4 * p, by + 12 + wingY, p * 2, p * 12);
        ctx.fillRect(bx, by + 16 + wingY, p * 2, p * 10);
        ctx.fillRect(bx - 4 * p, by + 18 + wingY, p * 2, p * 8);
        ctx.fillRect(bx - 8 * p, by + 20 + wingY, p * 2, p * 6);

        // Body
        ctx.fillStyle = bodyLight;
        ctx.fillRect(bx + 10 * p, by + 8, p * 16, p * 10);
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx + 8 * p, by + 16, p * 20, p * 16);
        ctx.fillStyle = bodyDark;
        ctx.fillRect(bx + 12 * p, by + 28, p * 12, p * 8);

        // Right wing (in front)
        ctx.fillStyle = wingMembrane;
        ctx.fillRect(bx + 30 * p, by + 16 + wingY, p * 14, p * 10);
        ctx.fillRect(bx + 40 * p, by + 20 + wingY, p * 6, p * 8);

        // Wing bones - right
        ctx.fillStyle = wingBone;
        ctx.fillRect(bx + 30 * p, by + 12 + wingY, p * 2, p * 12);
        ctx.fillRect(bx + 34 * p, by + 16 + wingY, p * 2, p * 10);
        ctx.fillRect(bx + 38 * p, by + 18 + wingY, p * 2, p * 8);
        ctx.fillRect(bx + 42 * p, by + 20 + wingY, p * 2, p * 6);

        // Ears
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx + 10 * p, by, p * 6, p * 10);
        ctx.fillRect(bx + 20 * p, by, p * 6, p * 10);
        ctx.fillStyle = earPink;
        ctx.fillRect(bx + 12 * p, by + 2 * p, p * 3, p * 6);
        ctx.fillRect(bx + 22 * p, by + 2 * p, p * 3, p * 6);

        // Eyes (glowing)
        ctx.fillStyle = eyeColor;
        ctx.fillRect(bx + 11 * p, by + 16, p * 5, p * 5);
        ctx.fillRect(bx + 20 * p, by + 16, p * 5, p * 5);
        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(bx + 11 * p, by + 16, p * 2, p * 2);
        ctx.fillRect(bx + 20 * p, by + 16, p * 2, p * 2);

        // Nose
        ctx.fillStyle = earPink;
        ctx.fillRect(bx + 14 * p, by + 22, p * 8, p * 4);

        // Mouth with fangs
        ctx.fillStyle = '#440022';
        ctx.fillRect(bx + 13 * p, by + 28, p * 10, p * 6);
        // Energy in mouth
        ctx.fillStyle = eyeColor;
        ctx.fillRect(bx + 15 * p, by + 30, p * 6, p * 3);
        // Fangs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(bx + 14 * p, by + 26, p * 2, p * 4);
        ctx.fillRect(bx + 20 * p, by + 26, p * 2, p * 4);

        // Feet
        ctx.fillStyle = bodyDark;
        ctx.fillRect(bx + 12 * p, by + 34, p * 4, p * 4);
        ctx.fillRect(bx + 20 * p, by + 34, p * 4, p * 4);

        // Laser beams!
        this.drawLaserBeam(bx + 28 * p, by + 28, timer);

        // Cool bat accessories - small crown
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(bx + 14 * p, by - 6, p * 8, p * 4);
        ctx.fillRect(bx + 14 * p, by - 10, p * 2, p * 4);
        ctx.fillRect(bx + 17 * p, by - 12, p * 2, p * 6);
        ctx.fillRect(bx + 20 * p, by - 10, p * 2, p * 4);

        // Crown gems
        ctx.fillStyle = '#FF44AA';
        ctx.fillRect(bx + 17 * p, by - 10, p * 2, p * 2);
    }

    drawSplashFang(x, y, timer) {
        const ctx = this.ctx;
        const p = 3; // Finer pixels for more detail

        // Fang hovering/flying animation
        const hover = Math.sin(timer * 4) * 4;
        const wingFrame = Math.floor(timer * 6) % 4;
        const wingOffsets = [0, -4, -6, -4];
        const wingY = wingOffsets[wingFrame] * p;

        const bx = x;
        const by = y + hover;

        // Colors - Peregrine falcon
        const bodyDark = '#2C2416';
        const bodyMain = '#4A3728';
        const bodyLight = '#6B5344';
        const wingDark = '#1A1510';
        const wingMain = '#3A2A1E';
        const cream = '#FFFDD0';
        const white = '#F5F5DC';
        const eyeGold = '#FFD700';
        const beak = '#4A4A4A';
        const talon = '#3A3A3A';

        // === TAIL ===
        ctx.fillStyle = bodyDark;
        ctx.fillRect(bx - 2 * p, by + 40 * p, 10 * p, 4 * p);
        ctx.fillStyle = wingMain;
        ctx.fillRect(bx - 4 * p, by + 44 * p, 12 * p, 6 * p);
        // Tail stripes
        ctx.fillStyle = wingDark;
        ctx.fillRect(bx - 2 * p, by + 45 * p, 2 * p, 4 * p);
        ctx.fillRect(bx + 2 * p, by + 45 * p, 2 * p, 4 * p);

        // === LEFT WING (behind) ===
        ctx.fillStyle = wingMain;
        ctx.fillRect(bx - 10 * p, by + 14 * p + wingY, 12 * p, 18 * p);
        ctx.fillStyle = wingDark;
        ctx.fillRect(bx - 14 * p, by + 20 * p + wingY, 8 * p, 14 * p);
        // Wing bars
        ctx.fillRect(bx - 8 * p, by + 22 * p + wingY, 10 * p, 2 * p);
        ctx.fillRect(bx - 6 * p, by + 28 * p + wingY, 8 * p, 2 * p);

        // === LEGS ===
        ctx.fillStyle = bodyLight;
        ctx.fillRect(bx + 8 * p, by + 38 * p, 4 * p, 10 * p);
        ctx.fillRect(bx + 18 * p, by + 38 * p, 4 * p, 10 * p);
        // Talons
        ctx.fillStyle = talon;
        ctx.fillRect(bx + 6 * p, by + 46 * p, 3 * p, 4 * p);
        ctx.fillRect(bx + 10 * p, by + 46 * p, 3 * p, 4 * p);
        ctx.fillRect(bx + 16 * p, by + 46 * p, 3 * p, 4 * p);
        ctx.fillRect(bx + 20 * p, by + 46 * p, 3 * p, 4 * p);

        // === BODY ===
        ctx.fillStyle = bodyLight;
        ctx.fillRect(bx + 4 * p, by + 16 * p, 22 * p, 6 * p);
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx + 2 * p, by + 22 * p, 26 * p, 10 * p);
        ctx.fillStyle = bodyDark;
        ctx.fillRect(bx + 4 * p, by + 32 * p, 22 * p, 8 * p);

        // Cream chest
        ctx.fillStyle = cream;
        ctx.fillRect(bx + 10 * p, by + 20 * p, 12 * p, 16 * p);
        // Chest spots
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx + 12 * p, by + 24 * p, 2 * p, 2 * p);
        ctx.fillRect(bx + 17 * p, by + 26 * p, 2 * p, 2 * p);
        ctx.fillRect(bx + 14 * p, by + 30 * p, 2 * p, 2 * p);
        ctx.fillRect(bx + 19 * p, by + 32 * p, 2 * p, 2 * p);

        // === RIGHT WING (in front) ===
        ctx.fillStyle = wingMain;
        ctx.fillRect(bx + 28 * p, by + 14 * p + wingY, 12 * p, 18 * p);
        ctx.fillStyle = wingDark;
        ctx.fillRect(bx + 36 * p, by + 20 * p + wingY, 8 * p, 14 * p);
        // Wing bars
        ctx.fillRect(bx + 28 * p, by + 22 * p + wingY, 10 * p, 2 * p);
        ctx.fillRect(bx + 28 * p, by + 28 * p + wingY, 8 * p, 2 * p);

        // === HEAD ===
        // Dark crown/cap
        ctx.fillStyle = wingDark;
        ctx.fillRect(bx + 14 * p, by + 2 * p, 10 * p, 4 * p);
        ctx.fillStyle = bodyDark;
        ctx.fillRect(bx + 12 * p, by + 4 * p, 14 * p, 4 * p);

        // Main head
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx + 10 * p, by + 8 * p, 18 * p, 8 * p);

        // White cheek/throat
        ctx.fillStyle = white;
        ctx.fillRect(bx + 12 * p, by + 10 * p, 10 * p, 6 * p);

        // Malar stripe (dark cheek stripe - falcon's signature)
        ctx.fillStyle = wingDark;
        ctx.fillRect(bx + 24 * p, by + 8 * p, 4 * p, 10 * p);

        // Eye - fierce and golden
        ctx.fillStyle = '#000000';
        ctx.fillRect(bx + 16 * p, by + 6 * p, 6 * p, 5 * p);
        ctx.fillStyle = eyeGold;
        ctx.fillRect(bx + 17 * p, by + 7 * p, 4 * p, 3 * p);
        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(bx + 17 * p, by + 7 * p, 2 * p, 2 * p);
        // Eye ring
        ctx.fillStyle = eyeGold;
        ctx.fillRect(bx + 15 * p, by + 7 * p, 2 * p, 3 * p);

        // Beak - hooked raptor beak
        ctx.fillStyle = beak;
        ctx.fillRect(bx + 26 * p, by + 12 * p, 8 * p, 4 * p);
        ctx.fillRect(bx + 32 * p, by + 14 * p, 4 * p, 3 * p);
        // Beak hook
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(bx + 34 * p, by + 16 * p, 2 * p, 2 * p);
        // Cere (yellow above beak)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(bx + 26 * p, by + 10 * p, 4 * p, 3 * p);

        // Lightning effects around talons
        this.drawSplashTalonLightning(ctx, bx, by, timer, p);

        // Cool aviator goggles
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(bx + 13 * p, by + 5 * p, 14 * p, 3 * p);
        ctx.fillRect(bx + 14 * p, by + 6 * p, 10 * p, 5 * p);
        ctx.fillStyle = '#00AAFF';
        ctx.fillRect(bx + 15 * p, by + 7 * p, 7 * p, 3 * p);
        // Goggle shine
        ctx.fillStyle = '#66DDFF';
        ctx.fillRect(bx + 15 * p, by + 7 * p, 3 * p, 1 * p);
    }

    drawSplashTalonLightning(ctx, bx, by, timer, p) {
        // Lightning crackling around talons
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;

        for (let i = 0; i < 4; i++) {
            const startX = bx + (8 + i * 5) * p;
            const startY = by + 48 * p;
            const flicker = Math.sin(timer * 15 + i * 2);

            if (flicker > 0) {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(startX + 3 * p, startY + 6 * p);
                ctx.lineTo(startX + 1 * p, startY + 6 * p);
                ctx.lineTo(startX + 5 * p, startY + 14 * p);
                ctx.stroke();

                // White core
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 2;
            }
        }

        // Sparks
        for (let i = 0; i < 5; i++) {
            const sparkX = bx + (6 + Math.random() * 18) * p;
            const sparkY = by + (48 + Math.random() * 12) * p;
            const alpha = (Math.sin(timer * 20 + i * 3) + 1) / 2;
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.fillRect(sparkX, sparkY, 2, 2);
        }
    }

    drawSplashLightning(x, y, timer) {
        const ctx = this.ctx;

        // Multiple lightning bolts
        for (let bolt = 0; bolt < 3; bolt++) {
            const boltX = x + bolt * 40;
            const boltDelay = bolt * 0.3;
            const flash = Math.sin(timer * 8 + boltDelay);

            if (flash > 0.3) {
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#00FFFF';
                ctx.shadowBlur = 15;

                ctx.beginPath();
                let px = boltX;
                let py = y;
                ctx.moveTo(px, py);

                for (let i = 0; i < 5; i++) {
                    px += (Math.random() - 0.3) * 30;
                    py += 20 + Math.random() * 15;
                    ctx.lineTo(px, py);
                }
                ctx.stroke();

                // Bright core
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.shadowBlur = 0;
            }
        }

        // Ambient sparks
        for (let i = 0; i < 8; i++) {
            const sparkX = x + Math.sin(timer * 10 + i * 1.5) * 60 + 30;
            const sparkY = y + 40 + Math.cos(timer * 8 + i * 2) * 30;
            const alpha = (Math.sin(timer * 12 + i) + 1) / 2 * 0.8;

            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.fillRect(sparkX, sparkY, 4, 4);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(sparkX + 1, sparkY + 1, 2, 2);
        }
    }

    drawLaserBeam(x, y, timer) {
        const ctx = this.ctx;
        const p = 5;

        const beams = [
            { xOff: 0, yOff: 0, size: 4, color: '#FFAADD' },
            { xOff: 5, yOff: -1, size: 5, color: '#FF88CC' },
            { xOff: 11, yOff: 1, size: 6, color: '#FF44AA' },
            { xOff: 18, yOff: -1, size: 5, color: '#DD2288' },
            { xOff: 24, yOff: 2, size: 4, color: '#AA1166' },
            { xOff: 29, yOff: 0, size: 3, color: '#880044' },
        ];

        beams.forEach((beam, i) => {
            const flicker = Math.sin(timer * 20 + i * 2) * 2;
            ctx.fillStyle = beam.color;
            ctx.fillRect(
                x + beam.xOff * p,
                y + (beam.yOff + flicker) * p / 2,
                beam.size * p,
                beam.size * p / 2
            );
        });
    }

    drawFireBreath(x, y, timer) {
        const ctx = this.ctx;
        const p = 5;

        const flames = [
            { xOff: 0, yOff: 0, size: 4, color: '#FFEE66' },
            { xOff: 4, yOff: -2, size: 5, color: '#FFAA33' },
            { xOff: 9, yOff: 1, size: 6, color: '#FF7711' },
            { xOff: 15, yOff: -1, size: 5, color: '#FF4400' },
            { xOff: 20, yOff: 2, size: 4, color: '#DD2200' },
            { xOff: 24, yOff: 0, size: 3, color: '#AA1100' },
        ];

        flames.forEach((flame, i) => {
            const flicker = Math.sin(timer * 15 + i * 2) * 3;
            ctx.fillStyle = flame.color;
            ctx.fillRect(
                x + flame.xOff * p,
                y + (flame.yOff + flicker) * p / 2,
                flame.size * p,
                flame.size * p
            );
        });
    }

    drawSplashFire(x, y, timer) {
        const ctx = this.ctx;
        const p = 4;

        for (let i = 0; i < 5; i++) {
            const flicker = Math.sin(timer * 10 + i) * 5;
            const yOff = Math.sin(timer * 8 + i * 0.7) * 10;
            const colors = ['#FF4400', '#FF6600', '#FF8800', '#FFAA00'];
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(
                x + i * p * 3 + flicker,
                y - i * p * 2 + yOff,
                p * 3,
                p * (5 - i)
            );
        }
    }

    drawSplashQuacks(x, y, timer) {
        const ctx = this.ctx;
        const p = 4; // pixel size

        // Breathing animation
        const breathe = Math.sin(timer * 2) * 2;
        const wingFlap = Math.sin(timer * 4) * 4;

        // White duck colors
        const bodyMain = '#FFFFFF';
        const bodyLight = '#FFFFFF';
        const bodyDark = '#DDDDDD';
        const wingColor = '#EEEEEE';
        const wingDark = '#CCCCCC';
        const billColor = '#FF8C00';
        const billDark = '#DD6600';

        const bx = x + 20; // Center adjustment for slimmer duck
        const by = y + breathe;

        // === TAIL (small cute tail) ===
        ctx.fillStyle = bodyDark;
        ctx.fillRect(bx - 2 * p, by + 12 * p, 3 * p, 2 * p);
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx - 3 * p, by + 10 * p, 2 * p, 3 * p);

        // === LEFT WING (behind) ===
        ctx.fillStyle = wingColor;
        ctx.fillRect(bx + 1 * p, by + 8 * p + wingFlap, 6 * p, 2 * p);
        ctx.fillStyle = wingDark;
        ctx.fillRect(bx, by + 10 * p + wingFlap, 7 * p, 4 * p);

        // === BODY (slimmer) ===
        ctx.fillStyle = bodyLight;
        ctx.fillRect(bx + 4 * p, by + 6 * p, 8 * p, 3 * p);
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx + 2 * p, by + 9 * p, 10 * p, 5 * p);
        ctx.fillStyle = bodyDark;
        ctx.fillRect(bx + 4 * p, by + 14 * p, 8 * p, 3 * p);

        // === RIGHT WING (in front) ===
        ctx.fillStyle = wingColor;
        ctx.fillRect(bx + 8 * p, by + 8 * p + wingFlap, 6 * p, 2 * p);
        ctx.fillStyle = wingDark;
        ctx.fillRect(bx + 7 * p, by + 10 * p + wingFlap, 7 * p, 4 * p);

        // === LEGS (slim orange) ===
        const legAnim = Math.sin(timer * 6) * 2;
        ctx.fillStyle = billColor;
        ctx.fillRect(bx + 5 * p, by + 17 * p, 1 * p, 3 * p - legAnim);
        ctx.fillRect(bx + 3 * p, by + 19 * p - legAnim, 4 * p, 1 * p);
        ctx.fillRect(bx + 10 * p, by + 17 * p, 1 * p, 3 * p + legAnim);
        ctx.fillRect(bx + 8 * p, by + 19 * p + legAnim, 4 * p, 1 * p);

        // === HEAD (white, rounder) ===
        ctx.fillStyle = bodyMain;
        ctx.fillRect(bx + 12 * p, by + 2 * p, 6 * p, 3 * p);
        ctx.fillRect(bx + 10 * p, by + 4 * p, 8 * p, 5 * p);
        ctx.fillRect(bx + 12 * p, by + 9 * p, 4 * p, 2 * p);

        // Eye
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(bx + 14 * p, by + 4 * p, 2 * p, 2 * p);
        ctx.fillStyle = '#111111';
        ctx.fillRect(bx + 14 * p, by + 4 * p, 1 * p, 1 * p);
        ctx.fillRect(bx + 15 * p, by + 5 * p, 1 * p, 1 * p);

        // === BILL (orange, cute) ===
        const quackAnim = Math.sin(timer * 8) > 0.7 ? 2 : 0;
        // Upper bill
        ctx.fillStyle = billColor;
        ctx.fillRect(bx + 18 * p, by + 5 * p, 4 * p, 2 * p);
        // Lower bill (drops when quacking)
        ctx.fillStyle = billDark;
        ctx.fillRect(bx + 18 * p, by + 7 * p + quackAnim, 3 * p, 1 * p);
    }

    drawSplashFeathers(x, y, timer) {
        const ctx = this.ctx;

        // Multiple feathers floating/tracking around
        for (let i = 0; i < 5; i++) {
            const featherDelay = i * 0.5;
            const featherX = x + Math.sin(timer * 3 + featherDelay) * 40 + i * 15;
            const featherY = y + Math.cos(timer * 2.5 + featherDelay) * 25;
            const rotation = Math.sin(timer * 4 + featherDelay) * 0.5;
            const alpha = (Math.sin(timer * 2 + i) + 1) / 2 * 0.5 + 0.5;

            ctx.save();
            ctx.translate(featherX, featherY);
            ctx.rotate(rotation);
            ctx.globalAlpha = alpha;

            // Feather quill
            ctx.fillStyle = '#F5F5DC';
            ctx.fillRect(-6, -1, 14, 2);

            // Vane top
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(-4, -1);
            ctx.lineTo(4, -4);
            ctx.lineTo(6, -1);
            ctx.closePath();
            ctx.fill();

            // Vane bottom
            ctx.beginPath();
            ctx.moveTo(-4, 1);
            ctx.lineTo(4, 4);
            ctx.lineTo(6, 1);
            ctx.closePath();
            ctx.fill();

            // Glow
            ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(6, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.restore();
        }

        // Sparkle particles
        for (let i = 0; i < 8; i++) {
            const sparkX = x + Math.sin(timer * 5 + i * 1.2) * 50 + 30;
            const sparkY = y + Math.cos(timer * 4 + i * 1.5) * 30 + 10;
            const sparkAlpha = (Math.sin(timer * 8 + i) + 1) / 2 * 0.7;

            ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha})`;
            ctx.fillRect(sparkX, sparkY, 3, 3);
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkAlpha * 0.8})`;
            ctx.fillRect(sparkX - 1, sparkY - 1, 5, 5);
        }
    }

    renderChapterTransition(chapter, timer) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        // Fade in
        const alpha = Math.min(timer / 0.5, 1);

        // Chapter number
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFCC44';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Chapter ${chapter}`, w / 2, h / 2 - 60);

        // Boss name
        ctx.fillStyle = '#FF6644';
        ctx.font = 'bold 36px Arial';
        const bossName = chapter === 2 ? 'The Construction Worker' : 'The Giant Cat';
        ctx.fillText(bossName, w / 2, h / 2);

        // Flavor text
        ctx.fillStyle = '#AAAACC';
        ctx.font = '20px Arial';
        const flavor = chapter === 2 ? 'Watch out for the hammer!' : 'A new challenger approaches...';
        ctx.fillText(flavor, w / 2, h / 2 + 40);

        // Continue prompt (after delay)
        if (timer > 1) {
            const blinkAlpha = (Math.sin(timer * 4) + 1) / 2;
            ctx.globalAlpha = blinkAlpha;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Arial';
            ctx.fillText('Press SPACE to continue', w / 2, h / 2 + 120);
        }

        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }

    renderOverlay(text, color, score) {
        // Darken background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Main text
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.font = 'bold 64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(text, this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 30);

        // Score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.strokeText(`Final Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText(`Final Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);

        // Restart hint
        this.ctx.font = '24px Arial';
        this.ctx.strokeText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
        this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 80);

        this.ctx.textAlign = 'left';
    }
}
