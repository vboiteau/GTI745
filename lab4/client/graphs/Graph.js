import * as d3 from 'd3';

class Graph {
    constructor(artists, influences, svg) {
        this.artists = artists;
        this.influences = influences;
        this.svg = svg;
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);

        this.tooltip = d3.select("body")
            .append("div")
            .attr('id', 'tooltip')
            .style('opacity', 0);

        this.influences.forEach(d => {
            d.source = this.artists.find(artist => artist.id === d.source);
            d.target = this.artists.find(artist => artist.id === d.target);
        });
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
}

export default Graph;
