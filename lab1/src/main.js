import Vector2D from './Vector2D';
import Box2D from './Box2D';
import Draw2D from './Draw2D'
// ============================================================
// A radial popup menu.
// To create a new instance, use the new keyword:
//    var rm = new RadialMenu();
// ============================================================

function RadialMenu() {
    // Each menu item has a corresponding ``label'' string.
    // If a given label string is empty (""),
    // then there is no menu item displayed for it.
    // In addition, the client can temporarily deactivate
    // an existing menu item by setting its ``isEnabled'' flag to false.
    this.label = []; // array of strings, with index ranging from 0 to N
    this.isEnabled = []; // array of boolean, with index ranging from 0 to N

    // Each menu item also has a (normally distinct) ID number.
    // These are useful for causing.multiplyiple items to hilite together:
    // whenever the user drags over a given item,
    // it and all other items with the same ID hilite together.
    // This is intended for cases where there are redundant menu items
    // that map to the same function in the client's code.
    this.itemID = []; // array of integers, with index ranging from 0 to N

    const N = 8;
    for (let i = 0; i <= N; ++i) {
        this.label[i] = '';
        this.isEnabled[i] = true;

        // Give every item a distinct ID.
        this.itemID[i] = i;
    }

    this.selectedItem = 0; // an integer in the range [CENTRAL_ITEM,N]

    // pixel coordinates of center of menu
    this.x0 = 0;
    this.y0 = 0;

    // pixel coordinates of current mouse position
    this.mouseX = 0;
    this.mouseY = 0;

    this.isVisible = false;
}

// The radial menu has a central menu item (with index 0)
// and up to 8 surrounding menu items
// (with indices 1 through 8, numbered clockwise,
// with 1 for North, 2 for North-East, ..., 8 for North-West).
RadialMenu.CENTRAL_ITEM = 0;
RadialMenu.NORTH = 1;
RadialMenu.NORTH_EAST = 2;
RadialMenu.EAST = 3;
RadialMenu.SOUTH_EAST = 4;
RadialMenu.SOUTH = 5;
RadialMenu.SOUTH_WEST = 6;
RadialMenu.WEST = 7;
RadialMenu.NORTH_WEST = 8;
RadialMenu.N = 8;
RadialMenu.FOREGROUND_1 = 0;
RadialMenu.FOREGROUND_2 = 127;
RadialMenu.BACKGROUND = 255;
RadialMenu.MENU_ALPHA = 0.6;
RadialMenu.radiusOfNeutralZone = 10;
RadialMenu.textHeight = 20;
RadialMenu.marginAroundText = 6;
RadialMenu.marginBetweenItems = 6;

