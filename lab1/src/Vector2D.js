class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    copy(other) {
        this.x = other.x;
        this.y = other.y;
    }

    negate() {
        return new Vector2D(-this.x, -this.y);
    }

    norm() {
        return Math.sqrt(this.normSquared());
    }

    normSquared() {
        return this.x * this.x + this.y * this.y;
    }

    normalize() {
        const norm = this.norm();
        if (norm) {
            const k = 1.0 / norm;
            return new Vector2D(k * this.x, k * this.y);
        }
        return new Vector2D();
    }

    static sum(vector1, vector2) {
        return new Vector2D(vector1.x + vector2.x, vector1.y + vector2.y);
    }

    static diff(vector1, vector2) {
        return new Vector2D(vector1.x - vector2.x, vector1.y - vector2.y);
    }

    static multiply(vector, factor) {
        return new Vector2D(vector.x * factor, vector.y * factor);
    }

    static dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }

    static average(vector1, vector2) {
        return new Vector2D((vector1.x + vector2.x) * 0.5, (vector1.y + vector2.y) * 0.5);
    }

    static centroidOfPoints(points) {
        const { x: centerX, y: centerY } = points.reduce((centroid, point) => Object.assign({
            x: centroid.x + point.x,
            y: centroid.y + point.y
        }), { x: 0, y: 0 });
        return new Vector2D(
            points.length ? centerX / points.length : centerX,
            points.length ? centerY / points.length : centerY
        );
    }

    static isPointInsidePolygon(queryPoint, polygon) {
        if (polygon.length < 3) {
            return false;
        }

        let returnValue = false;

        polygon.forEach((cursorPoint, i) => {
            const previousPoint = polygon[(i || polygon.length) - 1];

            if (
                (
                    (
                        cursorPoint.y < queryPoint.y &&
                        queryPoint.y < previousPoint.y
                    ) ||
                    (
                        previousPoint.y <= queryPoint.y &&
                        queryPoint.y < cursorPoint.y
                    )
                ) &&
                queryPoint.x < (
                    (previousPoint.x - cursorPoint.x) *
                    (queryPoint.y - cursorPoint.i) /
                    (previousPoint.y - cursorPoint.y) +
                    cursorPoint.x
                )
            ) {
                returnValue = !returnValue;
            }
        });

        return returnValue;
    }

    static convexHull(input) {
        const cross = (o, a, b) =>
            (a.x - o.x) *
            (b.y - o.y) -
            (a.y - o.y) *
            (b.y - o.x);

        const points = [...input];

        points.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

        const lower = points.reduce((lowerInProgress, point) => {
            while (
                lowerInProgress.length >= 2 &&
                cross(
                    lowerInProgress[lowerInProgress.length - 2],
                    lowerInProgress[lowerInProgress.length - 1],
                    point
                ) <= 0
            ) {
                lowerInProgress.pop();
            }
            return [...lowerInProgress, point];
        }, []);

        const upper = points.reduce((upperInProgress, point) => {
            while (
                upperInProgress.length >= 2 &&
                cross(
                    upperInProgress[upperInProgress.length - 2],
                    upperInProgress[upperInProgress.length - 1],
                    point
                ) <= 0) {
                upperInProgress.pop();
            }
            return [...upperInProgress, point];
        }, []);

        upper.pop();
        lower.pop();

        return [...lower, ...upper];
    }

    static computeExpandedPolygon(inputPoints, marginThickness) {
        if (!inputPoints.length) {
            return [];
        } else if (inputPoints.length === 1) {
            return Vector2D.computeExpandedPolygonForOnePoint(inputPoints[0], marginThickness);
        } else if (inputPoints.length === 2) {
            return Vector2D.computeExpandedPolygonForTwoPoint(inputPoints, marginThickness);
        }
        return Vector2D.computeExpandedPolygonForMultiPoints(inputPoints, marginThickness);
    }

    static computeExpandedPolygonForOnePoint(point, marginThickness) {
        return [
            new Vector2D(point.x - marginThickness, point.y),
            new Vector2D(point.x, point.y - marginThickness),
            new Vector2D(point.x + marginThickness, point.y),
            new Vector2D(point.x, point.y + marginThickness)
        ];
    }

    static computeExpandedPolygonForTwoPoint([point0, point1], marginThickness) {
        const vector0 = Vector2D.multiply(
            Vector2D.diff(point0, point1).normalize(),
            marginThickness
        );

        const vector1 = new Vector2D(-vector0.y, vector0.x);

        return [
            Vector2D.sum(point0, vector1),
            Vector2D.sum(point0, vector0.negate()),
            Vector2D.sum(point0, vector1.negate()),
            Vector2D.sum(point1, vector1.negate()),
            Vector2D.sum(point1, vector0),
            Vector2D.sum(point1, vector1)
        ];
    }

    static computeExpandedPolygonForMultiPoints(points, marginThickness) {
        return points.reduce((expandedPolygon, cursorPoint, i) => {
            const previousPoint = points[(i || points.length) - 1];
            const nextPoint = points[(i + 1) % points.length];
            const previousVector = Vector2D.diff(cursorPoint, previousPoint).normalize();
            const nextVector = Vector2D.diff(cursorPoint, nextPoint).normalize();

            return [
                ...expandedPolygon,
                Vector2D.sum(
                    cursorPoint,
                    Vector2D.multiply([
                        previousVector.y,
                        -previousVector.x
                    ], marginThickness)
                ),
                Vector2D.sum(
                    cursorPoint,
                    Vector2D.multiply(Vector2D.sum(
                        nextVector,
                        previousVector
                    ).normalize(), marginThickness)
                ),
                Vector2D.sum(
                    cursorPoint,
                    Vector2D.multiply([
                        -nextVector.y,
                        nextVector.x
                    ], marginThickness)
                )
            ];
        }, []);
    }
}

export default Vector2D;
