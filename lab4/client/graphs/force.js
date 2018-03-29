import * as d3 from 'd3';
import Graph from './Graph';

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
class ForceGraph extends Graph {
	constructor(artists, influences, svg){
        super(artists, influences, svg);

        const self = this;

		//For keypresses on keyboard
		d3.select('body').on('keydown', this.keyDownHandler.bind(this))
		d3.select('body').on('keyup', this.keyUpHandler.bind(this))

		this.svg.on('mousemove', function(){
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

        this.onNodeDragStart = this.onNodeDragStart.bind(this);
        this.onNodeDragged = this.onNodeDragged.bind(this);
        this.onNodeDragEnd = this.onNodeDragEnd.bind(this);
        this.onTick = this.onTick.bind(this);
		//To contain shift selected nodes
		this.selectedNodes = [];

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

        this.enableZoom();

        this.addColorsToLegend();

        //setTimeout(function(){this.drawConvexHull("Hard Rock")}.bind(this), 5000);
	}

	drawNodes(){
		//Root <g> element of the node
        super.drawNodes();
        const self = this;
		this.nodes
            .on('click', function() {


                if(!self.shiftKey)
                    return;

                if(self.selectedNodes.indexOf(this) < 0){

                    self.selectedNodes.push(this);

                    d3.select(this).classed('selected', true);

                    d3.select(this)
                        .style('stroke-width', 2)
                        .style('stroke', '#999')
                }
            })
            .call(d3.drag()
                .on('start', this.onNodeDragStart)
                .on('drag', this.onNodeDragged)
                .on('end', this.onNodeDragEnd));
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

	//Allows dragging and zooming for the graph
	enableZoom(){


        this.zoomHandler = d3.zoom()
            .on("zoom", this.onZoom);

        this.zoomHandler(this.svg); 

	}

	disableZoom(){
		this.zoomHandler.on("zoom", null);
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
        
        this.updateConvexHulls();

        //If we have labels
        /*if(this.labelElements)
	        this.labelElements
	            .attr("x", function(d) { return d.x + LABEL_OFFSET; })
	            .attr("y", function(d) { return d.y + LABEL_OFFSET; });*/


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

	disposeInCircle(className=".node", cX=this.width/2, cY=this.height/2){

		var self = this;

		self.simulation.stop()

		var size = d3.selectAll(className).size();

		var lineChanges = []

		//Setting positions around the circle
		d3.selectAll(className).each(function(d, i){

			var coord = self.calculateCircleCoords(i, size, cX, cY);

			d3.select(this)
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

				d3.select(d)
            		.attr('style', "")

			})

			this.selectedNodes = [];

		}

        //console.log(KEYS, d3.event.keyCode, this.selectedNodes);

		//Circle layout Selection at position
		if(d3.event.keyCode == KEYS.C){

			console.log("CENTER points")

			//Center everything around mouse
			if(this.selectedNodes.length == 0)
			{
				this.disposeInCircle();
				return;
			}

			//Better have atleast 3 nodes so it looks like a circle
			if(this.selectedNodes.length <= 2)
				return;

			//Coords according to current transform
			this.currentPosition[0] = (this.currentPosition[0]-this.transformFactor.x-this.pad) / this.transformFactor.k
			this.currentPosition[1] = (this.currentPosition[1]-this.transformFactor.y-this.pad) / this.transformFactor.k

			this.disposeInCircle(
				".node.selected", 
				this.currentPosition[0], 
				this.currentPosition[1]
			);
			
		}

	}


}

export { ForceGraph }
