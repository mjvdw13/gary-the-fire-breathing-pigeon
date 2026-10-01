class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;

        this.physics = new Physics();
        this.input = new Input();
        this.renderer = new Renderer(canvas);

        this.groundY = this.height - 50;
        this.physics.setGroundLevel(this.groundY);

        // Character selection
        this.characters = [
            { name: 'Gary', class: Player, color: '#8899AA', description: 'Fire-breathing pigeon', unlocked: true },
            { name: 'Violet', class: BatPlayer, color: '#6A4A7A', description: 'Laser-shooting bat', unlocked: true },
            { name: 'Fang', class: FalconPlayer, color: '#4A3728', description: 'Lightning falcon', unlocked: true },
            { name: 'Quacks', class: DuckPlayer, color: '#FFFFFF', description: 'Tracking feathers duck', unlocked: true }
        ];
        this.selectedCharacter = 0;

        // Mode selection
        this.modes = [
            { name: 'Story', description: 'Battle through 2 chapters', icon: 'boss' },
            { name: 'Endless', description: 'Survive infinite waves', icon: 'infinity' }
        ];
        this.selectedMode = 0;
        this.gameMode = 'story'; // 'story' or 'endless'

        // Game state
        this.state = 'charSelect'; // charSelect, modeSelect, splash, playing, chapterTransition, victory, gameover
        this.splashTimer = 0;
        this.chapter = 1;
        this.maxChapter = 2;
        this.chapterTransitionTimer = 0;
        this.score = 0;
        this.playerHealth = 5;
        this.maxPlayerHealth = 5;
        this.invincibleTimer = 0;
        this.invincibleDuration = 1.5;
        this.godMode = false;
        this.wasGodMode = false; // Track for restart

        // Entities
        this.player = null;
        this.projectiles = []; // Unified projectile array (fireballs or lasers)
        this.fireballs = this.projectiles; // Alias for compatibility
        this.enemies = [];
        this.clouds = [];
        this.particles = [];
        this.boss = null;

        // Bat companion (unlocked after beating boss with Gary)
        this.batUnlocked = false;
        this.bat = null;
        this.lasers = [];

        // Wave system
        this.wave = 1;
        this.enemiesPerWave = 3;
        this.waveTimer = 0;
        this.waveDelay = 2;
        this.waveStarted = false;

        // Create cloud platforms
        this.createClouds();

        // Don't spawn wave yet - wait for character select
    }

    createPlayer() {
        const CharClass = this.characters[this.selectedCharacter].class;
        this.player = new CharClass(100, this.groundY - 40);
    }

    createClouds() {
        // Create cloud platforms at various heights to reach drones
        // Lowest clouds are reachable from a jump on the ground
        const cloudPositions = [
            // Low clouds - reachable from ground (player jumps ~100px)
            { x: 80, y: 450 },
            { x: 300, y: 440 },
            { x: 520, y: 450 },
            // Mid clouds - reachable from low clouds
            { x: 180, y: 350 },
            { x: 420, y: 340 },
            { x: 650, y: 360 },
            // High clouds - reachable from mid clouds (where drones fly)
            { x: 100, y: 240 },
            { x: 350, y: 220 },
            { x: 580, y: 250 },
        ];

        for (const pos of cloudPositions) {
            this.clouds.push(new Cloud(pos.x, pos.y));
        }
    }

    spawnWave() {
        this.enemies = [];

        if (this.gameMode === 'endless') {
            // Endless mode - waves get progressively harder
            const enemyCount = Math.min(2 + this.wave, 10); // Cap at 10 enemies
            for (let i = 0; i < enemyCount; i++) {
                this.spawnRandomEnemy();
            }
        } else {
            // Story mode
            if (this.wave <= 3) {
                // Regular waves - chapter 2 has more enemies
                const baseCount = this.wave + 1;
                const chapterBonus = (this.chapter - 1) * 1;
                for (let i = 0; i < baseCount + chapterBonus; i++) {
                    this.spawnRandomEnemy();
                }
            } else {
                // Boss wave - depends on chapter
                if (this.chapter === 1) {
                    this.boss = new GiantCat(this.width - 150, 0, this.groundY);
                } else if (this.chapter === 2) {
                    this.boss = new ConstructionWorker(this.width - 150, 0, this.groundY);
                }
            }
        }

        this.waveStarted = true;
    }

    spawnRandomEnemy() {
        const types = ['drone', 'rat', 'ranger'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Determine spawn side based on player position to avoid spawning on top of player
        const playerCenterX = this.player.x + this.player.width / 2;
        const minSpawnDistance = 200; // Minimum distance from player

        let side;
        if (playerCenterX < this.width / 3) {
            // Player is on the left, spawn on the right
            side = 'right';
        } else if (playerCenterX > this.width * 2 / 3) {
            // Player is on the right, spawn on the left
            side = 'left';
        } else {
            // Player is in the middle, pick random side
            side = Math.random() < 0.5 ? 'left' : 'right';
        }

        // Spawn positions - further from edges to give player reaction time
        const leftSpawnX = 20;
        const rightSpawnX = this.width - 50;

        switch (type) {
            case 'drone':
                const droneY = 100 + Math.random() * 150;
                const drone = new Drone(side === 'left' ? leftSpawnX : rightSpawnX, droneY);
                drone.facingRight = side === 'left';
                drone.vx = side === 'left' ? drone.speed : -drone.speed;
                this.enemies.push(drone);
                break;
            case 'rat':
                const rat = new Rat(side === 'left' ? leftSpawnX : rightSpawnX, 0, this.groundY);
                rat.facingRight = side === 'left';
                rat.vx = side === 'left' ? rat.speed : -rat.speed;
                rat.moveDirection = side === 'left' ? 1 : -1;
                this.enemies.push(rat);
                break;
            case 'ranger':
                const ranger = new ParkRanger(side === 'left' ? leftSpawnX : rightSpawnX, 0, this.groundY);
                this.enemies.push(ranger);
                break;
        }
    }

    update(deltaTime) {
        // Character select screen
        if (this.state === 'charSelect') {
            if (this.input.isKeyJustPressed('KeyA') || this.input.isKeyJustPressed('ArrowLeft')) {
                this.selectedCharacter = (this.selectedCharacter - 1 + this.characters.length) % this.characters.length;
            }
            if (this.input.isKeyJustPressed('KeyD') || this.input.isKeyJustPressed('ArrowRight')) {
                this.selectedCharacter = (this.selectedCharacter + 1) % this.characters.length;
            }
            if (this.input.isKeyJustPressed('Space') || this.input.isKeyJustPressed('Enter')) {
                if (this.characters[this.selectedCharacter].unlocked) {
                    this.state = 'modeSelect';
                }
            }
            this.input.clearJustPressed();
            return;
        }

        // Mode select screen
        if (this.state === 'modeSelect') {
            if (this.input.isKeyJustPressed('KeyA') || this.input.isKeyJustPressed('ArrowLeft')) {
                this.selectedMode = (this.selectedMode - 1 + this.modes.length) % this.modes.length;
            }
            if (this.input.isKeyJustPressed('KeyD') || this.input.isKeyJustPressed('ArrowRight')) {
                this.selectedMode = (this.selectedMode + 1) % this.modes.length;
            }
            if (this.input.isKeyJustPressed('Space') || this.input.isKeyJustPressed('Enter')) {
                this.gameMode = this.modes[this.selectedMode].name.toLowerCase();
                this.createPlayer();
                this.state = 'splash';
                this.splashTimer = 0;
            }
            if (this.input.isKeyJustPressed('Escape')) {
                this.state = 'charSelect';
            }
            this.input.clearJustPressed();
            return;
        }

        // Splash screen
        if (this.state === 'splash') {
            this.splashTimer += deltaTime;
            if (this.input.isKeyJustPressed('Space')) {
                this.state = 'playing';
                this.spawnWave();
            }
            this.input.clearJustPressed();
            return;
        }

        // Chapter transition screen
        if (this.state === 'chapterTransition') {
            this.chapterTransitionTimer += deltaTime;
            if (this.input.isKeyJustPressed('Space') && this.chapterTransitionTimer > 1) {
                this.state = 'playing';
                this.wave = 1;
                this.waveStarted = false;
                this.waveTimer = 0;
                this.enemies = [];
                this.projectiles = [];
                this.fireballs = this.projectiles;
                this.particles = [];
                // Reset clouds
                for (const cloud of this.clouds) {
                    cloud.isVisible = true;
                    cloud.isFading = false;
                }
                this.spawnWave();
            }
            this.input.clearJustPressed();
            return;
        }

        if (this.state !== 'playing') {
            // Allow restart or return to character select
            if (this.input.isKeyJustPressed('Space')) {
                this.restart();
            }
            if (this.input.isKeyJustPressed('Escape')) {
                this.state = 'charSelect';
                this.selectedMode = 0;
            }
            this.input.clearJustPressed();
            return;
        }

        // Toggle god mode
        if (this.input.isKeyJustPressed('KeyG')) {
            this.godMode = !this.godMode;
        }

        // Update invincibility
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
        }

        // Update player
        this.player.update(deltaTime, this.input);
        this.physics.update(this.player, deltaTime, this.width);

        // Check cloud platform collisions
        this.checkCloudCollisions();

        // Update clouds
        for (const cloud of this.clouds) {
            cloud.update(deltaTime);
        }

        // Handle shooting
        if (this.input.isKeyJustPressed('Space')) {
            const projectile = this.player.shoot(this.godMode);
            if (projectile) {
                // Handle both single projectile and array of projectiles (duck shoots 3)
                if (Array.isArray(projectile)) {
                    this.projectiles.push(...projectile);
                } else {
                    this.projectiles.push(projectile);
                }
            }
        }

        // Update projectiles (fireballs/lasers)
        this.updateProjectiles(deltaTime);

        // Update enemies
        this.updateEnemies(deltaTime);

        // Update boss
        if (this.boss) {
            this.updateBoss(deltaTime);
        }

        // Update bat companion
        if (this.bat) {
            this.bat.update(deltaTime, this.player, this.lasers);
        }

        // Update lasers
        this.updateLasers(deltaTime);

        // Update particles
        this.updateParticles(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Check wave completion
        this.checkWaveCompletion();

        // Clear just-pressed keys at end of frame
        this.input.clearJustPressed();
    }

    checkCloudCollisions() {
        // Only check when player is falling
        if (this.player.vy <= 0) return;

        const playerBounds = this.player.getBounds();
        const playerBottom = playerBounds.bottom;
        const playerPrevBottom = playerBottom - this.player.vy * (1/60); // Approximate previous position

        for (const cloud of this.clouds) {
            if (!cloud.isVisible) continue;

            const cloudTop = cloud.y;
            const cloudBounds = cloud.getBounds();

            // Check if player is landing on cloud
            if (playerBounds.right > cloudBounds.left &&
                playerBounds.left < cloudBounds.right &&
                playerPrevBottom <= cloudTop &&
                playerBottom >= cloudTop) {

                // Land on cloud
                this.player.y = cloudTop - this.player.height;
                this.player.vy = 0;
                this.player.grounded = true;

                // Start cloud fade
                cloud.startFade();
                break;
            }
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            // Pass enemies and boss for tracking projectiles (feathers)
            if (projectile instanceof Feather) {
                projectile.update(deltaTime, this.enemies, this.boss);
            } else {
                projectile.update(deltaTime);
            }

            if (projectile.isOffScreen(this.width, this.height)) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this.player, this.width);

            if (!enemy.active) {
                this.score += enemy.points;
                // Spawn explosion particles at enemy center
                this.spawnExplosion(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2
                );
                this.enemies.splice(i, 1);
            }
        }
    }

    spawnExplosion(x, y) {
        this.particles.push(new Particle(x, y, 'poof'));
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (!this.particles[i].active) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateBoss(deltaTime) {
        this.boss.update(deltaTime, this.player, this.width);

        if (!this.boss.active) {
            this.score += this.boss.points;
            // Big explosion for boss!
            const bossX = this.boss.x;
            const bossY = this.boss.y;
            const bossW = this.boss.width;
            const bossH = this.boss.height;

            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.spawnExplosion(
                        bossX + Math.random() * bossW,
                        bossY + Math.random() * bossH
                    );
                }, i * 100);
            }
            this.spawnExplosion(bossX + bossW / 2, bossY + bossH / 2);

            // Unlock the bat companion after chapter 1
            if (this.chapter === 1 && !this.batUnlocked) {
                this.batUnlocked = true;
                this.bat = new Bat(this.player.x - 30, this.player.y - 40);
            }

            this.boss = null;

            if (this.chapter < this.maxChapter) {
                // Advance to next chapter
                this.chapter++;
                this.chapterTransitionTimer = 0;
                this.state = 'chapterTransition';
            } else {
                // Final victory
                this.state = 'victory';
            }
        }
    }

    updateLasers(deltaTime) {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.update(deltaTime);

            if (laser.isOffScreen(this.width, this.height)) {
                this.lasers.splice(i, 1);
                continue;
            }

            // Check laser vs enemies
            for (const enemy of this.enemies) {
                if (laser.collidesWith(enemy)) {
                    enemy.takeDamage(laser.damage);
                    this.lasers.splice(i, 1);
                    break;
                }
            }

            // Check laser vs boss
            if (this.boss && this.lasers[i]) {
                if (laser.collidesWith(this.boss)) {
                    this.boss.takeDamage(laser.damage);
                    this.lasers.splice(i, 1);
                }
            }
        }
    }

    checkCollisions() {
        // Player projectiles vs enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            // Check regular enemies
            for (const enemy of this.enemies) {
                if (projectile.collidesWith(enemy)) {
                    enemy.takeDamage(projectile.damage);
                    this.projectiles.splice(i, 1);
                    break;
                }
            }

            // Check boss
            if (this.boss && projectile.active !== false && this.projectiles[i]) {
                if (projectile.collidesWith(this.boss)) {
                    this.boss.takeDamage(projectile.damage);
                    this.projectiles.splice(i, 1);
                }
            }
        }

        // Player vs enemies (if not invincible)
        if (this.invincibleTimer <= 0) {
            for (const enemy of this.enemies) {
                if (this.player.collidesWith(enemy)) {
                    this.damagePlayer();
                    break;
                }

                // Check park ranger sweep attack
                if (enemy instanceof ParkRanger) {
                    const sweepBox = enemy.getSweepHitbox();
                    if (sweepBox) {
                        const playerBounds = this.player.getBounds();
                        if (playerBounds.left < sweepBox.x + sweepBox.width &&
                            playerBounds.right > sweepBox.x &&
                            playerBounds.top < sweepBox.y + sweepBox.height &&
                            playerBounds.bottom > sweepBox.y) {
                            this.damagePlayer();
                            break;
                        }
                    }
                }
            }

            // Player vs boss
            if (this.boss && this.player.collidesWith(this.boss)) {
                this.damagePlayer();
            }

            // Player vs boss projectiles (hairballs or nails)
            if (this.boss) {
                const bossProjectiles = this.boss.hairballs || this.boss.nails || [];
                for (const proj of bossProjectiles) {
                    if (this.player.collidesWith(proj)) {
                        this.damagePlayer();
                        proj.active = false;
                        break;
                    }
                }

                // Check construction worker hammer zone
                if (this.boss instanceof ConstructionWorker) {
                    const playerBounds = this.player.getBounds();
                    if (this.boss.isPlayerInHammerZone(playerBounds)) {
                        this.damagePlayer();
                    }
                }
            }
        }
    }

    damagePlayer() {
        // God mode prevents all damage
        if (this.godMode) return;

        this.playerHealth--;
        this.invincibleTimer = this.invincibleDuration;

        if (this.playerHealth <= 0) {
            this.state = 'gameover';
        }
    }

    checkWaveCompletion() {
        if (this.boss) return; // Boss wave in progress

        if (this.enemies.length === 0 && this.waveStarted) {
            this.waveStarted = false;
            this.waveTimer = 0;
        }

        if (!this.waveStarted) {
            this.waveTimer += 1/60; // Approximate, should use deltaTime
            if (this.waveTimer >= this.waveDelay) {
                this.wave++;

                // In endless mode, waves continue forever
                // In story mode, wave 4 triggers boss
                if (this.gameMode === 'endless' || this.wave <= 3) {
                    this.spawnWave();
                } else {
                    this.spawnWave(); // This will spawn the boss
                }
            }
        }
    }

    restart() {
        this.state = 'playing';
        this.score = 0;
        this.playerHealth = this.maxPlayerHealth;
        this.invincibleTimer = 0;
        this.chapter = 1;
        this.wave = 1;
        this.waveStarted = false;
        this.waveTimer = 0;
        this.createPlayer();
        this.projectiles = [];
        this.fireballs = this.projectiles;
        this.enemies = [];
        this.particles = [];
        this.lasers = [];
        this.boss = null;

        // Keep bat companion if unlocked and playing as Gary
        if (this.batUnlocked && this.selectedCharacter === 0 && !this.bat) {
            this.bat = new Bat(this.player.x - 30, this.player.y - 40);
        } else if (this.selectedCharacter !== 0) {
            // No bat companion when playing as bat
            this.bat = null;
        }

        // Reset clouds
        for (const cloud of this.clouds) {
            cloud.isVisible = true;
            cloud.isFading = false;
        }

        this.spawnWave();
    }

    render() {
        // Character select screen
        if (this.state === 'charSelect') {
            try {
                this.renderer.renderCharacterSelect(this.characters, this.selectedCharacter);
            } catch (e) {
                console.error('Error in renderCharacterSelect:', e);
                // Fallback - draw simple background
                this.renderer.ctx.fillStyle = '#1a0a2e';
                this.renderer.ctx.fillRect(0, 0, this.width, this.height);
                this.renderer.ctx.fillStyle = '#FFFFFF';
                this.renderer.ctx.font = '24px Arial';
                this.renderer.ctx.fillText('Error loading character select. Press SPACE.', 100, 300);
            }
            return;
        }

        // Mode select screen
        if (this.state === 'modeSelect') {
            try {
                this.renderer.renderModeSelect(this.modes, this.selectedMode);
            } catch (e) {
                console.error('Error in renderModeSelect:', e);
            }
            return;
        }

        // Splash screen
        if (this.state === 'splash') {
            try {
                this.renderer.renderSplashScreen(this.splashTimer, this.characters[this.selectedCharacter].name);
            } catch (e) {
                console.error('Error in renderSplashScreen:', e);
            }
            return;
        }

        // Chapter transition screen
        if (this.state === 'chapterTransition') {
            this.renderer.renderChapterTransition(this.chapter, this.chapterTransitionTimer);
            return;
        }

        this.renderer.clear();

        // Guard against null player
        if (!this.player) {
            return;
        }

        // Render clouds behind entities
        this.renderer.renderClouds(this.clouds);

        this.renderer.renderGround(this.groundY);

        // Render player (flash when invincible)
        if (this.invincibleTimer <= 0 || Math.floor(this.invincibleTimer * 10) % 2 === 0) {
            this.player.render(this.renderer.ctx, this.godMode);
        }

        this.renderer.renderEntities(this.projectiles);
        this.renderer.renderEntities(this.enemies);

        if (this.boss) {
            this.renderer.renderEntity(this.boss);
        }

        // Render bat companion
        if (this.bat) {
            this.bat.render(this.renderer.ctx);
        }

        // Render lasers
        for (const laser of this.lasers) {
            laser.render(this.renderer.ctx);
        }

        // Render particles on top
        for (const particle of this.particles) {
            particle.render(this.renderer.ctx);
        }

        this.renderer.renderGameUI(this);
    }
}
