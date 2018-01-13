/* eslint no-restricted-properties: 0 */
import MouseState from './MouseState';
import Stroke from './Stroke';
import Vector2D from './Vector2D';
import Box2D from './Box2D';

import { DRAG_MODE, TOOL_MODE, CONTROL } from './modes';

const BUTTON = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};

// for use with MouseEvent.buttons
// const BUTTONS_BIT_LEFT = 1;
// const BUTTONS_BIT_MIDDLE = 4;
// const BUTTONS_BIT_RIGHT = 2;

class MouseHandler {
    constructor() {
        this.mouseState = new MouseState();
        this.showMouseCoordinates = false;
        this.zoomFactorPerPixelDragged = 1.005;
        this.currentDragMode = DRAG_MODE.NONE;
    }

    down(e) {
        const { left, top } = e.target.getBoundingClientRect();
        this.mouseState.mouseX = e.clientX - left;
        this.mouseState.mouseY = e.clientY - top;

        if (this.currentDragMode !== DRAG_MODE.NONE) {
            return;
        }

        this.mouseState.dragStartX = this.mouseState.mouseX;
        this.mouseState.dragStartY = this.mouseState.mouseY;

        if (e.target.controlMenu.isVisible || (e.button === BUTTON.RIGHT && e.shiftKey)) {
            if (e.target.controlMenu.pressEvent(this.mouseState.mouseX, this.mouseState.mouseY)) {
                e.target.redraw();
            }
        } else if (e.target.radialMenu.isVisible || (e.button === BUTTON.RIGHT)) {
            if (e.target.radialMenu.pressEvent(this.mouseState.mouseX, this.mouseState.mouseY)) {
                e.target.redraw();
            }
        } else if (e.button === BUTTON.LEFT && e.shiftKey) {
            this.currentDragMode = DRAG_MODE.TRANSLATE;
        } else if (e.button === BUTTON.LEFT && e.ctrlKey) {
            this.currentDragMode = DRAG_MODE.ZOOM;
        } else if (e.button === BUTTON.LEFT) {
            this.mouseState.clear();
            this.mouseState.push();
            if (e.target.currentToolMode === TOOL_MODE.RECT_SELECT) {
                e.target.selectedStrokes = [];
            }
            this.currentDragMode = DRAG_MODE.TOOL;
        }
    }

    up(e) {
        if (e.target.controlMenu.isVisible && e.button === BUTTON.RIGHT) {
            if (e.target.controlMenu.releaseEvent(this.mouseState.mouseX, this.mouseState.mouseY)) {
                const itemLabel = e.target.controlMenu.label[e.target.controlMenu.getSelection()];

                const itemID = e.target.radialMenu.getItemIDForLabel(itemLabel);

                if (itemID || itemID === 0) {
                    e.target.setToolMode(itemID, true);
                }

                e.target.redraw();
            }
        } else if (e.target.radialMenu.isVisible && e.button === BUTTON.RIGHT) {
            const returnValue = e.target.radialMenu.releaseEvent(
                this.mouseState.mouseX,
                this.mouseState.mouseY
            );

            const itemID = e.target.radialMenu.getIDOfSelection();
            if (itemID >= 0 && itemID < Object.keys(TOOL_MODE).length) {
                e.target.setToolMode(itemID, true);
            }

            if (returnValue) {
                e.target.redraw();
            }
        } else if (this.currentDragMode === DRAG_MODE.TRANSLATE && e.button === BUTTON.LEFT) {
            this.currentDragMode = DRAG_MODE.NONE;
        } else if (this.currentDragMode === DRAG_MODE.ZOOM && e.button === BUTTON.LEFT) {
            this.currentDragMode = DRAG_MODE.NONE;
        } else if (this.currentDragMode === DRAG_MODE.TOOL && e.button === BUTTON.LEFT) {
            let newStroke;
            switch (e.target.currentToolMode) {
                case TOOL_MODE.PENCIL:
                    newStroke = new Stroke();
                    this.mouseState.mouseHistory.forEach(vector =>
                        newStroke.pushPoint(e.target.draw2D
                            .convertPixelsToWorldSpaceUnits(vector)));
                    e.target.drawing.pushStroke(newStroke);
                    if (e.target.drawSymetry) {
                        const symetryStroke = new Stroke();
                        this.mouseState.mouseHistory.forEach(({ x, y }) =>
                            symetryStroke.pushPoint(e.target.draw2D
                                .convertPixelsToWorldSpaceUnits({ x: e.target.width - x, y })));
                        e.target.drawing.pushStroke(symetryStroke);
                    }
                    break;
                case TOOL_MODE.LINE: {
                    newStroke = new Stroke();
                    const start = this.mouseState.mouseHistory[0];
                    const end = this.mouseState.mouseHistory[this.mouseState.length - 1];
                    newStroke.pushPoint(e.target.draw2D.convertPixelsToWorldSpaceUnits(start));
                    newStroke.pushPoint(e.target.draw2D.convertPixelsToWorldSpaceUnits(end));
                    e.target.drawing.pushStroke(newStroke);
                    if (e.target.drawSymetry) {
                        const symetryStroke = new Stroke();
                        const { x: x1, y: y1 } = this.mouseState.mouseHistory[0];
                        const { x: x2, y: y2 } = this.mouseState
                            .mouseHistory[this.mouseState.length - 1];
                        symetryStroke.pushPoint(e.target.draw2D.convertPixelsToWorldSpaceUnits({
                            x: e.target.width - x1, y: y1
                        }));
                        symetryStroke.pushPoint(e.target.draw2D.convertPixelsToWorldSpaceUnits({
                            x: e.target.width - x2, y: y2
                        }));
                        e.target.drawing.pushStroke(symetryStroke);
                    }
                    break;
                }
                case TOOL_MODE.RECT_SELECT: {
                    const selectedRectangle = new Box2D(
                        e.target.draw2D.convertPixelsToWorldSpaceUnits(new Vector2D(
                            this.mouseState.dragStartX,
                            this.mouseState.dragStartY
                        )),
                        e.target.draw2D.convertPixelsToWorldSpaceUnits(new Vector2D(
                            this.mouseState.mouseX,
                            this.mouseState.mouseY
                        ))
                    );
                    this.selectedStrokes = [];
                    e.target.drawing.strokes
                        .filter(stroke => stroke.isContainedInRectangle(selectedRectangle))
                        .forEach(stroke => e.target.selectedStrokes.push(stroke));
                    break;
                }
                case TOOL_MODE.MOVE_SELECTION:
                default:
                    break;
            }
            this.currentDragMode = DRAG_MODE.NONE;
            e.target.redraw();
        }
    }

