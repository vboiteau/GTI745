import * as d3 from 'd3';
import Graph from './Graph';

//Constants
const LABEL_OFFSET = 12;

var tooltip = d3.select("body")
    .append("div")
    .attr('id', 'tooltip')
    .style('opacity', 0);

//Creates a Force Graph knowing the nodes, the links and the SVG container
class ForceGraph extends Graph {

	constructor(artists, influences, svg){
        super(artists, influences, svg);

		//Setting up the d3 simulation
		this.simulation = d3.forceSimulation();
		this.simulation
			.force("link", d3.forceLink().id(function(d) {
        		return d.id;
		    }))
		    .force("charge", d3.forceManyBody())
		    .force("center", d3.forceCenter(this.width / 2, this.height / 2));

        this.onNodeDragStart = this.onNodeDragStart.bind(this);
        this.onNodeDragged = this.onNodeDragged.bind(this);
        this.onNodeDragEnd = this.onNodeDragEnd.bind(this);
        this.onTick = this.onTick.bind(this);
	}

	init(){
        super.init();

		this.drawLinks();
		this.drawNodes();

		this.simulation
            .nodes(this.artists)
            .on('tick', this.onTick);

        this.simulation
            .force('link')
            .links(this.influences);
	}

	drawNodes(){
		//Root <g> element of the node
        super.drawNodes();
		this.nodes
            .call(d3.drag()
                .on('start', this.onNodeDragStart)
                .on('drag', this.onNodeDragged)
                .on('end', this.onNodeDragEnd))
	}


	drawLinks() {
		this.links = this.plot.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.influences)
            .enter()
            .append('line')
            .attr('stroke-width', function(d) { 
                return 2;
            })
	}


	//Basically the update when the graphs changes
	onTick(){
        this.nodes
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

		this.links
            .attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        //If we have labels
        if(this.labelElements)
	        this.labelElements
	            .attr("x", function(d) { return d.x + LABEL_OFFSET; })
	            .attr("y", function(d) { return d.y + LABEL_OFFSET; });
	}

	/* Node dragging methods */

	//Start
	onNodeDragStart(d) {
		if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	//Dragging
	onNodeDragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	//End
    onNodeDragEnd(d) {
        if (!d3.event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

	disposeInCircle(){
        console.log('yo');

		var self = this;

		self.simulation.stop()

		var size = d3.selectAll(".node").size();
		var cX = this.width/2;
		var cY = this.height/2;

		var lineChanges = []

		//Setting positions around the circle (INSTANT)
		d3.selectAll(".node").each(function(d, i){

			var coord = self.calculateCircleCoords(i, size);

			d3.select(this).select('circle')
				.transition()
				.duration(1000)
				.attr('cx', l => {

					return coord.x;
				})
				.attr('cy', l => {
					return coord.y;
				})
				.on('end', () => {
					d.fx = coord.x;
					d.fy = coord.y;
				});

			//Check if line must be changed 
			var src = d3.selectAll(".links line").filter(function(l){return l.source === d})
			var trgt = d3.selectAll(".links line").filter(function(l){return l.target === d})


			//We must do this because we can't put multiple transitions separatly on a DOM element.
			//We must keep a reference to the lines and how they must be changed and use transition once.
			if(!src.empty()){
				
				src.each(function(line){
					if(!lineChanges.some(function(el){return el.line === this}.bind(this)))
					{
						lineChanges.push({
							"line": this, 
							"x1": coord.x, 
							"y1": coord.y
						});
					}
					else{
						for (var i in lineChanges) {
							if (lineChanges[i].line === this) {
								lineChanges[i].x1 = coord.x;
								lineChanges[i].y1 = coord.y;
								break; //Stop this loop, we found it!
							}
						}
					}

				});

			}
			if(!trgt.empty()){

				trgt.each(function(line){
					if(!lineChanges.some(function(el){return el.line === this}.bind(this)))
					{
						lineChanges.push({
							"line": this, 
							"x2": coord.x, 
							"y2": coord.y
						});
					}
					else{
						for (var i in lineChanges) {
							if (lineChanges[i].line === this) {
								lineChanges[i].x2 = coord.x;
								lineChanges[i].y2 = coord.y;
								break; //Stop this loop, we found it!
							}
						}
					}

				});
			}

		});

		//Call the transition to move the line according to node layout
		lineChanges.forEach(line => {

			d3.select(line.line)
			.transition()
			.duration(1000)
			.attr('x1', line.x1)
			.attr('x2', line.x2)
			.attr('y1', line.y1)
			.attr('y2', line.y2)
		})

		self.simulation.alpha(0.3).restart();

	}

	calculateCircleCoords(i, numberOfNodes){

		var angle = i * (2*Math.PI/numberOfNodes);

		var cX = this.width/2;
		var cY = this.height/2;

		var radius = 400;

		return {
			"x" : cX + radius * Math.cos(angle), 
			"y" : cY + radius * Math.sin(angle)
		}

		
	}


}

export { ForceGraph }
