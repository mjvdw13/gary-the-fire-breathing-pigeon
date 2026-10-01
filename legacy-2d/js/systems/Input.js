class Input {
    constructor() {
        this.keys = {};
        this.keysJustPressed = {};

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(e) {
        if (!this.keys[e.code]) {
            this.keysJustPressed[e.code] = true;
        }
        this.keys[e.code] = true;

        // Prevent default for game keys
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    isKeyDown(code) {
        return this.keys[code] === true;
    }

    isKeyJustPressed(code) {
        return this.keysJustPressed[code] === true;
    }

    clearJustPressed() {
        this.keysJustPressed = {};
    }
}
