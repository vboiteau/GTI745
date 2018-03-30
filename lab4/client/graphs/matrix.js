import * as d3 from 'd3';
import Graph from './Graph';

// inspiré de http://bl.ocks.org/emeeks/9441864
class AdjMatrix extends Graph {
    constructor(artists, influences, svg) {
        super(artists, influences, svg, false);

        const matrix = this.getAdjacencyMatrix(artists, influences);
        
        this.createAdjacencyMatrix(matrix, artists);

        this.onZoom = this.onZoom.bind(this);
    }

    init() {
        super.init();
        this.initZoom();
    }

    getAdjacencyMatrix(artists, influences) {
        const influencesHash = [];
        influences.forEach(function(d) {
            const id = d.source.pgid + "-" + d.target.pgid;
            influencesHash.push({ "id" : id, "val" : d });
        });

        //create all possible influences
        const matrix = [];
        artists.forEach(function(a, i) {
            artists.forEach(function(b, j) {
                const result = influencesHash
                    .filter(inf => inf.id === (a.pgid + "-" + b.pgid) 
                        || inf.id === (b.pgid + "-" + a.pgid));
                
                const grid = {
                    id: a.pgid + "-" + b.pgid, 
                    x: i, 
                    y: j, 
                    opacity: result !== undefined && result.length > 0? 1 : 0
                };
                matrix.push(grid);
            }); 
        });

        return matrix;
    }

    createAdjacencyMatrix(matrix, artists) {
        d3.select("svg")
            .append("g")
            .attr("transform", "translate(150,200)")
            .attr("id", "adjacencyG")
            .selectAll("rect")
            .data(matrix)
            .enter()
            .append("rect")
            .attr("width", 25)
            .attr("height", 25)
            .attr("x", function (d) {return d.x * 25})
            .attr("y", function (d) {return d.y * 25})
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("fill", "black")
            .style("fill-opacity", function (d) {
                return d.opacity;
            })
            .on("mouseover", function(d,i) {
                d3.selectAll("rect")
                    .style("stroke", function (p) {
                        return p.x == d.x || p.y == d.y ? "blue" : "black"
                    })
                    .style("stroke-width", function (p) {
                        return p.x == d.x || p.y == d.y ? "3px" : "1px"
                    });
            });
        
        const scaleSize = artists.length * 25;
        const nameScale = d3.scalePoint()
            .domain(artists.map(function(el) { return el.artist }))
            .range([0, scaleSize], 1);
        
        const xAxis = d3.axisTop().scale(nameScale).tickSize(4);    
        const yAxis = d3.axisLeft().scale(nameScale).tickSize(4);   

        d3.select("#adjacencyG")
            .append("g")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "translate(-10,-10) rotate(90)");

        d3.select("#adjacencyG")
            .append("g")
            .call(yAxis);
    }

	initZoom(){
        this.zoomHandler = d3.zoom()
            .on('zoom', this.onZoom);

        this.zoomHandler(this.svg); 
	}

	onZoom() {
        this.transformFactor = d3.event.transform;
        
        d3.select("#adjacencyG").attr("transform", d3.event.transform);
	}
}

export default AdjMatrix;