RadialMenu.prototype = {

    setItemLabelAndID(index, /* string */ s, id) {
        if (index >= 0 && index <= RadialMenu.N) {
            this.label[index] = s;
            this.itemID[index] = id;
        }
    },
    setItemLabel(index, /* string */ s) {
        if (index >= 0 && index <= RadialMenu.N) {
            this.label[index] = s;
        }
    },
    getItemID(index) {
        if (index >= 0 && index <= RadialMenu.N) {
            return this.itemID[index];
        }
        return -1;
    },

    setEnabledByID(/* boolean */ flag, id) {
        for (let i = 0; i <= RadialMenu.N; ++i) {
            if (this.itemID[i] === id) {
                this.isEnabled[i] = flag;
            }
        }
    },

    // For internal use only.
    isItemHilited(index) {
        console.assert(index >= 0 && index <= RadialMenu.N);
        return this.itemID[index] === this.itemID[this.selectedItem];
    },

    // The client typically calls this after an interaction with the menu
    // is complete, to find out what the user selected.
    // Returns an index in the range [CENTRAL_ITEM,N]
    getSelection() { return this.selectedItem; },

    getIDOfSelection() { return this.getItemID(this.selectedItem); },

    // The below methods, that handle mouse events, return true if the client should redraw.
    pressEvent(x, y) {
        this.x0 = this.mouseX = x;
        this.y0 = this.mouseY = y;
        this.selectedItem = RadialMenu.CENTRAL_ITEM;
        this.isVisible = true;
        return true;
    },
    releaseEvent(x, y) {
        if (this.isVisible) {
            this.isVisible = false;
            return true;
        }
        return false;
    },
    moveEvent(x, y) {
        if (!this.isVisible) { return false; }
        // make the center of the menu follow the cursor
        this.x0 = this.mouseX = x;
        this.y0 = this.mouseY = y;
        return true;
    },
    dragEvent(x, y) {
        if (!this.isVisible) { return false; }

        this.mouseX = x;
        this.mouseY = y;
        const dx = this.mouseX - this.x0;
        const dy = this.mouseY - this.y0;
        const radius = Math.sqrt(dx * dx + dy * dy);

        let newlySelectedItem = RadialMenu.CENTRAL_ITEM;

        if (radius > RadialMenu.radiusOfNeutralZone) {
            let theta = Math.asin(dy / radius);
            if (dx < 0) theta = Math.PI - theta;

            // theta is now relative to the +x axis, which points right,
            // and increases clockwise (because y+ points down).
            // If we added pi/2 radians, it would be relative to the -y
            // axis (which points up).
            // However, what we really want is for it to be relative to
            // the radial line that divides item 1 from item 8.
            // So we must add pi/2 + pi/8 radians.

            theta += 5 * Math.PI / 8;

            // Ensure it's in [0,2*pi]
            console.assert(theta > 0);
            if (theta > 2 * Math.PI) theta -= 2 * Math.PI;

            newlySelectedItem = 1 + Math.floor(theta / (Math.PI / 4));
            console.assert(newlySelectedItem >= 1 && newlySelectedItem <= RadialMenu.N);

            if (this.label[newlySelectedItem].length === 0 || !this.isEnabled[newlySelectedItem]) {
                // loop over all items, looking for the closest one
                let minDifference = 4 * Math.PI;
                let itemWithMinDifference = RadialMenu.CENTRAL_ITEM;
                for (let candidateItem = 1; candidateItem <= RadialMenu.N; ++candidateItem) {
                    if (this.label[candidateItem].length > 0 && this.isEnabled[candidateItem]) {
                        const candidateItemTheta = (candidateItem - 1) * (Math.PI / 4) + Math.PI / 8;
                        let candidateDifference = Math.abs(candidateItemTheta - theta);
                        if (candidateDifference > Math.PI) { candidateDifference = 2 * Math.PI - candidateDifference; }
                        if (candidateDifference < minDifference) {
                            minDifference = candidateDifference;
                            itemWithMinDifference = candidateItem;
                        }
                    }
                }
                newlySelectedItem = itemWithMinDifference;
            }
        }

        if (newlySelectedItem !== this.selectedItem) {
            this.selectedItem = newlySelectedItem;
            return true;
        }

        return false;
    },

    drawMenuItems(
        draw2,
        drawOnlyHilitedItem, // boolean; if false, all menu items are drawn
        drawUsingPieStyle, // boolean
        radiusOfPie // in pixels; only used if ``drawUsingPieStyle'' is true
    ) {
        const fg1 = RadialMenu.FOREGROUND_1;
        const fg2 = RadialMenu.FOREGROUND_2;
        const bg = RadialMenu.BACKGROUND;
        const alpha = RadialMenu.MENU_ALPHA;
        const N = RadialMenu.N;

        if (drawUsingPieStyle) {
            draw2.setFillColor(fg2, fg2, fg2, alpha);
            draw2.fillCircle(this.x0, this.y0, radiusOfPie);
        }

        if (this.isItemHilited(RadialMenu.CENTRAL_ITEM)) { draw2.setFillColor(fg1, fg1, fg1, alpha); } else { draw2.setFillColor(bg, bg, bg, alpha); }
        draw2.fillCircle(this.x0, this.y0, RadialMenu.radiusOfNeutralZone);
        if (!this.isItemHilited(RadialMenu.CENTRAL_ITEM)) { draw2.setStrokeColor(fg1, fg1, fg1); } else { draw2.setStrokeColor(bg, bg, bg); }
        draw2.drawCircle(this.x0, this.y0, RadialMenu.radiusOfNeutralZone);


        /*
			Below we have the upper right quadrant of the radial menu.
				+---------+              \
				| item 1  |               ) heightOfItems
				+---------+              /
				     .                    ) marginBetweenItems
				     . +---------+       \
				     . | item 2  |        ) heightOfItems
				     . +---------+       /
				     . .                  ) marginBetweenItems
				     ..     +---------+  \
				     o......| item 3  |   ) heightOfItems
				            +---------+  /
			Let r be the distance from the menu's center "o" to the center of item 1,
			and also the distance from "o" to the center of item 3.
			From the picture, we have
				r == heightOfItems / 2 + marginBetweenItems + heightOfItems
				     + marginBetweenItems + heightOfItems / 2
				  == 2 * ( heightOfItems + marginBetweenItems )
			Let r' be the distance from "o" to the center of item 2.
			This distance is measured along a line that slopes at 45 degrees.
			Hence
				r'/sqrt(2) == heightOfItems / 2 + marginBetweenItems
				              + heightOfItems / 2
				r' == sqrt(2) * ( heightOfItems + marginBetweenItems )
				   == r / sqrt(2)
		*/
        const heightOfItem = RadialMenu.textHeight + 2 * RadialMenu.marginAroundText;
        const radius = 2 * (heightOfItem + RadialMenu.marginBetweenItems);
        const radiusPrime = radius / Math.SQRT2;

        for (let i = 1; i <= N; ++i) {
            if (this.label[i].length > 0 && this.isEnabled[i]) {
                const theta = (i - 1) * Math.PI / 4 - Math.PI / 2;
                // compute center of ith label
                let x = ((i % 2) === 1 ? radius : radiusPrime) * Math.cos(theta) + this.x0;
                let y = ((i % 2) === 1 ? radius : radiusPrime) * Math.sin(theta) + this.y0;

                if (i === 1 && this.label[2].length === 0 && this.label[8].length === 0) {
                    y = -radius / 2 + this.y0;
                } else if (i === 5 && this.label[4].length === 0 && this.label[6].length === 0) {
                    y = radius / 2 + this.y0;
                }

                const stringWidth = draw2.stringWidth(this.label[i]);
                let widthOfItem = stringWidth + 2 * RadialMenu.marginAroundText;

                // We want items that appear side-by-side to have the same width,
                // so that the menu is symmetrical about a vertical axis.
                if (i !== 1 && i !== 5 && this.label[N + 2 - i].length > 0) {
                    const otherStringWidth = draw2.stringWidth(this.label[N + 2 - i]);
                    if (otherStringWidth > stringWidth) { widthOfItem = otherStringWidth + 2 * RadialMenu.marginAroundText; }
                }

                if (i === 2 || i === 4) {
                    if (x - widthOfItem / 2 <= this.x0 + RadialMenu.marginBetweenItems)
                    // item is too far to the left; shift it to the right
                    { x = this.x0 + RadialMenu.marginBetweenItems + widthOfItem / 2; }
                } else if (i === 3) {
                    if (x - widthOfItem / 2 <= this.x0 + RadialMenu.radiusOfNeutralZone + RadialMenu.marginBetweenItems)
                    // item is too far to the left; shift it to the right
                    { x = this.x0 + RadialMenu.radiusOfNeutralZone + RadialMenu.marginBetweenItems + widthOfItem / 2; }
                } else if (i === 6 || i === 8) {
                    if (x + widthOfItem / 2 >= this.x0 - RadialMenu.marginBetweenItems)
                    // item is too far to the right; shift it to the left
                    { x = this.x0 - RadialMenu.marginBetweenItems - widthOfItem / 2; }
                } else if (i === 7) {
                    if (x + widthOfItem / 2 >= this.x0 - RadialMenu.radiusOfNeutralZone - RadialMenu.marginBetweenItems)
                    // item is too far to the right; shift it to the left
                    { x = this.x0 - RadialMenu.radiusOfNeutralZone - RadialMenu.marginBetweenItems - widthOfItem / 2; }
                }

                if (this.isItemHilited(i)) { draw2.setFillColor(fg1, fg1, fg1, alpha); } else { draw2.setFillColor(bg, bg, bg, alpha); }
                draw2.fillRect(
                    x - widthOfItem / 2, y - heightOfItem / 2,
                    widthOfItem, heightOfItem
                );
                if (!this.isItemHilited(i)) {
                    draw2.setStrokeColor(fg1, fg1, fg1);
                    draw2.setFillColor(fg1, fg1, fg1);
                } else {
                    draw2.setStrokeColor(bg, bg, bg);
                    draw2.setFillColor(bg, bg, bg);
                }
                draw2.drawRect(
                    x - widthOfItem / 2, y - heightOfItem / 2,
                    widthOfItem, heightOfItem
                );
                draw2.drawString(
                    x - stringWidth / 2,
                    y + RadialMenu.textHeight / 2,
                    this.label[i]
                );
            }
        }
    },

    draw(draw2) {
        if (!this.isVisible) { return; }
        this.drawMenuItems(draw2, false, false, 0);
    }

};

