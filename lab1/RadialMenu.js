class RadialMenu {
    constructor() {
        this.label = new Array(8).map(() => '');
        this.isEnabled = new Array(8).map(() => true);
        this.itemID = new Array(8).map((cell, i) => i);

        this.selectedItem = 0;

        this.x0 = 0;
        this.y0 = 0;

        this.mouseX = 0;
        this.mouseY = 0;

        this.isVisible = false;
    }

    static get CENTRAL_ITEM() {
        return 0;
    }

    static get NORTH() {
        return 1;
    }

    static get NORTH_EAST() {
        return 2;
    }

    static get EAST() {
        return 3;
    }

    static get SOUTH_EAST() {
        return 4;
    }

    static get SOUTH() {
        return 5;
    }

    static get SOUTH_WEST() {
        return 6;
    }

    static get WEST() {
        return 7;
    }

    static get NORTH_WEST() {
        return 8;
    }

    static get N() {
        return 8;
    }

    static get FOREGROUND_1() {
        return 0;
    }

    static get FOREGROUND_2() {
        return 127;
    }

    static get BACKGROUND() {
        return 255;
    }

    static get MENU_ALPHA() {
        return 0.6;
    }

    static get radiusOfNeutralZone() {
        return 10;
    }

    static get textHeight() {
        return 20;
    }

    static get marginAroundText() {
        return 6;
    }

    static get marginBetweenItems() {
        return 6;
    }

    setItemLabelAndID(index, /* string */ s, id) {
        if (index >= 0 && index <= RadialMenu.N) {
            this.label[index] = s;
            this.itemID[index] = id;
        }
    }

    setItemLabel(index, /* string */ s) {
        if (index >= 0 && index <= RadialMenu.N) {
            this.label[index] = s;
        }
    }

    getItemID(index) {
        if (index >= 0 && index <= RadialMenu.N) {
            return this.itemID[index];
        }
        return -1;
    }

    setEnabledByID(/* boolean */ flag, id) {
        for (let i = 0; i <= RadialMenu.N; ++i) {
            if (this.itemID[i] === id) {
                this.isEnabled[i] = flag;
            }
        }
    }

    isItemHilited(index) {
        console.assert(index >= 0 && index <= RadialMenu.N);
        return this.itemID[index] === this.itemID[this.selectedItem];
    }
    getSelection() {
        return this.selectedItem;
    }

    getIDOfSelection() {
        return this.getItemID(this.selectedItem);
    }
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

}
