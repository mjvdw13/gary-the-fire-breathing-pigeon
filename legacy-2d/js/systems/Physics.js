class Physics {
    constructor() {
        this.gravity = 1200;
        this.groundY = 0;
    }

    setGroundLevel(y) {
        this.groundY = y;
    }

    applyGravity(entity, deltaTime) {
        if (entity.affectedByGravity === false) return;

        entity.vy += this.gravity * deltaTime;
    }

    applyGroundCollision(entity) {
        const entityBottom = entity.y + entity.height;

        if (entityBottom >= this.groundY) {
            entity.y = this.groundY - entity.height;
            entity.vy = 0;

            if (entity.grounded !== undefined) {
                entity.grounded = true;
            }
            return true;
        }

        if (entity.grounded !== undefined && entity.vy > 0) {
            entity.grounded = false;
        }

        return false;
    }

    applyBounds(entity, canvasWidth) {
        if (entity.x < 0) {
            entity.x = 0;
            entity.vx = 0;
        }
        if (entity.x + entity.width > canvasWidth) {
            entity.x = canvasWidth - entity.width;
            entity.vx = 0;
        }
    }

    update(entity, deltaTime, canvasWidth) {
        this.applyGravity(entity, deltaTime);
        this.applyGroundCollision(entity);
        this.applyBounds(entity, canvasWidth);
    }
}