// ============================================================
// A control menu.
// To create a new instance, use the new keyword:
//    var cm = new ControlMenu();
// ============================================================

function ControlMenu() {
    // During drag events, when this is false,
    // we are in parameter-control mode,
    // and the drag events should be interpreted by the client
    // to control the parameter that was selected by the user.
    this.isInMenuingMode = false;
}
ControlMenu.prototype = new RadialMenu();
ControlMenu.prototype.pressEvent = function (x, y) {
    this.isInMenuingMode = true;
    return RadialMenu.prototype.pressEvent.call(this, x, y);
};
ControlMenu.prototype.dragEvent = function (x, y) {
    if (!this.isVisible) { return false; }
    if (this.isInMenuingMode) {
        const returnValue = RadialMenu.prototype.dragEvent.call(this, x, y);
        const distanceSquared = new Vector2D(x - this.x0, y - this.y0).normSquared();
        if (distanceSquared > ControlMenu.menuRadius * ControlMenu.menuRadius) {
            // It is time to transition from menuing mode to parameter-control mode.
            this.isInMenuingMode = false;
            return true;
        }
        return returnValue;
    }
    // The widget is not in menuing mode, it is in parameter-control mode,
    // and the client is supposed to process the event.
    return false;
};
ControlMenu.prototype.draw = function (draw2) {
    if (!this.isVisible) { return; }
    this.drawMenuItems(draw2, this.isInMenuingMode, true, ControlMenu.menuRadius);
};

