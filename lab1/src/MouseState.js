import Vector2D from './Vector2D';

class MouseState {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.mouseHitory = [];
    }

    getBoundaryOfDrag() {
        return [
            this.dragStartX,
            this.dragStartY,
            this.mouseX - this.dragStartX,
            this.mouseY - this.dragStartY
        ];
    }

    clear() {
        this.mouseHistory = [];
    }

    push(vector = new Vector2D(this.mouseX, this.mouseY)) {
        this.mouseHistory = [
            ...this.mouseHistory,
            vector
        ];
    }

    get length() {
        return this.mouseHistory.length;
    }
}

export default MouseState;
