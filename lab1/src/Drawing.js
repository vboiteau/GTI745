import Box2D from './Box2D';

class Drawing {
    constructor() {
        this.strokes = [];
        this.boundingRectangle = new Box2D();
        this.isBoundingRectangleDirty = true;
    }

    pushStroke(stroke) {
        this.strokes.push(stroke);
        this.isBoundingRectangleDirty = true;
    }

    clear() {
        this.strokes = [];
        this.boundingRectangle.clear();
    }

    getBoundingRectangle() {
        if (this.isBoundingRectangleDirty) {
            this.boundingRectangle.clear();
            this.strokes.forEach(stroke =>
                this.boundingRectangle.boundBox(stroke.getBoundingRectangle()));
            this.isBoundingRectangleDirty = false;
        }
        return this.boundingRectangle;
    }

    draw(draw2D) {
        this.strokes.forEach(stroke => stroke.draw(draw2D));
    }
}

export default Drawing;