// static constant
ControlMenu.menuRadius = RadialMenu.radiusOfNeutralZone * 6;

// ============================================================
// Stroke objects are for storing a continuous polygonal line of ink.
// It is made up of points in world space.
// To create a new instance, use the new keyword:
//    var s = new Stroke();
// ============================================================

function Stroke() {
    this.points = []; // these points are in world space

    this.boundingRectangle = new Box2D();
    this.isBoundingRectangleDirty = true;
}
Stroke.prototype = {
    pushPoint(q) {
        this.points.push(q);
        this.isBoundingRectangleDirty = true;
    },
    getBoundingRectangle() {
        if (this.isBoundingRectangleDirty) {
            this.boundingRectangle.clear();
            this.boundingRectangle.boundPoints(this.points);
            this.isBoundingRectangleDirty = false;
        }
        return this.boundingRectangle;
    },
    isContainedInRectangle(rectangle /* an instance of Box2D */) {
        return rectangle.containsBox(this.getBoundingRectangle());
    },
    isContainedInLassoPolygon(polygonPoints /* an array of Vector2D in world space */) {
        for (let i = 0; i < this.points.length; ++i) {
            if (!Vector2D.isPointInsidePolygon(this.points[i], polygonPoints)) { return false; }
        }
        return true;
    },
    translate(v /* an instance of Vector2D */) {
        for (let i = 0; i < this.points.length; ++i) {
            const p = this.points[i];
            p.copy(Vector2D.sum(p, v));
        }
        this.isBoundingRectangleDirty = true;
    },
    rotate(angle /* in radians */, center /* instance of Vector2D, in world space */) {
        const sine = Math.sin(angle);
        const cosine = Math.cos(angle);
        for (let i = 0; i < this.points.length; ++i) {
            const p = this.points[i];
            const deltaX = p.x - center.x;
            const deltaY = p.y - center.y;
            const new_x = center.x + deltaX * cosine - deltaY * sine;
            const new_y = center.y + deltaX * sine + deltaY * cosine;
            p.x = new_x;
            p.y = new_y;
        }
        this.isBoundingRectangleDirty = true;
    },
    draw(draw2) {
        draw2.drawPolyline(this.points);
    }
};

