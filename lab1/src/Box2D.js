import Vector2D from './Vector2D';

class Box2D {
    constructor(vectorMin, vectorMax) {
        this.isEmpty = true;
        this.min = new Vector2D();
        this.max = new Vector2D();
        if (vectorMin && vectorMax) {
            this.boundPoint(vectorMin);
            this.boundPoint(vectorMax);
        }
    }

    clear() {
        this.isEmpty = true;
        this.min = new Vector2D();
        this.max = new Vector2D();
    }

    center() {
        return Vector2D.average(this.min, this.max);
    }

    diagonal() {
        return Vector2D.diff(this.max, this.min);
    }

    width() {
        return this.max.x - this.min.x;
    }

    height() {
        return this.max.y - this.min.y;
    }

    containsPoint(point) {
        return !(
            this.isEmpty ||
            point.x < this.min.x ||
            point.x > this.max.x ||
            point.y < this.min.y ||
            point.y > this.max.y
        );
    }

    containsBox(box) {
        if (this.isEmpty) {
            return false;
        }
        if (box.isEmpty) {
            return true;
        }

        return this.min.x <= box.min.x &&
            box.max.x <= this.max.x &&
            this.min.y <= box.min.y &&
            box.max.y <= this.max.y;
    }

    boundPoint(vector) {
        if (this.isEmpty) {
            this.isEmpty = false;
            this.min.copy(vector);
            this.max.copy(vector);
        } else {
            if (vector.x < this.min.x) {
                this.min.x = vector.x;
            } else if (vector.x > this.max.x) {
                this.max.x = vector.x;
            }

            if (vector.y < this.min.y) {
                this.min.y = vector.y;
            } else if (vector.y > this.max.y) {
                this.max.y = vector.y;
            }
        }
    }

    boundPoints(points) {
        points.forEach(point => this.boundPoint(point));
    }

    boundBox(box) {
        if (!box.isEmpty) {
            this.boundPoint(box.min);
            this.boundPoint(box.max);
        }
    }
}

export default Box2D;
