class RadialMenu {
    constructor() {
        this.label = [];
        this.isEnabled = [];
        this.itemID = [];

        for (let i = 0, len = RadialMenu.N; i < len; i++) {
            this.label[i] = '';
            this.isEnabled[i] = true;
            this.itemID[i] = i;
        }

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

    setItemLabelAndID(index, label, id) {
        if (index >= 0 && index <= RadialMenu.N) {
            this.label[index] = label;
            this.itemID[index] = id;
        }
    }

    setItemLabel(index, label) {
        if (index >= 0 && index <= RadialMenu.N) {
            this.label[index] = label;
        }
    }

    getItemID(index) {
        if (index >= 0 && index <= RadialMenu.N) {
            return this.itemID[index];
        }
        return -1;
    }

    setEnabledByID(flag, target) {
        this.itemID.forEach((id, i) => {
            if (target === id) {
                this.isEnabled[i] = flag;
            }
        });
    }

    isItemHilited(index) {
        return this.itemID[index] === this.itemID[this.selectedItem];
    }

    getSelection() {
        return this.selectedItem;
    }

    getIDOfSelection() {
        return this.getItemID(this.selectedItem);
    }

    getItemIDForLabel(label) {
        return this.itemID[this.getIndexOfLabel(label)];
    }

    getIndexOfLabel(query) {
        return this.label.findIndex(label => label === query);
    }

    pressEvent(x, y) {
        this.x0 = x;
        this.mouseX = x;
        this.y0 = y;
        this.mouseY = y;
        this.selectedItem = RadialMenu.CENTRAL_ITEM;
        this.isVisible = true;
        return true;
    }

    releaseEvent() {
        if (this.isVisible) {
            this.isVisible = false;
            return true;
        }
        return false;
    }

    moveEvent(x, y) {
        if (!this.isVisible) {
            return false;
        }
        this.x0 = x;
        this.mouseX = x;
        this.y0 = y;
        this.mouseY = y;
        return true;
    }

    dragEvent(x, y) {
        if (!this.isVisible) {
            return false;
        }

        this.mouseX = x;
        this.mouseY = y;
        const dx = this.mouseX - this.x0;
        const dy = this.mouseY - this.y0;
        const radius = Math.sqrt(dx * dx + dy * dy);

        let newlySelectedItem = RadialMenu.CENTRAL_ITEM;

        if (radius > RadialMenu.radiusOfNeutralZone) {
            let theta = Math.asin(dy / radius);

            if (dx < 0) {
                theta = Math.PI - theta;
            }

            theta += 5 * Math.PI / 8;

            console.assert(theta > 0);
            if (theta > 2 * Math.PI) {
                theta -= 2 * Math.PI;
            }

            newlySelectedItem = 1 + Math.floor(theta / (Math.PI / 4));
            console.assert(newlySelectedItem >= 1 && newlySelectedItem <= RadialMenu.N);

            if (
                this.label[newlySelectedItem] &&
                (
                    this.label[newlySelectedItem].length === 0 ||
                    !this.isEnabled[newlySelectedItem]
                )
            ) {
                let minDifference = 4 * Math.PI;
                let itemWithMinDifference = RadialMenu.CENTRAL_ITEM;
                this.itemID.forEach((id, candidateItem) => {
                    if (this.label[candidateItem].length > 0 && this.isEnabled[candidateItem]) {
                        const candidateItemTheta =
                            (candidateItem - 1) *
                            (Math.PI / 4) +
                            Math.PI / 8;

                        let candidateDifference = Math.abs(candidateItemTheta - theta);
                        if (candidateDifference > Math.PI) {
                            candidateDifference = 2 * Math.PI - candidateDifference;
                        }

                        if (candidateDifference < minDifference) {
                            minDifference = candidateDifference;
                            itemWithMinDifference = candidateItem;
                        }
                    }
                });

                newlySelectedItem = itemWithMinDifference;
            }
        }

        if (newlySelectedItem !== this.selectedItem) {
            this.selectedItem = newlySelectedItem;
            return true;
        }

        return false;
    }

    drawMenuItems(draw2D, drawOnlyHilitedItem, drawUsingPieStyle, radiusOfPie) {
        if (drawUsingPieStyle) {
            draw2D.setFillColor(
                RadialMenu.FOREGROUND_2,
                RadialMenu.FOREGROUND_2,
                RadialMenu.FOREGROUND_2,
                RadialMenu.MENU_ALPHA
            );

            draw2D.fillCircle(this.x0, this.y0, radiusOfPie);
        }

        if (this.isItemHilited(RadialMenu.CENTRAL_ITEM)) {
            draw2D.setFillColor(
                RadialMenu.FOREGROUND_1,
                RadialMenu.FOREGROUND_1,
                RadialMenu.FOREGROUND_1,
                RadialMenu.MENU_ALPHA
            );
        } else {
            draw2D.setFillColor(
                RadialMenu.BACKGROUND,
                RadialMenu.BACKGROUND,
                RadialMenu.BACKGROUND,
                RadialMenu.MENU_ALPHA
            );
        }
        draw2D.fillCircle(this.x0, this.y0, RadialMenu.radiusOfNeutralZone);
        if (!this.isItemHilited(RadialMenu.CENTRAL_ITEM)) {
            draw2D.setStrokeColor(
                RadialMenu.FOREGROUND_1,
                RadialMenu.FOREGROUND_1,
                RadialMenu.FOREGROUND_1
            );
        } else {
            draw2D.setStrokeColor(
                RadialMenu.BACKGROUND,
                RadialMenu.BACKGROUND,
                RadialMenu.BACKGROUND
            );
        }
        draw2D.drawCircle(this.x0, this.y0, RadialMenu.radiusOfNeutralZone);
        const heightOfItem = RadialMenu.textHeight + 2 * RadialMenu.marginAroundText;
        const radius = 2 * (heightOfItem + RadialMenu.marginBetweenItems);
        const radiusPrime = radius / Math.SQRT2;

        this.itemID.forEach((id, i) => {
            if (this.label[i].length > 0 && this.isEnabled[i]) {
                const theta = (i - 1) * Math.PI / 4 - Math.PI / 2;
                // compute center of ith label
                let x = ((i % 2) === 1 ? radius : radiusPrime) * Math.cos(theta) + this.x0;
                let y = ((i % 2) === 1 ? radius : radiusPrime) * Math.sin(theta) + this.y0;

                if (i === 1 && this.label[2].length === 0 && this.label[7].length === 0) {
                    y = -radius / 2 + this.y0;
                } else if (i === 5 && this.label[4].length === 0 && this.label[6].length === 0) {
                    y = radius / 2 + this.y0;
                }

                const stringWidth = draw2D.stringWidth(this.label[i]);
                let widthOfItem = stringWidth + 2 * RadialMenu.marginAroundText;

                // We want items that appear side-by-side to have the same width,
                // so that the menu is symmetrical about a vertical axis.
                if (i !== 1 && i !== 5 && this.label[this.itemID.length + 2 - i].length > 0) {
                    const otherStringWidth = draw2D
                        .stringWidth(this.label[this.itemID.length + 2 - i]);
                    if (otherStringWidth > stringWidth) {
                        widthOfItem = otherStringWidth + 2 * RadialMenu.marginAroundText;
                    }
                }

                if (
                    (i === 2 || i === 4) &&
                    x - widthOfItem / 2 <= this.x0 + RadialMenu.marginBetweenItems
                ) {
                    x = this.x0 + RadialMenu.marginBetweenItems + widthOfItem / 2;
                } else if (
                    i === 3 &&
                    (
                        x - widthOfItem / 2 <=
                        this.x0 + RadialMenu.radiusOfNeutralZone + RadialMenu.marginBetweenItems
                    )
                ) {
                    x =
                        this.x0 +
                        RadialMenu.radiusOfNeutralZone +
                        RadialMenu.marginBetweenItems +
                        widthOfItem / 2;
                } else if (
                    (i === 6 || i === 8) &&
                    x + widthOfItem / 2 >= this.x0 - RadialMenu.marginBetweenItems
                ) {
                    x = this.x0 - RadialMenu.marginBetweenItems - widthOfItem / 2;
                } else if (
                    i === 7 &&
                    (
                        x + widthOfItem / 2 >=
                        this.x0 - RadialMenu.radiusOfNeutralZone - RadialMenu.marginBetweenItems
                    )
                ) {
                    x =
                        this.x0 -
                        RadialMenu.radiusOfNeutralZone -
                        RadialMenu.marginBetweenItems -
                        widthOfItem / 2;
                }

                if (this.isItemHilited(i)) {
                    draw2D.setFillColor(
                        RadialMenu.FOREGROUND_1,
                        RadialMenu.FOREGROUND_1,
                        RadialMenu.FOREGROUND_1,
                        RadialMenu.MENU_ALPHA
                    );
                } else {
                    draw2D.setFillColor(
                        RadialMenu.BACKGROUND,
                        RadialMenu.BACKGROUND,
                        RadialMenu.BACKGROUND,
                        RadialMenu.MENU_ALPHA
                    );
                }
                draw2D.fillRect(
                    x - widthOfItem / 2, y - heightOfItem / 2,
                    widthOfItem, heightOfItem
                );
                if (!this.isItemHilited(i)) {
                    draw2D.setStrokeColor(
                        RadialMenu.FOREGROUND_1,
                        RadialMenu.FOREGROUND_1,
                        RadialMenu.FOREGROUND_1
                    );
                    draw2D.setFillColor(
                        RadialMenu.FOREGROUND_1,
                        RadialMenu.FOREGROUND_1,
                        RadialMenu.FOREGROUND_1
                    );
                } else {
                    draw2D.setStrokeColor(
                        RadialMenu.BACKGROUND,
                        RadialMenu.BACKGROUND,
                        RadialMenu.BACKGROUND
                    );
                    draw2D.setFillColor(
                        RadialMenu.BACKGROUND,
                        RadialMenu.BACKGROUND,
                        RadialMenu.BACKGROUND
                    );
                }

                draw2D.drawRect(
                    x - widthOfItem / 2, y - heightOfItem / 2,
                    widthOfItem, heightOfItem
                );

                draw2D.drawString(
                    x - stringWidth / 2,
                    y + RadialMenu.textHeight / 2,
                    this.label[i]
                );
            }
        });
    }

    draw(draw2D) {
        if (!this.isVisible) {
            return;
        }
        this.drawMenuItems(draw2D, false, false, 0);
    }
}

export default RadialMenu;