// ============================================================
// Drawing objects are for storing a set of Strokes.
// To create a new instance, use the new keyword:
//    var d = new Drawing();
// ============================================================

function Drawing() {
    this.strokes = [];

    this.boundingRectangle = new Box2D();
    this.isBoundingRectangleDirty = true;
}
Drawing.prototype = {
    pushStroke(s) {
        this.strokes.push(s);
        this.isBoundingRectangleDirty = true;
    },
    clear() {
        this.strokes = [];
        this.boundingRectangle.clear();
    },
    getBoundingRectangle() {
        if (this.isBoundingRectangleDirty) {
            this.boundingRectangle.clear();
            for (let i = 0; i < this.strokes.length; ++i) {
                const s = this.strokes[i];
                this.boundingRectangle.boundBox(s.getBoundingRectangle());
            }
            this.isBoundingRectangleDirty = false;
        }
        return this.boundingRectangle;
    },

    draw(draw2) {
        // draw2.setLineWidth( 5 );
        for (let i = 0; i < this.strokes.length; ++i) {
            const s = this.strokes[i];
            s.draw(draw2);
        }
        // draw2.setLineWidth( 1 );
    }
};

// ============================================================

const canvas = document.getElementById('myCanvas');
// var canvas_context = canvas.getContext("2d");
const draw2 = new Draw2D(canvas);
const drawing = new Drawing();

const radialMenu = new RadialMenu();
const controlMenu = new ControlMenu();

// stores a subset of the strokes
let selectedStrokes = []; // an array of instances of Stroke

let mouseX,
    mouseY,
    previousMouseX,
    previousMouseY,
    drag_start_x,
    drag_start_y;
let mouseHistory = []; // array of Vector2D in pixel space

const zoomFactorPerPixelDragged = 1.005;

window.showMouseCoordinates = false;

// The below tool modes are constants,
// but are defined using var instead of const
// so that they will be accessible in the definitions
// of the input tags at the top of this file
// (bug fix for the Edge web browser)
const TOOL_MODE_PENCIL = 0;
const TOOL_MODE_RECT_SELECT = 1;
const TOOL_MODE_MOVE_SELECTION = 2;
const NUM_TOOL_MODES = 3;
let currentToolMode = TOOL_MODE_PENCIL;

const DRAG_MODE_NONE = 0;
const DRAG_MODE_TRANSLATE = 1;
const DRAG_MODE_ZOOM = 2;
const DRAG_MODE_TOOL = 3; // in this case, the currentToolMode could be pencil, rect_select, move_selection
let currentDragMode = DRAG_MODE_NONE;

const CONTROL_NONE = 0;
const CONTROL_PENCIL = 1;
const CONTROL_RECT_SELECT = 2;
const CONTROL_MOVE_SELECTION = 3;
const CONTROL_TRANSLATE = 4;
const CONTROL_ZOOM = 5;

radialMenu.setItemLabelAndID(RadialMenu.CENTRAL_ITEM, '', -1);
radialMenu.setItemLabelAndID(RadialMenu.NORTH, 'Pencil', TOOL_MODE_PENCIL);
radialMenu.setItemLabelAndID(RadialMenu.EAST, 'Rectangle Select', TOOL_MODE_RECT_SELECT);
radialMenu.setItemLabelAndID(RadialMenu.WEST, 'Move Selection', TOOL_MODE_MOVE_SELECTION);

