import * as d3 from 'd3';

//Constants
const LABEL_OFFSET = 12;

var tooltip = d3.select("body")
    .append("div")
    .attr('id', 'tooltip')
    .style('opacity', 0);

const KEYS = {
	ESCAPE : 27,
	C : 67
}

//Creates a Force Graph knowing the nodes, the links and the SVG container
class ForceGraph{

	constructor(nodes, links, container){

		var self = this;

		this.container = container;

		//Data
		this.nodesData = nodes;
		this.linksData = links;

		//By default the graph takes the whole screen
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.container.attr('width', this.width).attr('height', this.height);

		//For keypresses on keyboard
		d3.select('body').on('keydown', this.keyDownHandler.bind(this))
		d3.select('body').on('keyup', this.keyUpHandler.bind(this))

		this.container.on('mousemove', function(){
			self.currentPosition = d3.mouse(this);
		});

		//Setting up the d3 simulation
		this.simulation = d3.forceSimulation();
		this.simulation
			.force("link", d3.forceLink().id(function(d) {
        		return d.id;
		    }))
		    .force("charge", d3.forceManyBody())
		    .force("center", d3.forceCenter(this.width / 2, this.height / 2));

		//To contain shift selected nodes
		this.selectedNodes = [];

		this.transformFactor = {
			"k" : 1,
			"x" : 0,
			"y" : 0
		}
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

        this.enableZoom();
	}

	initNodes(){

		var self = this;

		//Root <g> element of the node
		this.nodeElements = this.container.append('g')
            .attr('class', 'nodes')
            .selectAll('nodes')
            .data(this.nodesData)
            .enter().append('g')
            .attr('class', 'node')
            .on('mouseover', d => {
                //console.log(d, 'mouseover');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                tooltip.html(d['artist']);
            })
            .on('mouseout', d => {
                //console.log(d, 'mouseout');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0);
            })
            .on('click', function() {

            	if(!self.shiftKey)
            		return;

            	if(self.selectedNodes.indexOf(this) < 0){

            		self.selectedNodes.push(this);

            		d3.select(this).classed('selected', true);

	            	d3.select(this).selectAll('circle')
	            		.style('stroke-width', 2)
	            		.style('stroke', '#999')
            	}

            })
            .call(d3.drag()
                .on('start', this.onNodeDragStart.bind(this))
                .on('drag', this.onNodeDragged.bind(this))
                .on('end', this.onNodeDragEnd.bind(this)))

        //Circle element inside the <g> element (node)
        this.circleElements = this.nodeElements.append("circle")
            .attr('r', 5)
            .attr('fill', d => '#f92a34')
            

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
	enableZoom(){

		console.log("Zooming Enabled")

        this.zoomHandler = d3.zoom()
            .on("zoom", this.onZoom.bind(this));

        this.zoomHandler(this.container); 

	}

	disableZoom(){

		console.log("Zooming Disabled")

		this.zoomHandler.on("zoom", null);
	}

	onZoom(){

		this.transformFactor = d3.event.transform;

		this.linkElements.attr("transform", d3.event.transform)
    	this.nodeElements.attr("transform", d3.event.transform)
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

	disposeInCircle(className, cX=this.width/2, cY=this.height/2){

		var self = this;

		self.simulation.stop()

		var size = d3.selectAll(className).size();

		var lineChanges = []

		//Setting positions around the circle
		d3.selectAll(className).each(function(d, i){

			var coord = self.calculateCircleCoords(i, size, cX, cY);

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
							"y1": coord.y,
							"x2": line.target.x,
							"y2": line.target.y
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

					//If not already in list
					if(!lineChanges.some(function(el){return el.line === this}.bind(this)))
					{
						lineChanges.push({
							"line": this, 
							"x1": line.source.x,
							"y1": line.source.y,
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

		setTimeout(function(){
			self.simulation.alpha(0.3).restart();
		}, 1000)

	}

	calculateCircleCoords(i, numberOfNodes, cX, cY){

		var angle = i * (2*Math.PI/numberOfNodes);

		var arcLength = 2*Math.PI/numberOfNodes;

		var radius = 20/arcLength;

		return {
			"x" : cX + radius * Math.cos(angle), 
			"y" : cY + radius * Math.sin(angle)
		}

		
	}

	keyDownHandler(){

		this.shiftKey = d3.event.shiftKey || d3.event.metaKey;
		this.ctrlKey = d3.event.ctrlKey;

		if(this.shiftKey){
			this.disableZoom();
		}

	}

	keyUpHandler(){

		//Enable zoom if shift was pressed in last keypress, but was released
		if(this.shiftKey && !d3.event.shiftKey){
			this.enableZoom()
		}

		this.shiftKey = d3.event.shiftKey || d3.event.metaKey;
		this.ctrlKey = d3.event.ctrlKey;

		/* SHIFT + KEYBIND */
		if(this.shiftKey){

		}

		/* CTRL + KEYBIND */

		if(this.ctrlKey){

		}

		/* REGULAR KEYBINDS */

		//Unselect when pressing escape
		if(d3.event.keyCode == KEYS.ESCAPE){
			console.log("Unselect nodes")
			
			this.selectedNodes.forEach(function(d){

				d3.select(d).classed('selected', false);

				d3.select(d).selectAll('circle')
            		.style('stroke-width', 0)

			})

			this.selectedNodes = [];

		}

		//Circle layout Selection at position
		if(d3.event.keyCode == KEYS.C){

			//Better have atleast 3 nodes so it looks like a circle
			if(this.selectedNodes.length <= 2)
				return;

			//Coords according to current transform
			this.currentPosition[0] = (this.currentPosition[0]-this.transformFactor.x) / this.transformFactor.k
			this.currentPosition[1] = (this.currentPosition[1]-this.transformFactor.y) / this.transformFactor.k

			this.disposeInCircle(
				".node.selected", 
				this.currentPosition[0], 
				this.currentPosition[1]
			);
			
		}

	}


}

export { ForceGraph }