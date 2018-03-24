import * as d3 from 'd3';

class Graph {
    constructor(artists, influences, svg, zoomable = true) {
        this.artists = artists;
        this.influences = influences;
        this.svg = svg;
        this.zoomable = zoomable;
        this.color = d3.scaleOrdinal(d3.schemeCategory20);

        console.dir(this.markets);

        this.svg
            .attr('width', this.width)
            .attr('height', this.height);

        this.tooltip = d3.select("body")
            .append("div")
            .attr('id', 'tooltip')
            .style('opacity', 0);

        this.plot = svg.append('g')
            .attr('transform', `translate(${this.pad}, ${this.pad})`);

        this.onZoom = this.onZoom.bind(this);

        this.links = null;
    }

    init() {
        this.initZoom();
    }

    get margin() {
        return 40;
    }

    get pad() {
        return this.margin / 2;
    }

    drawNodes() {
        this.nodes = this.plot
            .selectAll('.nodes')
            .data(this.artists)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('id', d => d.id)
            .attr('r', this.nodeRadius)
            .on('mouseover', d => {
                this.tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);

                this.tooltip.html(d['artist']);
            })
            .on('mouseout', d => {
                this.tooltip.transition()
                    .duration(200)
                    .style('opacity', 0);
            })
            .attr('fill', d => this.color(this.getArtistColorPosition(d)));
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
    
	//Allows dragging and zooming for the graph
	initZoom(){

        this.zoomHandler = d3.zoom()
            .on('zoom', this.onZoom);

        this.zoomHandler(this.svg); 

	}

	onZoom() {
        if (this.zoomable) {
            this.transformFactor = d3.event.transform;

            this.links.attr("transform", d3.event.transform)
            this.nodes.attr("transform", d3.event.transform)
        }
	}

    get markets() {
        return [...new Set(this.artists.reduce((current, artist) => [...current, ...artist.markets.map(market => market.name)], []))];
    }

    getMarketPosition(name) {
        return this.markets.findIndex(market => market === name);
    }

    getArtistColorPosition(artist) {
        const [{ name }] = artist.markets;
        console.log(name);
        return this.getMarketPosition(name);
    }

}

export default Graph;
