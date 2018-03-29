import * as d3 from 'd3';
import * as utils from './../data/utils'


class Graph {
    constructor(artists, influences, svg, zoomable = true) {
        this.artists = artists;
        this.influences = influences;
        this.svg = svg;
        this.zoomable = zoomable;
        this.color = d3.scaleOrdinal(d3.schemeCategory20);

        //console.dir(this.markets);

        this.svg
            .attr('width', this.width)
            .attr('height', this.height);

        this.tooltip = d3.select("body")
            .append("div")
            .attr('id', 'tooltip')
            .style('opacity', 0);

        //Add Hover behavior to legend
        this.legend = d3.select("body #legend")
            .style('height', this.height + "px")
            .on("mouseover", function(d,i){
                d3.select(this).transition()
                    .duration(500)
                    .style("left", 0+ "px")
            })
            .on("mouseout", function(d,i) {
                d3.select(this).transition()
                    .duration(500)
                    .style("left", -240 + "px");
            });


        this.plot = svg.append('g')
            .attr('transform', `translate(${this.pad}, ${this.pad})`);

        this.onZoom = this.onZoom.bind(this);

        this.links = null;

        this.transformFactor = {
            "k" : 1,
            "x" : 0,
            "y" : 0
        }
    }

    init() {
        this.initZoom();
    }

    addColorsToLegend(){

        var self = this;

        //Remove everything inside legend
        this.legend.select(".colors").html("");

        var exists = [];

        this.nodes.each(function(d,i){

            var name = d.major;

            if(!name)
                name = 'Unknown';

            if(exists.indexOf(name) < 0)
            {

                var market = self.legend.select('.colors').append("div")
                    .attr('class', 'market')
                
                market.append("div")
                    .attr('class', 'color')
                    .style('background-color', self.color(self.getMajorColorPosition(d.major)))

                market.append("div")
                    .attr('class', 'name')
                    .text(name)

                exists.push(name);
            }

        });

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
            .attr('fill', d => this.color(this.getMajorColorPosition(d.major)));
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
            this.svg.selectAll("polygon").attr("transform", d3.event.transform)

        }
	}

    get markets() {
        return [...new Set(this.artists.reduce((current, artist) => [...current, ...artist.markets.map(market => market.name)], []))];
    }

    get majors() {

        return this.artists.map(artist => { 
                if(artist.major)
                    return artist.major 
            })
            .filter(value => {
                return typeof value === 'string';
            })
            .filter((value, index, self) => { return self.indexOf(value) === index })
            .sort();

    }

    removeConvexHulls(){

        this.svg.selectAll("polygon").remove();

    }

    drawConvexHulls(){

        this.majors.forEach(major => {
            this.drawConvexHull(major);
        });

    }

    drawConvexHull(major){

        //console.log(nodes)

        var nodes = this.getNodesInMajor(major);

        var points = [];

        nodes.each( d => {
            points.push([d.x, d.y]);
        })

        var hull;

        this.svg.select("g")
            .append("polygon")
            .data([nodes])
            .attr("points", function(d){

                d.each(node => {
                    points.push([node.x, node.y])
                })

                hull = utils.convexHull(points);

                return hull.map(function(point){
                    return point.join(",")
                }).join(" ")
            })
            .attr("fill", d => this.color(this.getMajorColorPosition(major)))
            .attr("fill-opacity", 0.2)
            .attr("stroke", d => this.color(this.getMajorColorPosition(major)))
            .attr("stroke-width", 2)
            .attr("transform", `translate(${this.transformFactor.x}, ${this.transformFactor.y}) scale(${this.transformFactor.k})`)
            .style("pointer-events", "none")
    }

    //When simulation is running update convex hulls
    updateConvexHulls(){

        var hulls = this.svg.selectAll("polygon");

        hulls.each(function(hull) {

            var points = [];

            var hull = undefined;

            d3.select(this)
                .attr("points", function(d){

                    d.each(node => {
                        points.push([node.x, node.y])
                    })

                    hull = utils.convexHull(points);

                    return hull.map(function(point){
                        return point.join(",")
                    }).join(" ")

                })

        });
        


    }

    //Gets all nodes that are in the major market
    getNodesInMajor(name){

        return this.nodes.filter(d => { return d.major === name })
    }

    getMajorColorPosition(name){
        return this.majors.findIndex(major => major === name);
    }

    getMarketPosition(name) {
        return this.markets.findIndex(market => market === name);
    }

    getArtistColorPosition(artist) {
        const [{ name }] = artist.markets;
        //console.log(name);
        return this.getMarketPosition(name);
    }

}

export default Graph;
