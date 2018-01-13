import Box2D from './Box2D';
import Vector2D from './Vector2D';

class Stroke {
    constructor() {
        this.points = []; // these points are in world space

        this.boundingRectangle = new Box2D();
        this.isBoundingRectangleDirty = true;
    }


    pushPoint(q) {
        this.points.push(q);
        this.isBoundingRectangleDirty = true;
    }

    getBoundingRectangle() {
        if (this.isBoundingRectangleDirty) {
            this.boundingRectangle.clear();
            this.boundingRectangle.boundPoints(this.points);
            this.isBoundingRectangleDirty = false;
        }
        return this.boundingRectangle;
    }

    isContainedInRectangle(rectangle /* an instance of Box2D */) {
        return rectangle.containsBox(this.getBoundingRectangle());
    }

    isContainedInLassoPolygon(polygonPoints /* an array of Vector2D in world space */) {
        for (let i = 0; i < this.points.length; ++i) {
            if (!Vector2D.isPointInsidePolygon(this.points[i], polygonPoints)) {
                return false;
            }
        }
        return true;
    }

    translate(vector) {
        for (let i = 0; i < this.points.length; ++i) {
            const point = this.points[i];
            point.copy(Vector2D.sum(point, vector));
        }
        this.isBoundingRectangleDirty = true;
    }

    rotate(angle, center) {
        const sine = Math.sin(angle);
        const cosine = Math.cos(angle);
        this.points.forEach(point => {
            const deltaX = point.x - center.x;
            const deltaY = point.y - center.y;
            point.x = center.x + deltaX * cosine - deltaY * sine;
            point.y = center.y + deltaX * sine + deltaY * cosine;
        });
        this.isBoundingRectangleDirty = true;
    }

    draw(draw2) {
        draw2.drawPolyline(this.points);
    }

    copy(initial) {
        initial.points.forEach(point => {
            const newPoint = new Vector2D();
            newPoint.copy(point);
            this.pushPoint(newPoint);
        });
    }
}

export default Stroke;

