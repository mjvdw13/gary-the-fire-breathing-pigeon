(function() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = 800;
    canvas.height = 600;

    const game = new Game(canvas);

    let lastTime = 0;

    function gameLoop(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Cap delta time to prevent large jumps
        const cappedDelta = Math.min(deltaTime, 0.1);

        game.update(cappedDelta);
        game.render();

        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    requestAnimationFrame((time) => {
        lastTime = time;
        gameLoop(time);
    });
})();
