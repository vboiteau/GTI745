import Vector2D from './Vector2D';
import Box2D from './Box2D';

let pixels = 'pixels';
let world = 'world';
class Draw2D {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvasContext = canvas.getContext('2d');
        this.canvasWidth_pixels = canvas.width;
        this.canvasHeight_pixels = canvas.height;
        this.offsetXPixels = 0;
        this.offsetYPixels = 0;
        this.scaleFactorInWorldSpaceUnitsPerPixel = 1.0; // greater if user is more zoomed out
        this.setFont(this.canvasContext.font);
        this.coordinateSystem = Draw2D.PIXELS;
    }

    static get PIXELS() {
        return pixels;
    }

    static set PIXELS(input) {
        pixels = input;
    }

    static get WORLD() {
        return world;
    }

    static set WORLD(input) {
        world = input;
    }

    setFont(fontName) {
        this.canvasContext.font = fontName;
        this.fontHeight = parseInt(this.canvasContext.font.match(/\d+/)[0], 10);
    }

    setFontHeight(fontHeight) {
        this.canvasContext.font = `${fontHeight.toString()}px sans-serif`;
        this.fontHeight = parseInt(this.canvasContext.font.match(/\d+/)[0], 10);
    }

    convertPixelsToWorldSpaceUnitsX(xPixels) {
        return (xPixels - this.offsetXPixels) * this.scaleFactorInWorldSpaceUnitsPerPixel;
    }

    convertPixelsToWorldSpaceUnitsY(yPixels) {
        return (yPixels - this.offsetYPixels) * this.scaleFactorInWorldSpaceUnitsPerPixel;
    }

    convertPixelsToWorldSpaceUnits(pointPixels) {
        return new Vector2D(
            (pointPixels.x - this.offsetXPixels) * this.scaleFactorInWorldSpaceUnitsPerPixel,
            (pointPixels.y - this.offsetYPixels) * this.scaleFactorInWorldSpaceUnitsPerPixel
        );
    }

    convertWorldSpaceUnitsToPixelsX(xWorld) {
        return xWorld / this.scaleFactorInWorldSpaceUnitsPerPixel + this.offsetXPixels;
    }

    convertWorldSpaceUnitsToPixelsY(yWorld) {
        return yWorld / this.scaleFactorInWorldSpaceUnitsPerPixel + this.offsetYPixels;
    }

    convertWorldSpaceUnitsToPixels(pointWorld) {
        return new Vector2D(
            pointWorld.x / this.scaleFactorInWorldSpaceUnitsPerPixel + this.offsetXPixels,
            pointWorld.y / this.scaleFactorInWorldSpaceUnitsPerPixel + this.offsetYPixels
        );
    }

    translate(deltaXPixels, deltaYPixels) {
        this.offsetXPixels += deltaXPixels;
        this.offsetYPixels += deltaYPixels;
    }

    zoomIn(
        zoomFactor,
        centerXPixels,
        centerYPixels
    ) {
        this.scaleFactorInWorldSpaceUnitsPerPixel /= zoomFactor;
        this.offsetXPixels = centerXPixels - (centerXPixels - this.offsetXPixels) * zoomFactor;
        this.offsetYPixels = centerYPixels - (centerYPixels - this.offsetYPixels) * zoomFactor;
    }

    zoomInAroundCenterOfCanvas(zoomFactor) {
        this.zoomIn(zoomFactor, this.canvasWidth_pixels * 0.5, this.canvasHeight_pixels * 0.5);
    }

    translateAndZoomBasedOnDisplacementOfTwoFingers(aOld, bOld, aNew, bNew) {
        const M1 = Vector2D.average(aOld, bOld);
        const M2 = Vector2D.average(aNew, bNew);

        const translation = Vector2D.diff(M2, M1);

        const vector0 = Vector2D.diff(aOld, bOld);
        const vector1 = Vector2D.diff(aNew, bNew);

        const vector0Length = vector0.norm();
        const vector1Length = vector1.norm();
        let scaleFactor = 1;
        if (vector0Length > 0 && vector1Length > 0) { scaleFactor = vector1Length / vector0Length; }
        this.translate(translation.x, translation.y);
        this.zoomIn(scaleFactor, M2.x, M2.y);
    }

    frame(originalRect, expand) {
        if (
            originalRect.isEmpty ||
            originalRect.diagonal().x === 0 ||
            originalRect.diagonal().y === 0
        ) {
            return;
        }
        let rect = originalRect;
        if (expand) {
            const diagonal = rect.diagonal().norm() / 20;
            const vector = new Vector2D(diagonal, diagonal);
            rect = new Box2D(Vector2D.diff(rect.min, vector), Vector2D.sum(rect.max, vector));
        }
        if (rect.width() / rect.height() >= this.canvasWidth_pixels / this.canvasHeight_pixels) {
            // The rectangle to frame is wider (or shorter) than the canvas,
            // so the limiting factor is the width of the rectangle.
            this.offsetXPixels = -rect.min.x * this.canvasWidth_pixels / rect.width();
            this.scaleFactorInWorldSpaceUnitsPerPixel = rect.width() / this.canvasWidth_pixels;
            this.offsetYPixels =
                this.canvasHeight_pixels / 2 -
                rect.center().y / this.scaleFactorInWorldSpaceUnitsPerPixel;
        } else {
            // The limiting factor is the height of the rectangle.
            this.offsetYPixels = -rect.min.y * this.canvasHeight_pixels / rect.height();
            this.scaleFactorInWorldSpaceUnitsPerPixel = rect.height() / this.canvasHeight_pixels;
            this.offsetXPixels =
                this.canvasWidth_pixels / 2 -
                rect.center().x / this.scaleFactorInWorldSpaceUnitsPerPixel;
        }
    }

    resize(width, height) {
        const oldCenter = this
            .convertPixelsToWorldSpaceUnits(new Vector2D(
                this.canvasWidth_pixels * 0.5,
                this.canvasHeight_pixels * 0.5
            ));
        const radius =
            Math.min(this.canvasWidth_pixels, this.canvasHeight_pixels) *
            0.5 *
            this.scaleFactorInWorldSpaceUnitsPerPixel;

        this.canvasWidth_pixels = width;
        this.canvasHeight_pixels = height;

        if (radius > 0) {
            this.frame(
                new Box2D(
                    new Vector2D(oldCenter.x - radius, oldCenter.y - radius),
                    new Vector2D(oldCenter.x + radius, oldCenter.y + radius)
                ),
                false
            );
        }
    }

    setCoordinateSystemToPixels() {
        this.coordinateSystem = Draw2D.PIXELS;
    }

    setCoordinateSystemToWorldSpaceUnits() {
        this.coordinateSystem = Draw2D.WORLD;
    }

    setStrokeColor(red, green, blue, alpha = 1.0) {
        if (alpha === 1.0) {
            this.canvasContext.strokeStyle = `rgb(${red},${green},${blue})`;
        } else {
            this.canvasContext.strokeStyle = `rgba(${red},${green},${blue},${alpha})`;
        }
    }

    setFillColor(red, green, blue, alpha = 1.0) {
        if (alpha === 1.0) {
            this.canvasContext.fillStyle = `rgb(${red},${green},${blue})`;
        } else {
            this.canvasContext.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        }
    }

    setLineWidth(lw) {
        this.canvasContext.lineWidth = lw;
    }

    clear(red, green, blue) {
        this.setFillColor(red, green, blue);
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLine(x1, y1, x2, y2) {
        if (this.coordinateSystem === Draw2D.WORLD) {
            this.contextedDrawLine(
                this.convertWorldSpaceUnitsToPixelsX(x1),
                this.convertWorldSpaceUnitsToPixelsY(y1),
                this.convertWorldSpaceUnitsToPixelsX(x2),
                this.convertWorldSpaceUnitsToPixelsY(y2)
            );
        } else {
            this.contextedDrawLine(x1, y1, x2, y2);
        }
    }

    contextedDrawLine(x1, y1, x2, y2) {
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(x1, y1);
        this.canvasContext.lineTo(x2, y2);
        this.canvasContext.stroke();
    }

    drawRect(unsignedX, unsignedY, unsignedWidth, unsignedHeight, isFilled = false) {
        const {
            height,
            width,
            x,
            y
        } = Draw2D.getRectSignedCoords(
            unsignedX,
            unsignedY,
            unsignedWidth,
            unsignedHeight
        );
        if (this.coordinateSystem === Draw2D.WORLD) {
            this.contextedDrawRect(
                this.convertWorldSpaceUnitsToPixelsX(x),
                this.convertWorldSpaceUnitsToPixelsY(y),
                unsignedWidth / this.scaleFactorInWorldSpaceUnitsPerPixel,
                unsignedHeight / this.scaleFactorInWorldSpaceUnitsPerPixel,
                isFilled
            );
        } else {
            this.contextedDrawRect(x, y, width, height, isFilled);
        }
    }

    contextedDrawRect(x, y, width, height, isFilled) {
        if (isFilled) {
            this.canvasContext.fillRect(x, y, width, height);
        } else {
            this.canvasContext.strokeRect(x, y, width, height);
        }
    }

    static getRectSignedCoords(x, y, width, height) {
        return {
            height: height < 0 ? -height : height,
            width: width < 0 ? -width : width,
            x: width < 0 ? x + width : x,
            y: height < 0 ? y + height : y
        };
    }

    fillRect(x, y, w, h) {
        this.drawRect(x, y, w, h, true);
    }

    drawCircle(xCenter, yCenter, radius, isFilled = false) {
        if (this.coordinateSystem === Draw2D.WORLD) {
            this.contextedDrawCircle(
                this.convertWorldSpaceUnitsToPixelsX(xCenter),
                this.convertWorldSpaceUnitsToPixelsY(yCenter),
                radius / this.scaleFactorInWorldSpaceUnitsPerPixel,
                isFilled
            );
        } else {
            this.contextedDrawCircle(xCenter, yCenter, radius, isFilled);
        }
    }

    contextedDrawCircle(xCenter, yCenter, radius, isFilled = false) {
        this.canvasContext.beginPath();
        this.canvasContext.arc(xCenter, yCenter, radius, 0, 2 * Math.PI, false);

        if (isFilled) {
            this.canvasContext.fill();
        } else {
            this.canvasContext.stroke();
        }
    }

    fillCircle(xCenter, yCenter, radius) {
        this.drawCircle(xCenter, yCenter, radius, true);
    }

    drawPolyline(points, isFilled = false, isClosed = false) {
        if (points.length < 2) {
            return;
        }
        this.canvasContext.beginPath();
        points.forEach((point, i) => {
            let { x, y } = point;
            if (this.coordinateSystem === Draw2D.WORLD) {
                x = this.convertWorldSpaceUnitsToPixelsX(x);
                y = this.convertWorldSpaceUnitsToPixelsY(y);
            }
            this.canvasContext[`${i ? 'line' : 'move'}To`](x, y);
        });
        if (isClosed) {
            this.canvasContext.closePath();
        }
        if (isFilled) {
            this.canvasContext.fill();
        } else {
            this.canvasContext.stroke();
        }
    }

    drawPolygon(points, isFilled = false) {
        this.drawPolyline(points, isFilled, true);
    }

    fillPolygon(points) {
        this.drawPolyline(points, true, true);
    }

    stringWidth(s) {
        if (s.length === 0) return 0;
        return this.canvasContext.measureText(s).width;
    }

    drawString(x, y, s) {
        if (s.length === 0) return;
        this.canvasContext.fillText(s, x, y);
    }
}

export default Draw2D;
