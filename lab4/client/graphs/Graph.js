import * as d3 from 'd3';

class Graph {
    constructor(artists, influences, svg, zoomable = true) {
        this.artists = artists;
        this.influences = influences;
        this.svg = svg;
        this.zoomable = zoomable;

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
            .style('fill', '#1a1a1a')
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
            });
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
            this.links.attr("transform", d3.event.transform)
            this.nodes.attr("transform", d3.event.transform)
        }
	}

}

export default Graph;
