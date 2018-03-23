import * as d3 from 'd3';
import Graph from './Graph';

// inspiré de http://bl.ocks.org/enjoylife/4e435d329c2c743da33e
class ArcGraph extends Graph {
    constructor(artists, influences, svg) {
        super(artists, influences, svg);

        this.plot = svg.append('g')
            .attr('transform', `translate(${this.pad}, ${this.pad})`);

        this.linearLayout();

        this.drawLinks();

        this.drawNodes();
    }

    get margin() {
        return 40;
    }

    get pad() {
        return this.margin / 2;
    }

    get xRange() {
        return [
            this.nodeRadius,
            this.width - this.margin - this.nodeRadius
        ];
    }

    init() {
    }

    linearLayout() {
        const xScale = d3.scaleLinear()
            .domain([0, this.artists.length - 1])
            .range(this.xRange);

        this.artists.forEach((d, i) => {
            d.x = xScale(i);
            d.y = this.pad + this.nodeRadius;
        })
    }

    drawLinks() {
        const radians = d3.scaleLinear()
            .range([Math.PI / 2, 3 * Math.PI / 2]);

        const arc = d3.radialLine(d3.curveBasis)
            .angle(radians);

        this.plot.selectAll('.link')
            .data(this.influences)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('transform', (d, i) => {
                const xShift = d.source.x + (d.target.x - d.source.x) / 2;
                const yShift = this.pad + this.nodeRadius;
                return `translate(${xShift}, ${yShift})`;
            })
            .attr('d', (d, i) => {
                const xDist = Math.abs(d.source.x - d.target.x);

                arc.radius(xDist / 2);

                const points = d3.range(0, Math.ceil(xDist / 3));

                radians.domain([0, points.length - 1]);

                return arc(points);
            });
    }

    drawNodes() {
        super.drawNodes();
        console.log(this.nodes);
        this.nodes
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    }
}

export default ArcGraph;
