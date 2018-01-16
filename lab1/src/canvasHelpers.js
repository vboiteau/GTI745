import Box2D from './Box2D';
import Draw2D from './Draw2D';
import Vector2D from './Vector2D';
import RadialMenu from './RadialMenu';
import ControlMenu from './ControlMenu';
import Drawing from './Drawing';
import Stroke from './Stroke';
import MouseHandler from './MouseHandler';
import { DRAG_MODE, TOOL_MODE } from './modes';

const canvasHelpers = canvas => Object.assign(canvas, {
    mouseHandler: new MouseHandler(),
    draw2D: new Draw2D(canvas),
    drawing: new Drawing(),
    radialMenu: new RadialMenu(),
    controlMenu: new ControlMenu(),
    selectedStrokes: [],
    showMouseCoordinates: false,
    currentToolMode: TOOL_MODE.PENCIL,
    drawSymetry: false,

    toggleDrawSymetry() {
        this.drawSymetry = !this.drawSymetry;
    },

    toggleShowMouseCoordinates() {
        this.showMouseCoordinates = !this.showMouseCoordinates;
    },

    duplicateSelection() {
        this.selectedStrokes.forEach(original => {
            const newStroke = new Stroke();
            newStroke.copy(original);
            this.drawing.pushStroke(newStroke);
        });

        this.redraw();
    },

    flipSelection(axe) {
        const bounds = this.getSelectedStrokesBounds();
        const isX = axe === 'X';

        const newSelectedStrokes = this.selectedStrokes.map(stroke => {
            const newStroke = new Stroke();
            const index = this.drawing.strokes.indexOf(stroke);
            newStroke.points = stroke.points.map(({ x, y }) => new Vector2D(
                isX ? x : bounds.max.x - x + bounds.min.x,
                isX ? bounds.max.y - y + bounds.min.y : y
            ));

            this.drawing.strokes[index] = newStroke;

            return newStroke;
        });

        this.selectedStrokes = [];

        this.selectedStrokes = newSelectedStrokes;

        this.redraw();
    },

    getSelectedStrokesBounds() {
        const selectedStrokesBounds = this.selectedStrokes.reduce(({ min, max }, stroke) => {
            const bounds = stroke.boundingRectangle;
            return ({
                min: {
                    x: bounds.min.x < min.x ? bounds.min.x : min.x,
                    y: bounds.min.y < min.y ? bounds.min.y : min.y
                },
                max: {
                    x: bounds.max.x > max.x ? bounds.max.x : max.x,
                    y: bounds.max.y > max.y ? bounds.max.y : max.y
                }
            });
        }, {
            min: {
                x: Number.MAX_VALUE,
                y: Number.MAX_VALUE
            },
            max: {
                x: Number.MIN_VALUE,
                y: Number.MIN_VALUE
            }
        });

        return new Box2D(
            new Vector2D(selectedStrokesBounds.min.x, selectedStrokesBounds.min.y),
            new Vector2D(selectedStrokesBounds.max.x, selectedStrokesBounds.max.y)
        );
    },

    redraw() {
        this.draw2D.setFontHeight(RadialMenu.textHeight);
        this.draw2D.clear(255, 255, 255);
        this.draw2D.setCoordinateSystemToWorldSpaceUnits();
        this.draw2D.setFillColor(255, 128, 0, 0.3);

        this.selectedStrokes.forEach(stroke => {
            const boundingRectangle = stroke.getBoundingRectangle();
            const { x, y } = boundingRectangle.min;
            const width = boundingRectangle.width();
            const height = boundingRectangle.height();
            this.draw2D.fillRect(x, y, width, height);
            this.draw2D.drawRect(x, y, width, height);
        });

        this.draw2D.setStrokeColor(0, 0, 0); // black
        this.drawing.draw(this.draw2D);

        this.draw2D.setCoordinateSystemToPixels();

        if (this.mouseHandler.currentDragMode === DRAG_MODE.TOOL) {
            switch (this.currentToolMode) {
                case TOOL_MODE.PENCIL:
                    this.draw2D.setStrokeColor(0, 0, 0); // black
                    this.draw2D.drawPolyline(this.mouseHandler.mouseState.mouseHistory);
                    if (this.drawSymetry) {
                        this.draw2D
                            .drawPolyline(this.mouseHandler.mouseState.mouseHistory
                                .map(({ x, y }) => ({ x: this.width - x, y })));
                    }
                    break;
                case TOOL_MODE.LINE: {
                    this.draw2D.setStrokeColor(0, 0, 0); // black
                    const { x: x1, y: y1 } = this.mouseHandler.mouseState.mouseHistory[0];
                    const { x: x2, y: y2 } = this.mouseHandler.mouseState.mouseHistory[
                        this.mouseHandler.mouseState.length - 1
                    ];
                    this.draw2D.drawLine(x1, y1, x2, y2);
                    if (this.drawSymetry) {
                        const { x: x1S } = this.mouseHandler.mouseState.mouseHistory[0];
                        const { x: x2S } = this.mouseHandler.mouseState.mouseHistory[
                            this.mouseHandler.mouseState.length - 1
                        ];
                        this.draw2D.drawLine(canvas.width - x1S, y1, canvas.width - x2S, y2);
                    }
                    break;
                }
                case TOOL_MODE.RECT_SELECT:
                    this.draw2D.setFillColor(255, 128, 0, 0.3); // transparent orange
                    this.draw2D.fillRect(...this.mouseHandler.mouseState.getBoundaryOfDrag());
                    this.draw2D.setStrokeColor(255, 0, 0); // red
                    this.draw2D.drawRect(...this.mouseHandler.mouseState.getBoundaryOfDrag());
                    break;
                case TOOL_MODE.MOVE_SELECTION:
                default:
                    break;
            }
        }

        if (this.radialMenu.isVisible) {
            this.radialMenu.draw(this.draw2D);
        }
        if (this.controlMenu.isVisible) {
            this.controlMenu.draw(this.draw2D);
        }

        if (this.showMouseCoordinates) {
            this.draw2D.setFillColor(0, 0, 0);
            const xWorld = this.draw2D
                .convertPixelsToWorldSpaceUnitsX(this.mouseHandler.mouseState.mouseX);
            const yWorld = this.draw2D
                .convertPixelsToWorldSpaceUnitsY(this.mouseHandler.mouseState.mouseY);
            this.draw2D.drawString(
                20,
                this.height - 20,
                `pixels:(${this.mouseHandler.mouseState.mouseX}, ${this.mouseHandler.mouseState.mouseY})   world:(${parseFloat(xWorld).toFixed(2)}, ${parseFloat(yWorld).toFixed(2)})`
            );
        }
    },

    oncontextmenu() {
        return false;
    },

    setToolMode(toolMode, updateRadioButtons = false) {
        this.currentToolMode = toolMode;
        this.mouseHandler.mouseState.clear();
        if (updateRadioButtons) {
            let idString = 'null';
            switch (toolMode) {
                case TOOL_MODE.PENCIL:
                    idString = 'TOOL_MODE_PENCIL';
                    break;
                case TOOL_MODE.LINE:
                    idString = 'TOOL_MODE_LINE';
                    break;
                case TOOL_MODE.RECT_SELECT:
                    idString = 'TOOL_MODE_RECT_SELECT';
                    break;
                case TOOL_MODE.MOVE_SELECTION:
                    idString = 'TOOL_MODE_MOVE_SELECTION';
                    break;
                default:
                    break;
            }
            const checkbox = document.getElementById(idString);
            if (checkbox) {
                checkbox.checked = true;
            }
        }
    },

    frameAll() {
        this.draw2D.frame(this.drawing.getBoundingRectangle(), true);
        this.redraw();
    },

    deleteSelection() {
        this.selectedStrokes
            .reverse()
            .map(stroke => this.drawing.strokes.indexOf(stroke))
            .filter(j => j >= 0)
            .forEach(j => this.drawing.strokes.splice(j, 1));

        this.selectedStrokes = [];
        this.drawing.isBoundingRectangleDirty = true;

        this.redraw();
    },

    deleteAll() {
        this.selectedStrokes = [];
        this.drawing.strokes = [];
        this.drawing.isBoundingRectangleDirty = true;

        this.redraw();
    }
});

export default canvasHelpers;