    move(e) {
        const { left, top } = e.target.getBoundingClientRect();
        this.mouseState.mouseX = e.clientX - left;
        this.mouseState.mouseY = e.clientY - top;
        const previousMouseX = this.mouseState.mouseX - e.movementX;
        const previousMouseY = this.mouseState.mouseY - e.movementY;

        const deltaX = e.movementX;
        const deltaY = e.movementY;


        if (e.target.controlMenu.isVisible) {
            if (e.target.controlMenu.isInMenuingMode) {
                if (
                    e.target.controlMenu.dragEvent(this.mouseState.mouseX, this.mouseState.mouseY)
                ) {
                    e.target.redraw();
                }
            } else {
                switch (e.target.controlMenu.getIDOfSelection()) {
                    case CONTROL.MOVE_SELECTION: {
                        const vector = Vector2D.diff(
                            e.target.draw2D
                                .convertPixelsToWorldSpaceUnits(new Vector2D(
                                    this.mouseState.this.mouseX,
                                    this.mouseState.mouseY
                                )),
                            e.target.draw2D.convertPixelsToWorldSpaceUnits(new Vector2D(
                                previousMouseX,
                                previousMouseY
                            ))
                        );
                        e.target.selectedStrokes.forEach(stroke => stroke.translate(vector));
                        e.target.drawing.isBoundingRectangleDirty = true;
                        break;
                    }
                    case CONTROL.TRANSLATE:
                        e.target.draw2D.translate(deltaX, deltaY);
                        break;
                    case CONTROL.ZOOM:
                        e.target.draw2D.zoomIn(
                            Math.pow(this.zoomFactorPerPixelDragged, (deltaX - deltaY)),
                            this.mouseState.dragStartX,
                            this.mouseState.dragStartY
                        );
                        break;
                    case CONTROL.PENCIL:
                    case CONTROL.LINE:
                    case CONTROL.RECT_SELECT:
                    default:
                        break;
                }
                e.target.redraw();
            }
        } else if (e.target.radialMenu.isVisible) {
            if (e.target.radialMenu.dragEvent(this.mouseState.mouseX, this.mouseState.mouseY)) {
                e.target.redraw();
            }
        } else if (this.currentDragMode === DRAG_MODE.TRANSLATE) {
            e.target.draw2D.translate(deltaX, deltaY);
            e.target.redraw();
        } else if (this.currentDragMode === DRAG_MODE.ZOOM) {
            e.target.draw2D.zoomIn(
                Math.pow(this.zoomFactorPerPixelDragged, deltaX - deltaY),
                this.mouseState.dragStartX,
                this.mouseState.dragStartY
            );
            e.target.redraw();
        } else if (this.currentDragMode === DRAG_MODE.TOOL) {
            switch (e.target.currentToolMode) {
                case TOOL_MODE.PENCIL:
                case TOOL_MODE.LINE:
                    this.mouseState.push();
                    break;
                case TOOL_MODE.RECT_SELECT:
                    break;
                case TOOL_MODE.MOVE_SELECTION: {
                    const vector = Vector2D.diff(
                        e.target.draw2D.convertPixelsToWorldSpaceUnits(new Vector2D(
                            this.mouseState.mouseX,
                            this.mouseState.mouseY
                        )),
                        e.target.draw2D
                            .convertPixelsToWorldSpaceUnits(new Vector2D(
                                previousMouseX,
                                previousMouseY
                            ))
                    );
                    e.target.selectedStrokes.forEach(stroke => stroke.translate(vector));
                    e.target.drawing.isBoundingRectangleDirty = true;
                    break;
                }
                default:
                    break;
            }
            e.target.redraw();
        } else if (e.target.showMouseCoordinates) {
            e.target.redraw();
        }
    }
}

export default MouseHandler;
