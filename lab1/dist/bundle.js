/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _Vector2D = __webpack_require__(1);

var _Vector2D2 = _interopRequireDefault(_Vector2D);

var _Box2D = __webpack_require__(3);

var _Box2D2 = _interopRequireDefault(_Box2D);

var _Draw2D = __webpack_require__(2);

var _Draw2D2 = _interopRequireDefault(_Draw2D);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

    var N = 8;
    for (var i = 0; i <= N; ++i) {
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
    setItemLabelAndID: function setItemLabelAndID(index, /* string */s, id) {
        if (index >= 0 && index <= RadialMenu.N) {
            this.label[index] = s;
            this.itemID[index] = id;
        }
    },
    setItemLabel: function setItemLabel(index, /* string */s) {
        if (index >= 0 && index <= RadialMenu.N) {
            this.label[index] = s;
        }
    },
    getItemID: function getItemID(index) {
        if (index >= 0 && index <= RadialMenu.N) {
            return this.itemID[index];
        }
        return -1;
    },
    setEnabledByID: function setEnabledByID( /* boolean */flag, id) {
        for (var i = 0; i <= RadialMenu.N; ++i) {
            if (this.itemID[i] === id) {
                this.isEnabled[i] = flag;
            }
        }
    },


    // For internal use only.
    isItemHilited: function isItemHilited(index) {
        console.assert(index >= 0 && index <= RadialMenu.N);
        return this.itemID[index] === this.itemID[this.selectedItem];
    },


    // The client typically calls this after an interaction with the menu
    // is complete, to find out what the user selected.
    // Returns an index in the range [CENTRAL_ITEM,N]
    getSelection: function getSelection() {
        return this.selectedItem;
    },
    getIDOfSelection: function getIDOfSelection() {
        return this.getItemID(this.selectedItem);
    },


    // The below methods, that handle mouse events, return true if the client should redraw.
    pressEvent: function pressEvent(x, y) {
        this.x0 = this.mouseX = x;
        this.y0 = this.mouseY = y;
        this.selectedItem = RadialMenu.CENTRAL_ITEM;
        this.isVisible = true;
        return true;
    },
    releaseEvent: function releaseEvent(x, y) {
        if (this.isVisible) {
            this.isVisible = false;
            return true;
        }
        return false;
    },
    moveEvent: function moveEvent(x, y) {
        if (!this.isVisible) {
            return false;
        }
        // make the center of the menu follow the cursor
        this.x0 = this.mouseX = x;
        this.y0 = this.mouseY = y;
        return true;
    },
    dragEvent: function dragEvent(x, y) {
        if (!this.isVisible) {
            return false;
        }

        this.mouseX = x;
        this.mouseY = y;
        var dx = this.mouseX - this.x0;
        var dy = this.mouseY - this.y0;
        var radius = Math.sqrt(dx * dx + dy * dy);

        var newlySelectedItem = RadialMenu.CENTRAL_ITEM;

        if (radius > RadialMenu.radiusOfNeutralZone) {
            var theta = Math.asin(dy / radius);
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
                var minDifference = 4 * Math.PI;
                var itemWithMinDifference = RadialMenu.CENTRAL_ITEM;
                for (var candidateItem = 1; candidateItem <= RadialMenu.N; ++candidateItem) {
                    if (this.label[candidateItem].length > 0 && this.isEnabled[candidateItem]) {
                        var candidateItemTheta = (candidateItem - 1) * (Math.PI / 4) + Math.PI / 8;
                        var candidateDifference = Math.abs(candidateItemTheta - theta);
                        if (candidateDifference > Math.PI) {
                            candidateDifference = 2 * Math.PI - candidateDifference;
                        }
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
    drawMenuItems: function drawMenuItems(draw2, drawOnlyHilitedItem, // boolean; if false, all menu items are drawn
    drawUsingPieStyle, // boolean
    radiusOfPie // in pixels; only used if ``drawUsingPieStyle'' is true
    ) {
        var fg1 = RadialMenu.FOREGROUND_1;
        var fg2 = RadialMenu.FOREGROUND_2;
        var bg = RadialMenu.BACKGROUND;
        var alpha = RadialMenu.MENU_ALPHA;
        var N = RadialMenu.N;

        if (drawUsingPieStyle) {
            draw2.setFillColor(fg2, fg2, fg2, alpha);
            draw2.fillCircle(this.x0, this.y0, radiusOfPie);
        }

        if (this.isItemHilited(RadialMenu.CENTRAL_ITEM)) {
            draw2.setFillColor(fg1, fg1, fg1, alpha);
        } else {
            draw2.setFillColor(bg, bg, bg, alpha);
        }
        draw2.fillCircle(this.x0, this.y0, RadialMenu.radiusOfNeutralZone);
        if (!this.isItemHilited(RadialMenu.CENTRAL_ITEM)) {
            draw2.setStrokeColor(fg1, fg1, fg1);
        } else {
            draw2.setStrokeColor(bg, bg, bg);
        }
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
        var heightOfItem = RadialMenu.textHeight + 2 * RadialMenu.marginAroundText;
        var radius = 2 * (heightOfItem + RadialMenu.marginBetweenItems);
        var radiusPrime = radius / Math.SQRT2;

        for (var i = 1; i <= N; ++i) {
            if (this.label[i].length > 0 && this.isEnabled[i]) {
                var theta = (i - 1) * Math.PI / 4 - Math.PI / 2;
                // compute center of ith label
                var x = (i % 2 === 1 ? radius : radiusPrime) * Math.cos(theta) + this.x0;
                var y = (i % 2 === 1 ? radius : radiusPrime) * Math.sin(theta) + this.y0;

                if (i === 1 && this.label[2].length === 0 && this.label[8].length === 0) {
                    y = -radius / 2 + this.y0;
                } else if (i === 5 && this.label[4].length === 0 && this.label[6].length === 0) {
                    y = radius / 2 + this.y0;
                }

                var stringWidth = draw2.stringWidth(this.label[i]);
                var widthOfItem = stringWidth + 2 * RadialMenu.marginAroundText;

                // We want items that appear side-by-side to have the same width,
                // so that the menu is symmetrical about a vertical axis.
                if (i !== 1 && i !== 5 && this.label[N + 2 - i].length > 0) {
                    var otherStringWidth = draw2.stringWidth(this.label[N + 2 - i]);
                    if (otherStringWidth > stringWidth) {
                        widthOfItem = otherStringWidth + 2 * RadialMenu.marginAroundText;
                    }
                }

                if (i === 2 || i === 4) {
                    if (x - widthOfItem / 2 <= this.x0 + RadialMenu.marginBetweenItems)
                        // item is too far to the left; shift it to the right
                        {
                            x = this.x0 + RadialMenu.marginBetweenItems + widthOfItem / 2;
                        }
                } else if (i === 3) {
                    if (x - widthOfItem / 2 <= this.x0 + RadialMenu.radiusOfNeutralZone + RadialMenu.marginBetweenItems)
                        // item is too far to the left; shift it to the right
                        {
                            x = this.x0 + RadialMenu.radiusOfNeutralZone + RadialMenu.marginBetweenItems + widthOfItem / 2;
                        }
                } else if (i === 6 || i === 8) {
                    if (x + widthOfItem / 2 >= this.x0 - RadialMenu.marginBetweenItems)
                        // item is too far to the right; shift it to the left
                        {
                            x = this.x0 - RadialMenu.marginBetweenItems - widthOfItem / 2;
                        }
                } else if (i === 7) {
                    if (x + widthOfItem / 2 >= this.x0 - RadialMenu.radiusOfNeutralZone - RadialMenu.marginBetweenItems)
                        // item is too far to the right; shift it to the left
                        {
                            x = this.x0 - RadialMenu.radiusOfNeutralZone - RadialMenu.marginBetweenItems - widthOfItem / 2;
                        }
                }

                if (this.isItemHilited(i)) {
                    draw2.setFillColor(fg1, fg1, fg1, alpha);
                } else {
                    draw2.setFillColor(bg, bg, bg, alpha);
                }
                draw2.fillRect(x - widthOfItem / 2, y - heightOfItem / 2, widthOfItem, heightOfItem);
                if (!this.isItemHilited(i)) {
                    draw2.setStrokeColor(fg1, fg1, fg1);
                    draw2.setFillColor(fg1, fg1, fg1);
                } else {
                    draw2.setStrokeColor(bg, bg, bg);
                    draw2.setFillColor(bg, bg, bg);
                }
                draw2.drawRect(x - widthOfItem / 2, y - heightOfItem / 2, widthOfItem, heightOfItem);
                draw2.drawString(x - stringWidth / 2, y + RadialMenu.textHeight / 2, this.label[i]);
            }
        }
    },
    draw: function draw(draw2) {
        if (!this.isVisible) {
            return;
        }
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
    if (!this.isVisible) {
        return false;
    }
    if (this.isInMenuingMode) {
        var returnValue = RadialMenu.prototype.dragEvent.call(this, x, y);
        var distanceSquared = new _Vector2D2.default(x - this.x0, y - this.y0).normSquared();
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
    if (!this.isVisible) {
        return;
    }
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

    this.boundingRectangle = new _Box2D2.default();
    this.isBoundingRectangleDirty = true;
}
Stroke.prototype = {
    pushPoint: function pushPoint(q) {
        this.points.push(q);
        this.isBoundingRectangleDirty = true;
    },
    getBoundingRectangle: function getBoundingRectangle() {
        if (this.isBoundingRectangleDirty) {
            this.boundingRectangle.clear();
            this.boundingRectangle.boundPoints(this.points);
            this.isBoundingRectangleDirty = false;
        }
        return this.boundingRectangle;
    },
    isContainedInRectangle: function isContainedInRectangle(rectangle /* an instance of Box2D */) {
        return rectangle.containsBox(this.getBoundingRectangle());
    },
    isContainedInLassoPolygon: function isContainedInLassoPolygon(polygonPoints /* an array of Vector2D in world space */) {
        for (var i = 0; i < this.points.length; ++i) {
            if (!_Vector2D2.default.isPointInsidePolygon(this.points[i], polygonPoints)) {
                return false;
            }
        }
        return true;
    },
    translate: function translate(v /* an instance of Vector2D */) {
        for (var i = 0; i < this.points.length; ++i) {
            var p = this.points[i];
            p.copy(_Vector2D2.default.sum(p, v));
        }
        this.isBoundingRectangleDirty = true;
    },
    rotate: function rotate(angle /* in radians */, center /* instance of Vector2D, in world space */) {
        var sine = Math.sin(angle);
        var cosine = Math.cos(angle);
        for (var i = 0; i < this.points.length; ++i) {
            var p = this.points[i];
            var deltaX = p.x - center.x;
            var deltaY = p.y - center.y;
            var new_x = center.x + deltaX * cosine - deltaY * sine;
            var new_y = center.y + deltaX * sine + deltaY * cosine;
            p.x = new_x;
            p.y = new_y;
        }
        this.isBoundingRectangleDirty = true;
    },
    draw: function draw(draw2) {
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

    this.boundingRectangle = new _Box2D2.default();
    this.isBoundingRectangleDirty = true;
}
Drawing.prototype = {
    pushStroke: function pushStroke(s) {
        this.strokes.push(s);
        this.isBoundingRectangleDirty = true;
    },
    clear: function clear() {
        this.strokes = [];
        this.boundingRectangle.clear();
    },
    getBoundingRectangle: function getBoundingRectangle() {
        if (this.isBoundingRectangleDirty) {
            this.boundingRectangle.clear();
            for (var i = 0; i < this.strokes.length; ++i) {
                var s = this.strokes[i];
                this.boundingRectangle.boundBox(s.getBoundingRectangle());
            }
            this.isBoundingRectangleDirty = false;
        }
        return this.boundingRectangle;
    },
    draw: function draw(draw2) {
        // draw2.setLineWidth( 5 );
        for (var i = 0; i < this.strokes.length; ++i) {
            var s = this.strokes[i];
            s.draw(draw2);
        }
        // draw2.setLineWidth( 1 );
    }
};

// ============================================================

var canvas = document.getElementById('myCanvas');
// var canvas_context = canvas.getContext("2d");
var draw2 = new _Draw2D2.default(canvas);
var drawing = new Drawing();

var radialMenu = new RadialMenu();
var controlMenu = new ControlMenu();

// stores a subset of the strokes
var selectedStrokes = []; // an array of instances of Stroke

var mouseX = void 0,
    mouseY = void 0,
    previousMouseX = void 0,
    previousMouseY = void 0,
    drag_start_x = void 0,
    drag_start_y = void 0;
var mouseHistory = []; // array of Vector2D in pixel space

var zoomFactorPerPixelDragged = 1.005;

window.showMouseCoordinates = false;

// The below tool modes are constants,
// but are defined using var instead of const
// so that they will be accessible in the definitions
// of the input tags at the top of this file
// (bug fix for the Edge web browser)
var TOOL_MODE_PENCIL = 0;
var TOOL_MODE_RECT_SELECT = 1;
var TOOL_MODE_MOVE_SELECTION = 2;
var NUM_TOOL_MODES = 3;
var currentToolMode = TOOL_MODE_PENCIL;

var DRAG_MODE_NONE = 0;
var DRAG_MODE_TRANSLATE = 1;
var DRAG_MODE_ZOOM = 2;
var DRAG_MODE_TOOL = 3; // in this case, the currentToolMode could be pencil, rect_select, move_selection
var currentDragMode = DRAG_MODE_NONE;

var CONTROL_NONE = 0;
var CONTROL_PENCIL = 1;
var CONTROL_RECT_SELECT = 2;
var CONTROL_MOVE_SELECTION = 3;
var CONTROL_TRANSLATE = 4;
var CONTROL_ZOOM = 5;

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

var redraw = function redraw() {
    draw2.setFontHeight(RadialMenu.textHeight);
    draw2.clear(255, 255, 255);
    draw2.setCoordinateSystemToWorldSpaceUnits();
    draw2.setFillColor(255, 128, 0, 0.3); // transparent orange
    // draw filled rectangles over the selected strokes
    for (var i = 0; i < selectedStrokes.length; ++i) {
        var s = selectedStrokes[i];
        var r = s.getBoundingRectangle();
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

    if (radialMenu.isVisible) {
        radialMenu.draw(draw2);
    }
    if (controlMenu.isVisible) {
        controlMenu.draw(draw2);
    }

    if (showMouseCoordinates) {
        draw2.setFillColor(0, 0, 0);
        var x_world = draw2.convertPixelsToWorldSpaceUnitsX(mouseX);
        var y_world = draw2.convertPixelsToWorldSpaceUnitsY(mouseY);
        draw2.drawString(20, canvas.height - 20, 'pixels:(' + mouseX + ', ' + mouseY + ')   world:(' + parseFloat(x_world).toFixed(2) + ', ' + parseFloat(y_world).toFixed(2) + ')');
    }
};

redraw();

// for use with MouseEvent.button
var BUTTON_LEFT = 0;
var BUTTON_MIDDLE = 1;
var BUTTON_RIGHT = 2;
// for use with MouseEvent.buttons
var BUTTONS_BIT_LEFT = 1;
var BUTTONS_BIT_MIDDLE = 4;
var BUTTONS_BIT_RIGHT = 2;

window.mouseDownHandler = function (e) {
    var canvas_rectangle = canvas.getBoundingClientRect();
    mouseX = e.clientX - canvas_rectangle.left;
    mouseY = e.clientY - canvas_rectangle.top;
    // console.log("mouse down");
    // console.log("   " + mouseX + "," + mouseY);

    if (currentDragMode !== DRAG_MODE_NONE)
        // The user is already dragging with a previously pressed button,
        // so ignore the press event from this new button.
        {
            return;
        }

    drag_start_x = previousMouseX = mouseX;
    drag_start_y = previousMouseY = mouseY;

    if (controlMenu.isVisible || e.button === BUTTON_RIGHT && e.shiftKey) {
        if (controlMenu.pressEvent(mouseX, mouseY)) {
            redraw();
        }
    } else if (radialMenu.isVisible || e.button === BUTTON_RIGHT) {
        if (radialMenu.pressEvent(mouseX, mouseY)) {
            redraw();
        }
    } else if (e.button === BUTTON_LEFT && e.shiftKey) {
        currentDragMode = DRAG_MODE_TRANSLATE;
    } else if (e.button === BUTTON_LEFT && e.ctrlKey) {
        currentDragMode = DRAG_MODE_ZOOM;
    } else if (e.button === BUTTON_LEFT) {
        mouseHistory = [];
        mouseHistory.push(new _Vector2D2.default(mouseX, mouseY));
        currentDragMode = DRAG_MODE_TOOL;
    }
};

window.mouseUpHandler = function (e) {
    var i = void 0;
    // var canvas_rectangle = canvas.getBoundingClientRect();
    // mouseX = e.clientX - canvas_rectangle.left;
    // mouseY = e.clientY - canvas_rectangle.top;
    // console.log("mouse up");
    if (controlMenu.isVisible && e.button === BUTTON_RIGHT) {
        if (controlMenu.releaseEvent(mouseX, mouseY)) {
            redraw();
        }
    } else if (radialMenu.isVisible && e.button === BUTTON_RIGHT) {
        var returnValue = radialMenu.releaseEvent(mouseX, mouseY);

        var itemID = radialMenu.getIDOfSelection();
        if (itemID >= 0 && itemID < NUM_TOOL_MODES) {
            setToolMode(itemID, true);
        }

        if (returnValue) {
            redraw();
        }
    } else if (currentDragMode == DRAG_MODE_TRANSLATE && e.button === BUTTON_LEFT) {
        currentDragMode = DRAG_MODE_NONE;
    } else if (currentDragMode == DRAG_MODE_ZOOM && e.button === BUTTON_LEFT) {
        currentDragMode = DRAG_MODE_NONE;
    } else if (currentDragMode == DRAG_MODE_TOOL && e.button === BUTTON_LEFT) {
        var newStroke = void 0;
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
                var selectedRectangle = new _Box2D2.default(draw2.convertPixelsToWorldSpaceUnits(new _Vector2D2.default(drag_start_x, drag_start_y)), draw2.convertPixelsToWorldSpaceUnits(new _Vector2D2.default(mouseX, mouseY)));
                selectedStrokes = [];
                for (i = 0; i < drawing.strokes.length; ++i) {
                    var s = drawing.strokes[i];
                    if (s.isContainedInRectangle(selectedRectangle)) {
                        selectedStrokes.push(s);
                    }
                }
                break;
            case TOOL_MODE_MOVE_SELECTION:
                break;
        }
        currentDragMode = DRAG_MODE_NONE;
        redraw();
    }
};

var mouseMoveHandler = function mouseMoveHandler(e) {
    previousMouseX = mouseX;
    previousMouseY = mouseY;
    var canvas_rectangle = canvas.getBoundingClientRect();
    mouseX = e.clientX - canvas_rectangle.left;
    mouseY = e.clientY - canvas_rectangle.top;

    var deltaX = mouseX - previousMouseX;
    var deltaY = mouseY - previousMouseY;

    if (controlMenu.isVisible) {
        if (controlMenu.isInMenuingMode) {
            if (controlMenu.dragEvent(mouseX, mouseY)) {
                redraw();
            }
        } else {
            // use the drag event to change the appropriate parameter
            switch (controlMenu.getIDOfSelection()) {
                case CONTROL_PENCIL:
                    break;
                case CONTROL_RECT_SELECT:
                    break;
                case CONTROL_MOVE_SELECTION:
                    var vector = _Vector2D2.default.diff(draw2.convertPixelsToWorldSpaceUnits(new _Vector2D2.default(mouseX, mouseY)), draw2.convertPixelsToWorldSpaceUnits(new _Vector2D2.default(previousMouseX, previousMouseY)));
                    selectedStrokes.forEach(function (stroke) {
                        return stroke.translate(vector);
                    });
                    drawing.isBoundingRectangleDirty = true;
                    break;
                case CONTROL_TRANSLATE:
                    draw2.translate(deltaX, deltaY);
                    break;
                case CONTROL_ZOOM:
                    draw2.zoomIn(Math.pow(zoomFactorPerPixelDragged, deltaX - deltaY), drag_start_x, drag_start_y);
                    break;
                default:
                    break;
            }
            redraw();
        }
    } else if (radialMenu.isVisible) {
        if (radialMenu.dragEvent(mouseX, mouseY)) {
            redraw();
        }
    } else if (currentDragMode === DRAG_MODE_TRANSLATE) {
        draw2.translate(deltaX, deltaY);
        redraw();
    } else if (currentDragMode === DRAG_MODE_ZOOM) {
        draw2.zoomIn(Math.pow(zoomFactorPerPixelDragged, deltaX - deltaY), drag_start_x, drag_start_y);
        redraw();
    } else if (currentDragMode === DRAG_MODE_TOOL) {
        switch (currentToolMode) {
            case TOOL_MODE_PENCIL:
                mouseHistory.push(new _Vector2D2.default(mouseX, mouseY));
                break;
            case TOOL_MODE_RECT_SELECT:
                break;
            case TOOL_MODE_MOVE_SELECTION:
                {
                    var _vector = _Vector2D2.default.diff(draw2.convertPixelsToWorldSpaceUnits(new _Vector2D2.default(mouseX, mouseY)), draw2.convertPixelsToWorldSpaceUnits(new _Vector2D2.default(previousMouseX, previousMouseY)));
                    selectedStrokes.forEach(function (stroke) {
                        return stroke.translate(_vector);
                    });
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
canvas.oncontextmenu = function () {
    return false;
}; // disable the right-click menu


window.setToolMode = function (toolMode) {
    var updateRadioButtons = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    currentToolMode = toolMode;
    mouseHistory = [];
    if (updateRadioButtons) {
        var idString = 'null';
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

window.frameAllButtonHandler = function () {
    draw2.frame(drawing.getBoundingRectangle(), true);
    redraw();
};

window.deleteSelectionButtonHandler = function () {
    for (var i = selectedStrokes.length - 1; i >= 0; --i) {
        var j = drawing.strokes.indexOf(selectedStrokes[i]);
        if (j >= 0)
            // this should really be moved into a method in the Drawing prototype
            {
                drawing.strokes.splice(j, 1);
            }
    }
    selectedStrokes = [];
    drawing.isBoundingRectangleDirty = true;

    redraw();
};

window.deleteAllButtonHandler = function () {
    selectedStrokes = [];
    // this should really be moved into a method in the Drawing prototype
    drawing.strokes = [];
    drawing.isBoundingRectangleDirty = true;

    redraw();
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vector2D = function () {
    function Vector2D() {
        var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        _classCallCheck(this, Vector2D);

        this.x = x;
        this.y = y;
    }

    _createClass(Vector2D, [{
        key: "copy",
        value: function copy(other) {
            this.x = other.x;
            this.y = other.y;
        }
    }, {
        key: "negate",
        value: function negate() {
            return new Vector2D(-this.x, -this.y);
        }
    }, {
        key: "norm",
        value: function norm() {
            return Math.sqrt(this.normSquared());
        }
    }, {
        key: "normSquared",
        value: function normSquared() {
            return this.x * this.x + this.y * this.y;
        }
    }, {
        key: "normalize",
        value: function normalize() {
            var norm = this.norm();
            if (norm) {
                var k = 1.0 / norm;
                return new Vector2D(k * this.x, k * this.y);
            }
            return new Vector2D();
        }
    }], [{
        key: "sum",
        value: function sum(vector1, vector2) {
            return new Vector2D(vector1.x + vector2.x, vector1.y + vector2.y);
        }
    }, {
        key: "diff",
        value: function diff(vector1, vector2) {
            return new Vector2D(vector1.x - vector2.x, vector1.y - vector2.y);
        }
    }, {
        key: "multiply",
        value: function multiply(vector, factor) {
            return new Vector2D(vector.x * factor, vector.y * factor);
        }
    }, {
        key: "dot",
        value: function dot(vector1, vector2) {
            return vector1.x * vector2.x + vector1.y * vector2.y;
        }
    }, {
        key: "average",
        value: function average(vector1, vector2) {
            return new Vector2D((vector1.x + vector2.x) * 0.5, (vector1.y + vector2.y) * 0.5);
        }
    }, {
        key: "centroidOfPoints",
        value: function centroidOfPoints(points) {
            var _points$reduce = points.reduce(function (centroid, point) {
                return Object.assign({
                    x: centroid.x + point.x,
                    y: centroid.y + point.y
                });
            }, { x: 0, y: 0 }),
                centerX = _points$reduce.x,
                centerY = _points$reduce.y;

            return new Vector2D(points.length ? centerX / points.length : centerX, points.length ? centerY / points.length : centerY);
        }
    }, {
        key: "isPointInsidePolygon",
        value: function isPointInsidePolygon(queryPoint, polygon) {
            if (polygon.length < 3) {
                return false;
            }

            var returnValue = false;

            polygon.forEach(function (cursorPoint, i) {
                var previousPoint = polygon[(i || polygon.length) - 1];

                if ((cursorPoint.y < queryPoint.y && queryPoint.y < previousPoint.y || previousPoint.y <= queryPoint.y && queryPoint.y < cursorPoint.y) && queryPoint.x < (previousPoint.x - cursorPoint.x) * (queryPoint.y - cursorPoint.i) / (previousPoint.y - cursorPoint.y) + cursorPoint.x) {
                    returnValue = !returnValue;
                }
            });

            return returnValue;
        }
    }, {
        key: "convexHull",
        value: function convexHull(input) {
            var cross = function cross(o, a, b) {
                return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.y - o.x);
            };

            var points = [].concat(_toConsumableArray(input));

            points.sort(function (a, b) {
                return a.x === b.x ? a.y - b.y : a.x - b.x;
            });

            var lower = points.reduce(function (lowerInProgress, point) {
                while (lowerInProgress.length >= 2 && cross(lowerInProgress[lowerInProgress.length - 2], lowerInProgress[lowerInProgress.length - 1], point) <= 0) {
                    lowerInProgress.pop();
                }
                return [].concat(_toConsumableArray(lowerInProgress), [point]);
            }, []);

            var upper = points.reduce(function (upperInProgress, point) {
                while (upperInProgress.length >= 2 && cross(upperInProgress[upperInProgress.length - 2], upperInProgress[upperInProgress.length - 1], point) <= 0) {
                    upperInProgress.pop();
                }
                return [].concat(_toConsumableArray(upperInProgress), [point]);
            }, []);

            upper.pop();
            lower.pop();

            return [].concat(_toConsumableArray(lower), _toConsumableArray(upper));
        }
    }, {
        key: "computeExpandedPolygon",
        value: function computeExpandedPolygon(inputPoints, marginThickness) {
            if (!inputPoints.length) {
                return [];
            } else if (inputPoints.length === 1) {
                return Vector2D.computeExpandedPolygonForOnePoint(inputPoints[0], marginThickness);
            } else if (inputPoints.length === 2) {
                return Vector2D.computeExpandedPolygonForTwoPoint(inputPoints, marginThickness);
            }
            return Vector2D.computeExpandedPolygonForMultiPoints(inputPoints, marginThickness);
        }
    }, {
        key: "computeExpandedPolygonForOnePoint",
        value: function computeExpandedPolygonForOnePoint(point, marginThickness) {
            return [new Vector2D(point.x - marginThickness, point.y), new Vector2D(point.x, point.y - marginThickness), new Vector2D(point.x + marginThickness, point.y), new Vector2D(point.x, point.y + marginThickness)];
        }
    }, {
        key: "computeExpandedPolygonForTwoPoint",
        value: function computeExpandedPolygonForTwoPoint(_ref, marginThickness) {
            var _ref2 = _slicedToArray(_ref, 2),
                point0 = _ref2[0],
                point1 = _ref2[1];

            var vector0 = Vector2D.multiply(Vector2D.diff(point0, point1).normalize(), marginThickness);

            var vector1 = new Vector2D(-vector0.y, vector0.x);

            return [Vector2D.sum(point0, vector1), Vector2D.sum(point0, vector0.negate()), Vector2D.sum(point0, vector1.negate()), Vector2D.sum(point1, vector1.negate()), Vector2D.sum(point1, vector0), Vector2D.sum(point1, vector1)];
        }
    }, {
        key: "computeExpandedPolygonForMultiPoints",
        value: function computeExpandedPolygonForMultiPoints(points, marginThickness) {
            return points.reduce(function (expandedPolygon, cursorPoint, i) {
                var previousPoint = points[(i || points.length) - 1];
                var nextPoint = points[(i + 1) % points.length];
                var previousVector = Vector2D.diff(cursorPoint, previousPoint).normalize();
                var nextVector = Vector2D.diff(cursorPoint, nextPoint).normalize();

                return [].concat(_toConsumableArray(expandedPolygon), [Vector2D.sum(cursorPoint, Vector2D.multiply([previousVector.y, -previousVector.x], marginThickness)), Vector2D.sum(cursorPoint, Vector2D.multiply(Vector2D.sum(nextVector, previousVector).normalize(), marginThickness)), Vector2D.sum(cursorPoint, Vector2D.multiply([-nextVector.y, nextVector.x], marginThickness))]);
            }, []);
        }
    }]);

    return Vector2D;
}();

exports.default = Vector2D;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Vector2D = __webpack_require__(1);

var _Vector2D2 = _interopRequireDefault(_Vector2D);

var _Box2D = __webpack_require__(3);

var _Box2D2 = _interopRequireDefault(_Box2D);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var pixels = 'pixels';
var world = 'world';

var Draw2D = function () {
    function Draw2D(canvas) {
        _classCallCheck(this, Draw2D);

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

    _createClass(Draw2D, [{
        key: 'setFont',
        value: function setFont(fontName) {
            this.canvasContext.font = fontName;
            this.fontHeight = parseInt(this.canvasContext.font.match(/\d+/)[0], 10);
        }
    }, {
        key: 'setFontHeight',
        value: function setFontHeight(fontHeight) {
            this.canvasContext.font = fontHeight.toString() + 'px sans-serif';
            this.fontHeight = parseInt(this.canvasContext.font.match(/\d+/)[0], 10);
        }
    }, {
        key: 'convertPixelsToWorldSpaceUnitsX',
        value: function convertPixelsToWorldSpaceUnitsX(xPixels) {
            return (xPixels - this.offsetXPixels) * this.scaleFactorInWorldSpaceUnitsPerPixel;
        }
    }, {
        key: 'convertPixelsToWorldSpaceUnitsY',
        value: function convertPixelsToWorldSpaceUnitsY(yPixels) {
            return (yPixels - this.offsetYPixels) * this.scaleFactorInWorldSpaceUnitsPerPixel;
        }
    }, {
        key: 'convertPixelsToWorldSpaceUnits',
        value: function convertPixelsToWorldSpaceUnits(pointPixels) {
            return new _Vector2D2.default((pointPixels.x - this.offsetXPixels) * this.scaleFactorInWorldSpaceUnitsPerPixel, (pointPixels.y - this.offsetYPixels) * this.scaleFactorInWorldSpaceUnitsPerPixel);
        }
    }, {
        key: 'convertWorldSpaceUnitsToPixelsX',
        value: function convertWorldSpaceUnitsToPixelsX(xWorld) {
            return xWorld / this.scaleFactorInWorldSpaceUnitsPerPixel + this.offsetXPixels;
        }
    }, {
        key: 'convertWorldSpaceUnitsToPixelsY',
        value: function convertWorldSpaceUnitsToPixelsY(yWorld) {
            return yWorld / this.scaleFactorInWorldSpaceUnitsPerPixel + this.offsetYPixels;
        }
    }, {
        key: 'convertWorldSpaceUnitsToPixels',
        value: function convertWorldSpaceUnitsToPixels(pointWorld) {
            return new _Vector2D2.default(pointWorld.x / this.scaleFactorInWorldSpaceUnitsPerPixel + this.offsetXPixels, pointWorld.y / this.scaleFactorInWorldSpaceUnitsPerPixel + this.offsetYPixels);
        }
    }, {
        key: 'translate',
        value: function translate(deltaXPixels, deltaYPixels) {
            this.offsetXPixels += deltaXPixels;
            this.offsetYPixels += deltaYPixels;
        }
    }, {
        key: 'zoomIn',
        value: function zoomIn(zoomFactor, centerXPixels, centerYPixels) {
            this.scaleFactorInWorldSpaceUnitsPerPixel /= zoomFactor;
            this.offsetXPixels = centerXPixels - (centerXPixels - this.offsetXPixels) * zoomFactor;
            this.offsetYPixels = centerYPixels - (centerYPixels - this.offsetYPixels) * zoomFactor;
        }
    }, {
        key: 'zoomInAroundCenterOfCanvas',
        value: function zoomInAroundCenterOfCanvas(zoomFactor) {
            this.zoomIn(zoomFactor, this.canvasWidth_pixels * 0.5, this.canvasHeight_pixels * 0.5);
        }
    }, {
        key: 'translateAndZoomBasedOnDisplacementOfTwoFingers',
        value: function translateAndZoomBasedOnDisplacementOfTwoFingers(aOld, bOld, aNew, bNew) {
            var M1 = _Vector2D2.default.average(aOld, bOld);
            var M2 = _Vector2D2.default.average(aNew, bNew);

            var translation = _Vector2D2.default.diff(M2, M1);

            var vector0 = _Vector2D2.default.diff(aOld, bOld);
            var vector1 = _Vector2D2.default.diff(aNew, bNew);

            var vector0Length = vector0.norm();
            var vector1Length = vector1.norm();
            var scaleFactor = 1;
            if (vector0Length > 0 && vector1Length > 0) {
                scaleFactor = vector1Length / vector0Length;
            }
            this.translate(translation.x, translation.y);
            this.zoomIn(scaleFactor, M2.x, M2.y);
        }
    }, {
        key: 'frame',
        value: function frame(originalRect, expand) {
            if (originalRect.isEmpty || originalRect.diagonal().x === 0 || originalRect.diagonal().y === 0) {
                return;
            }
            var rect = originalRect;
            if (expand) {
                var diagonal = rect.diagonal().norm() / 20;
                var vector = new _Vector2D2.default(diagonal, diagonal);
                rect = new _Box2D2.default(_Vector2D2.default.diff(rect.min, vector), _Vector2D2.default.sum(rect.max, vector));
            }
            if (rect.width() / rect.height() >= this.canvasWidth_pixels / this.canvasHeight_pixels) {
                // The rectangle to frame is wider (or shorter) than the canvas,
                // so the limiting factor is the width of the rectangle.
                this.offsetXPixels = -rect.min.x * this.canvasWidth_pixels / rect.width();
                this.scaleFactorInWorldSpaceUnitsPerPixel = rect.width() / this.canvasWidth_pixels;
                this.offsetYPixels = this.canvasHeight_pixels / 2 - rect.center().y / this.scaleFactorInWorldSpaceUnitsPerPixel;
            } else {
                // The limiting factor is the height of the rectangle.
                this.offsetYPixels = -rect.min.y * this.canvasHeight_pixels / rect.height();
                this.scaleFactorInWorldSpaceUnitsPerPixel = rect.height() / this.canvasHeight_pixels;
                this.offsetXPixels = this.canvasWidth_pixels / 2 - rect.center().x / this.scaleFactorInWorldSpaceUnitsPerPixel;
            }
        }
    }, {
        key: 'resize',
        value: function resize(width, height) {
            var oldCenter = this.convertPixelsToWorldSpaceUnits(new _Vector2D2.default(this.canvasWidth_pixels * 0.5, this.canvasHeight_pixels * 0.5));
            var radius = Math.min(this.canvasWidth_pixels, this.canvasHeight_pixels) * 0.5 * this.scaleFactorInWorldSpaceUnitsPerPixel;

            this.canvasWidth_pixels = width;
            this.canvasHeight_pixels = height;

            if (radius > 0) {
                this.frame(new _Box2D2.default(new _Vector2D2.default(oldCenter.x - radius, oldCenter.y - radius), new _Vector2D2.default(oldCenter.x + radius, oldCenter.y + radius)), false);
            }
        }
    }, {
        key: 'setCoordinateSystemToPixels',
        value: function setCoordinateSystemToPixels() {
            this.coordinateSystem = Draw2D.PIXELS;
        }
    }, {
        key: 'setCoordinateSystemToWorldSpaceUnits',
        value: function setCoordinateSystemToWorldSpaceUnits() {
            this.coordinateSystem = Draw2D.WORLD;
        }
    }, {
        key: 'setStrokeColor',
        value: function setStrokeColor(red, green, blue) {
            var alpha = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1.0;

            if (alpha === 1.0) {
                this.canvasContext.strokeStyle = 'rgb(' + red + ',' + green + ',' + blue + ')';
            } else {
                this.canvasContext.strokeStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
            }
        }
    }, {
        key: 'setFillColor',
        value: function setFillColor(red, green, blue) {
            var alpha = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1.0;

            if (alpha === 1.0) {
                this.canvasContext.fillStyle = 'rgb(' + red + ',' + green + ',' + blue + ')';
            } else {
                this.canvasContext.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
            }
        }
    }, {
        key: 'setLineWidth',
        value: function setLineWidth(lw) {
            this.canvasContext.lineWidth = lw;
        }
    }, {
        key: 'clear',
        value: function clear(red, green, blue) {
            this.setFillColor(red, green, blue);
            this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }, {
        key: 'drawLine',
        value: function drawLine(x1, y1, x2, y2) {
            if (this.coordinateSystem === Draw2D.WORLD) {
                this.contextedDrawLine(this.convertWorldSpaceUnitsToPixelsX(x1), this.convertWorldSpaceUnitsToPixelsY(y1), this.convertWorldSpaceUnitsToPixelsX(x2), this.convertWorldSpaceUnitsToPixelsY(y2));
            } else {
                this.contextedDrawLine(x1, y1, x2, y2);
            }
        }
    }, {
        key: 'contextedDrawLine',
        value: function contextedDrawLine(x1, y1, x2, y2) {
            this.canvasContext.beginPath();
            this.canvasContext.moveTo(x1, y1);
            this.canvasContext.lineTo(x2, y2);
            this.canvasContext.stroke();
        }
    }, {
        key: 'drawRect',
        value: function drawRect(unsignedX, unsignedY, unsignedWidth, unsignedHeight) {
            var isFilled = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

            var _Draw2D$getRectSigned = Draw2D.getRectSignedCoords(unsignedX, unsignedY, unsignedWidth, unsignedHeight),
                height = _Draw2D$getRectSigned.height,
                width = _Draw2D$getRectSigned.width,
                x = _Draw2D$getRectSigned.x,
                y = _Draw2D$getRectSigned.y;

            if (this.coordinateSystem === Draw2D.WORLD) {
                this.contextedDrawRect(this.convertWorldSpaceUnitsToPixelsX(x), this.convertWorldSpaceUnitsToPixelsY(y), this.scaleFactorInWorldSpaceUnitsPerPixel, this.scaleFactorInWorldSpaceUnitsPerPixel, isFilled);
            } else {
                this.contextedDrawRect(x, y, width, height, isFilled);
            }
        }
    }, {
        key: 'contextedDrawRect',
        value: function contextedDrawRect(x, y, width, height, isFilled) {
            if (isFilled) {
                this.canvasContext.fillRect(x, y, width, height);
            } else {
                this.canvasContext.strokeRect(x, y, width, height);
            }
        }
    }, {
        key: 'fillRect',
        value: function fillRect(x, y, w, h) {
            this.drawRect(x, y, w, h, true);
        }
    }, {
        key: 'drawCircle',
        value: function drawCircle(xCenter, yCenter, radius) {
            var isFilled = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

            if (this.coordinateSystem === Draw2D.WORLD) {
                this.contextedDrawCircle(this.convertWorldSpaceUnitsToPixelsX(xCenter), this.convertWorldSpaceUnitsToPixelsY(yCenter), radius / this.scaleFactorInWorldSpaceUnitsPerPixel, isFilled);
            } else {
                this.contextedDrawCircle(xCenter, yCenter, radius, isFilled);
            }
        }
    }, {
        key: 'contextedDrawCircle',
        value: function contextedDrawCircle(xCenter, yCenter, radius) {
            var isFilled = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

            this.canvasContext.beginPath();
            this.canvasContext.arc(xCenter, yCenter, radius, 0, 2 * Math.PI, false);

            if (isFilled) {
                this.canvasContext.fill();
            } else {
                this.canvasContext.stroke();
            }
        }
    }, {
        key: 'fillCircle',
        value: function fillCircle(xCenter, yCenter, radius) {
            this.drawCircle(xCenter, yCenter, radius, true);
        }
    }, {
        key: 'drawPolyline',
        value: function drawPolyline(points) {
            var _this = this;

            var isFilled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var isClosed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            if (points.length < 2) {
                return;
            }
            this.canvasContext.beginPath();
            points.forEach(function (point, i) {
                var x = point.x,
                    y = point.y;

                if (_this.coordinateSystem === Draw2D.WORLD) {
                    x = _this.convertWorldSpaceUnitsToPixelsX(x);
                    y = _this.convertWorldSpaceUnitsToPixelsY(y);
                }
                _this.canvasContext[(i ? 'line' : 'move') + 'To'](x, y);
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
    }, {
        key: 'drawPolygon',
        value: function drawPolygon(points) {
            var isFilled = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            this.drawPolyline(points, isFilled, true);
        }
    }, {
        key: 'fillPolygon',
        value: function fillPolygon(points) {
            this.drawPolyline(points, true, true);
        }
    }, {
        key: 'stringWidth',
        value: function stringWidth(s) {
            if (s.length === 0) return 0;
            return this.canvasContext.measureText(s).width;
        }
    }, {
        key: 'drawString',
        value: function drawString(x, y, s) {
            if (s.length === 0) return;
            this.canvasContext.fillText(s, x, y);
        }
    }], [{
        key: 'getRectSignedCoords',
        value: function getRectSignedCoords(x, y, width, height) {
            return {
                height: height < 0 ? -height : height,
                width: width < 0 ? -width : width,
                x: width < 0 ? x + width : x,
                y: height < 0 ? y + height : y
            };
        }
    }, {
        key: 'PIXELS',
        get: function get() {
            return pixels;
        },
        set: function set(input) {
            pixels = input;
        }
    }, {
        key: 'WORLD',
        get: function get() {
            return world;
        },
        set: function set(input) {
            world = input;
        }
    }]);

    return Draw2D;
}();

exports.default = Draw2D;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Vector2D = __webpack_require__(1);

var _Vector2D2 = _interopRequireDefault(_Vector2D);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Box2D = function () {
    function Box2D(vectorMin, vectorMax) {
        _classCallCheck(this, Box2D);

        this.isEmpty = true;
        this.min = new _Vector2D2.default();
        this.max = new _Vector2D2.default();
        if (vectorMin && vectorMax) {
            this.boundPoint(vectorMin);
            this.boundPoint(vectorMax);
        }
    }

    _createClass(Box2D, [{
        key: 'clear',
        value: function clear() {
            this.isEmpty = true;
            this.min = new _Vector2D2.default();
            this.max = new _Vector2D2.default();
        }
    }, {
        key: 'center',
        value: function center() {
            return _Vector2D2.default.average(this.min, this.max);
        }
    }, {
        key: 'diagonal',
        value: function diagonal() {
            return _Vector2D2.default.diff(this.max, this.min);
        }
    }, {
        key: 'width',
        value: function width() {
            return this.max.x - this.min.x;
        }
    }, {
        key: 'height',
        value: function height() {
            return this.max.y - this.min.y;
        }
    }, {
        key: 'containsPoint',
        value: function containsPoint(point) {
            return !(this.isEmpty || point.x < this.min.x || point.x > this.max.x || point.y < this.min.y || point.y > this.max.y);
        }
    }, {
        key: 'containsBox',
        value: function containsBox(box) {
            if (this.isEmpty) {
                return false;
            }
            if (box.isEmpty) {
                return true;
            }

            return this.min.x <= box.min.x && box.max.x <= this.max.x && this.min.y <= box.min.y && box.max.y <= this.max.y;
        }
    }, {
        key: 'boundPoint',
        value: function boundPoint(vector) {
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
    }, {
        key: 'boundPoints',
        value: function boundPoints(points) {
            var _this = this;

            points.forEach(function (point) {
                return _this.boundPoint(point);
            });
        }
    }, {
        key: 'boundBox',
        value: function boundBox(box) {
            if (!box.isEmpty) {
                this.boundPoint(box.min);
                this.boundPoint(box.max);
            }
        }
    }]);

    return Box2D;
}();

exports.default = Box2D;

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map