import RadialMenu from './RadialMenu';
import Vector2D from './Vector2D';

class ControlMenu extends RadialMenu {
    constructor() {
        super();
        this.isMenuingMode = false;
    }

    static get menuRadius() {
        return RadialMenu.radiusOfNeutralZone * 6;
    }

    pressEvent(x, y) {
        this.isInMenuingMode = true;
        return RadialMenu.prototype.pressEvent.call(this, x, y);
    }

    dragEvent(x, y) {
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
    }

    draw(draw2D) {
        if (!this.isVisible) {
            return;
        }
        this.drawMenuItems(draw2D, this.isInMenuingMode, true, ControlMenu.menuRadius);
    }
}

export default ControlMenu;
