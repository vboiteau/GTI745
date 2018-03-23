import * as d3 from 'd3';

//Constants
const LABEL_OFFSET = 12;

var tooltip = d3.select("body")
    .append("div")
    .attr('id', 'tooltip')
    .style('opacity', 0);

//Creates a Force Graph knowing the nodes, the links and the SVG container
class ForceGraph{

	constructor(nodes, links, container){

		this.container = container;

		//Data
		this.nodesData = nodes;
		this.linksData = links;

		//By default the graph takes the whole screen
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.container.attr('width', this.width).attr('height', this.height);

		//Setting up the d3 simulation
		this.simulation = d3.forceSimulation();
		this.simulation
			.force("link", d3.forceLink().id(function(d) {
        		return d.id;
		    }))
		    .force("charge", d3.forceManyBody())
		    .force("center", d3.forceCenter(this.width / 2, this.height / 2));

	}

	init(){

		this.initLinks();
		this.initNodes();

		this.simulation
            .nodes(this.nodesData)
            .on('tick', this.onTick.bind(this));

        this.simulation
            .force('link')
            .links(this.linksData);

        this.initZoom();
	}

	initNodes(){

		//Root <g> element of the node
		this.nodeElements = this.container.append('g')
            .attr('class', 'nodes')
            .selectAll('nodes')
            .data(this.nodesData)
            .enter().append('g')
            .attr('class', 'node')
            .on('mouseover', d => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                tooltip.html(d['artist']);
            })
            .on('mouseout', d => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0);
            })
            .call(d3.drag()
                .on('start', this.onNodeDragStart.bind(this))
                .on('drag', this.onNodeDragged.bind(this))
                .on('end', this.onNodeDragEnd.bind(this)))

        //Circle element inside the <g> element (node)
        this.circleElements = this.nodeElements.append("circle")
            .attr('r', 5)
            .attr('fill', d => 'black')

        //Label element inside the <g> element (node)
        /*this.labelElements = this.nodeElements.append("text")
            .attr("dy", ".35em")
            .attr("fill", "red")
            .text(function (d) { return d.artist; });*/
	}


	initLinks(){

		//<line> element to represent link
		this.linkElements = this.container.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.linksData)
            .enter()
            .append('line')
            .attr('stroke-width', function(d) { 
                return 2;
            })

	}

	//Allows dragging and zooming for the graph
	initZoom(){

        this.zoomHandler = d3.zoom()
            .on("zoom", this.onZoom.bind(this));

        this.zoomHandler(this.container); 

	}

	//Basically the update when the graphs changes
	onTick(){

		this.linkElements
            .attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        this.circleElements
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        //If we have labels
        if(this.labelElements)
	        this.labelElements
	            .attr("x", function(d) { return d.x + LABEL_OFFSET; })
	            .attr("y", function(d) { return d.y + LABEL_OFFSET; });
	}

	onZoom(){
		this.linkElements.attr("transform", d3.event.transform)
        this.nodeElements.attr("transform", d3.event.transform)
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
