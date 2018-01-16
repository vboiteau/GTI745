import RadialMenu from './RadialMenu';
import canvasHelpers from './canvasHelpers';
import { TOOL_MODE, CONTROL } from './modes';

let canvas = document.getElementById('myCanvas');
canvas = canvasHelpers(canvas);

canvas.radialMenu.setItemLabelAndID(RadialMenu.CENTRAL_ITEM, '', -1);
canvas.radialMenu.setItemLabelAndID(RadialMenu.NORTH, 'Pencil', TOOL_MODE.PENCIL);
canvas.radialMenu.setItemLabelAndID(RadialMenu.EAST, 'Rectangle Select', TOOL_MODE.RECT_SELECT);
canvas.radialMenu.setItemLabelAndID(RadialMenu.WEST, 'Move Selection', TOOL_MODE.MOVE_SELECTION);
canvas.radialMenu.setItemLabelAndID(RadialMenu.SOUTH, 'Line', TOOL_MODE.LINE);

canvas.controlMenu.setItemLabelAndID(RadialMenu.CENTRAL_ITEM, '', -1);
canvas.controlMenu.setItemLabelAndID(RadialMenu.NORTH, 'Pencil', CONTROL.PENCIL);
canvas.controlMenu.setItemLabelAndID(RadialMenu.EAST, 'Rectangle Select', CONTROL.RECT_SELECT);
canvas.controlMenu.setItemLabelAndID(RadialMenu.WEST, 'Move Selection', CONTROL.MOVE_SELECTION);
canvas.controlMenu.setItemLabelAndID(RadialMenu.SOUTH_EAST, 'Translate', CONTROL.TRANSLATE);
canvas.controlMenu.setItemLabelAndID(RadialMenu.SOUTH_WEST, 'Zoom', CONTROL.ZOOM);
canvas.controlMenu.setItemLabelAndID(RadialMenu.SOUTH, 'Line', CONTROL.LINE);

canvas.redraw();

canvas.addEventListener('mousedown', canvas.mouseHandler.down.bind(canvas.mouseHandler));
canvas.addEventListener('mouseup', canvas.mouseHandler.up.bind(canvas.mouseHandler));
canvas.addEventListener('mousemove', canvas.mouseHandler.move.bind(canvas.mouseHandler));

Object.assign(window, {
    deleteSelectionButtonHandler() {
        canvas.deleteSelection();
    },
    deleteAllButtonHandler() {
        canvas.deleteAll();
    },
    duplicateSelectionButtonHandler() {
        canvas.duplicateSelection();
    },
    exposedToolModes: {
        TOOL_MODE_PENCIL: TOOL_MODE.PENCIL,
        TOOL_MODE_RECT_SELECT: TOOL_MODE.RECT_SELECT,
        TOOL_MODE_MOVE_SELECTION: TOOL_MODE.MOVE_SELECTION,
        TOOL_MODE_LINE: TOOL_MODE.LINE
    },
    flipSelectionButtonHandler(axe) {
        canvas.flipSelection(axe);
    },
    frameAllButtonHandler() {
        canvas.frameAll();
    },
    setToolMode(toolMode, updateRadioButtons) {
        canvas.setToolMode(toolMode, updateRadioButtons);
    },
    toggleDrawSymetry() {
        canvas.toggleDrawSymetry();
    },
    toggleShowMouseCoordinates() {
        canvas.toggleShowMouseCoordinates();
    }
});