controlMenu.setItemLabelAndID(RadialMenu.CENTRAL_ITEM, '', -1);
controlMenu.setItemLabelAndID(RadialMenu.NORTH, 'Pencil', CONTROL_PENCIL);
controlMenu.setItemLabelAndID(RadialMenu.EAST, 'Rectangle Select', CONTROL_RECT_SELECT);
controlMenu.setItemLabelAndID(RadialMenu.WEST, 'Move Selection', CONTROL_MOVE_SELECTION);
controlMenu.setItemLabelAndID(RadialMenu.SOUTH_EAST, 'Translate', CONTROL_TRANSLATE);
controlMenu.setItemLabelAndID(RadialMenu.SOUTH_WEST, 'Zoom', CONTROL_ZOOM);


const redraw = () => {
    draw2.setFontHeight(RadialMenu.textHeight);
    draw2.clear(255, 255, 255);
    draw2.setCoordinateSystemToWorldSpaceUnits();
    draw2.setFillColor(255, 128, 0, 0.3); // transparent orange
    // draw filled rectangles over the selected strokes
    for (let i = 0; i < selectedStrokes.length; ++i) {
        const s = selectedStrokes[i];
        const r = s.getBoundingRectangle();
        draw2.fillRect(r.min.x, r.min.y, r.width(), r.height());
    }

    draw2.setStrokeColor(0, 0, 0); // black
    drawing.draw(draw2);

    draw2.setCoordinateSystemToPixels();

    if (currentDragMode == DRAG_MODE_TOOL) {
        switch (currentToolMode) {
            case TOOL_MODE_PENCIL:
                draw2.setStrokeColor(0, 0, 0); // black
                draw2.drawPolyline(mouseHistory);
                break;
            case TOOL_MODE_RECT_SELECT:
                draw2.setFillColor(255, 128, 0, 0.3); // transparent orange
                draw2.fillRect(drag_start_x, drag_start_y, mouseX - drag_start_x, mouseY - drag_start_y);
                draw2.setStrokeColor(255, 0, 0); // red
                draw2.drawRect(drag_start_x, drag_start_y, mouseX - drag_start_x, mouseY - drag_start_y);
                break;
            case TOOL_MODE_MOVE_SELECTION:
                break;
        }
    }

    if (radialMenu.isVisible) { radialMenu.draw(draw2); }
    if (controlMenu.isVisible) { controlMenu.draw(draw2); }

    if (showMouseCoordinates) {
        draw2.setFillColor(0, 0, 0);
        const x_world = draw2.convertPixelsToWorldSpaceUnitsX(mouseX);
        const y_world = draw2.convertPixelsToWorldSpaceUnitsY(mouseY);
        draw2.drawString(20, canvas.height - 20, `pixels:(${mouseX}, ${mouseY})   world:(${parseFloat(x_world).toFixed(2)}, ${parseFloat(y_world).toFixed(2)})`);
    }
};

redraw();

// for use with MouseEvent.button
const BUTTON_LEFT = 0;
const BUTTON_MIDDLE = 1;
const BUTTON_RIGHT = 2;
// for use with MouseEvent.buttons
const BUTTONS_BIT_LEFT = 1;
const BUTTONS_BIT_MIDDLE = 4;
const BUTTONS_BIT_RIGHT = 2;


