class Graph {
    constructor(artists, influences, svg) {
        this.artists = artists;
        this.influences = influences;
        this.svg = svg;
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);
    }

    get nodeRadius() {
        return 5;
    }

    get width() {
        return window.innerWidth;
    }

    get height() {
        return window.innerHeight;
    }
}

export default Graph;