window.mouseDownHandler = e => {
    const canvas_rectangle = canvas.getBoundingClientRect();
    mouseX = e.clientX - canvas_rectangle.left;
    mouseY = e.clientY - canvas_rectangle.top;
    // console.log("mouse down");
    // console.log("   " + mouseX + "," + mouseY);

    if (currentDragMode !== DRAG_MODE_NONE)
    // The user is already dragging with a previously pressed button,
    // so ignore the press event from this new button.
    { return; }

    drag_start_x = previousMouseX = mouseX;
    drag_start_y = previousMouseY = mouseY;

    if (controlMenu.isVisible || (e.button === BUTTON_RIGHT && e.shiftKey)) {
        if (controlMenu.pressEvent(mouseX, mouseY)) { redraw(); }
    } else if (radialMenu.isVisible || (e.button === BUTTON_RIGHT)) {
        if (radialMenu.pressEvent(mouseX, mouseY)) { redraw(); }
    } else if (e.button === BUTTON_LEFT && e.shiftKey) {
        currentDragMode = DRAG_MODE_TRANSLATE;
    } else if (e.button === BUTTON_LEFT && e.ctrlKey) {
        currentDragMode = DRAG_MODE_ZOOM;
    } else if (e.button === BUTTON_LEFT) {
        mouseHistory = [];
        mouseHistory.push(new Vector2D(mouseX, mouseY));
        currentDragMode = DRAG_MODE_TOOL;
    }
};

window.mouseUpHandler = e => {
    let i;
    // var canvas_rectangle = canvas.getBoundingClientRect();
    // mouseX = e.clientX - canvas_rectangle.left;
    // mouseY = e.clientY - canvas_rectangle.top;
    // console.log("mouse up");
    if (controlMenu.isVisible && e.button === BUTTON_RIGHT) {
        if (controlMenu.releaseEvent(mouseX, mouseY)) { redraw(); }
    } else if (radialMenu.isVisible && e.button === BUTTON_RIGHT) {
        const returnValue = radialMenu.releaseEvent(mouseX, mouseY);

        const itemID = radialMenu.getIDOfSelection();
        if (itemID >= 0 && itemID < NUM_TOOL_MODES) {
            setToolMode(itemID, true);
        }

        if (returnValue) { redraw(); }
    } else if (currentDragMode == DRAG_MODE_TRANSLATE && e.button === BUTTON_LEFT) {
        currentDragMode = DRAG_MODE_NONE;
    } else if (currentDragMode == DRAG_MODE_ZOOM && e.button === BUTTON_LEFT) {
        currentDragMode = DRAG_MODE_NONE;
    } else if (currentDragMode == DRAG_MODE_TOOL && e.button === BUTTON_LEFT) {
        let newStroke;
        switch (currentToolMode) {
            case TOOL_MODE_PENCIL:
                newStroke = new Stroke();
                for (i = 0; i < mouseHistory.length; ++i) {
                    newStroke.pushPoint(draw2.convertPixelsToWorldSpaceUnits(mouseHistory[i]));
                }
                drawing.pushStroke(newStroke);
                break;
            case TOOL_MODE_RECT_SELECT:
                // complete a rectangle selection
                var selectedRectangle = new Box2D(
                    draw2.convertPixelsToWorldSpaceUnits(new Vector2D(drag_start_x, drag_start_y)),
                    draw2.convertPixelsToWorldSpaceUnits(new Vector2D(mouseX, mouseY))
                );
                selectedStrokes = [];
                for (i = 0; i < drawing.strokes.length; ++i) {
                    const s = drawing.strokes[i];
                    if (s.isContainedInRectangle(selectedRectangle)) { selectedStrokes.push(s); }
                }
                break;
            case TOOL_MODE_MOVE_SELECTION:
                break;
        }
        currentDragMode = DRAG_MODE_NONE;
        redraw();
    }
};

const mouseMoveHandler = e => {
    previousMouseX = mouseX;
    previousMouseY = mouseY;
    const canvas_rectangle = canvas.getBoundingClientRect();
    mouseX = e.clientX - canvas_rectangle.left;
    mouseY = e.clientY - canvas_rectangle.top;


    const deltaX = mouseX - previousMouseX;
    const deltaY = mouseY - previousMouseY;


    if (controlMenu.isVisible) {
        if (controlMenu.isInMenuingMode) {
            if (controlMenu.dragEvent(mouseX, mouseY)) { redraw(); }
        } else {
            // use the drag event to change the appropriate parameter
            switch (controlMenu.getIDOfSelection()) {
                case CONTROL_PENCIL:
                    break;
                case CONTROL_RECT_SELECT:
                    break;
                case CONTROL_MOVE_SELECTION:
                    const vector = Vector2D.diff(
                        draw2.convertPixelsToWorldSpaceUnits(new Vector2D(mouseX, mouseY)),
                        draw2.convertPixelsToWorldSpaceUnits(new Vector2D(previousMouseX, previousMouseY))
                    );
                    selectedStrokes.forEach(stroke => stroke.translate(vector));
                    drawing.isBoundingRectangleDirty = true;
                    break;
                case CONTROL_TRANSLATE:
                    draw2.translate(deltaX, deltaY);
                    break;
                case CONTROL_ZOOM:
                    draw2.zoomIn(
                        zoomFactorPerPixelDragged ** (deltaX - deltaY),
                        drag_start_x,
                        drag_start_y
                    );
                    break;
                default:
                    break;
            }
            redraw();
        }
    } else if (radialMenu.isVisible) {
        if (radialMenu.dragEvent(mouseX, mouseY)) { redraw(); }
    } else if (currentDragMode === DRAG_MODE_TRANSLATE) {
        draw2.translate(deltaX, deltaY);
        redraw();
    } else if (currentDragMode === DRAG_MODE_ZOOM) {
        draw2.zoomIn(Math.pow(zoomFactorPerPixelDragged, deltaX - deltaY), drag_start_x, drag_start_y);
        redraw();
    } else if (currentDragMode === DRAG_MODE_TOOL) {
        switch (currentToolMode) {
            case TOOL_MODE_PENCIL:
                mouseHistory.push(new Vector2D(mouseX, mouseY));
                break;
            case TOOL_MODE_RECT_SELECT:
                break;
            case TOOL_MODE_MOVE_SELECTION: {
                const vector = Vector2D.diff(
                    draw2.convertPixelsToWorldSpaceUnits(new Vector2D(mouseX, mouseY)),
                    draw2
                        .convertPixelsToWorldSpaceUnits(new Vector2D(
                            previousMouseX,
                            previousMouseY
                        ))
                );
                selectedStrokes.forEach(stroke => stroke.translate(vector));
                drawing.isBoundingRectangleDirty = true;
                break;
            }
            default:
                break;
        }
        redraw();
    } else if (showMouseCoordinates) {
        redraw();
    }
};

canvas.addEventListener('mousedown', mouseDownHandler);
canvas.addEventListener('mouseup', mouseUpHandler);
canvas.addEventListener('mousemove', mouseMoveHandler);
canvas.oncontextmenu = () => false; // disable the right-click menu


window.setToolMode = (toolMode, updateRadioButtons = false) => {
    currentToolMode = toolMode;
    mouseHistory = [];
    if (updateRadioButtons) {
        let idString = 'null';
        switch (toolMode) {
            case TOOL_MODE_PENCIL:
                idString = 'TOOL_MODE_PENCIL';
                break;
            case TOOL_MODE_RECT_SELECT:
                idString = 'TOOL_MODE_RECT_SELECT';
                break;
            case TOOL_MODE_MOVE_SELECTION:
                idString = 'TOOL_MODE_MOVE_SELECTION';
                break;
        }
        document.getElementById(idString).checked = true;
    }
};

window.frameAllButtonHandler = () => {
    draw2.frame(drawing.getBoundingRectangle(), true);
    redraw();
};

window.deleteSelectionButtonHandler = () => {
    for (let i = selectedStrokes.length - 1; i >= 0; --i) {
        const j = drawing.strokes.indexOf(selectedStrokes[i]);
        if (j >= 0)
        // this should really be moved into a method in the Drawing prototype
        { drawing.strokes.splice(j, 1); }
    }
    selectedStrokes = [];
    drawing.isBoundingRectangleDirty = true;

    redraw();
};

window.deleteAllButtonHandler = () => {
    selectedStrokes = [];
    // this should really be moved into a method in the Drawing prototype
    drawing.strokes = [];
    drawing.isBoundingRectangleDirty = true;

    redraw();
};
