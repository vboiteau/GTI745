import * as d3 from 'd3';

//Constants
const LABEL_OFFSET = 12;

var tooltip = d3.select("body")
    .append("div")
    .attr('id', 'tooltip')
    .style('opacity', 0);

//Creates a Concentric Circle Graph knowing the nodes, the links and the SVG container
class ConcentricCircleGraph {

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
            //.force("collide", d3.forceCollide(100));
	}

	init(){

        var g = this.container.append('g')
            .attr('id', 'root');

		this.initLinks(g);
		this.initNodes(g);

		this.simulation
            .nodes(this.nodesData)
            .on('tick', this.onTick.bind(this));

        this.simulation
            .force('link')
            .links(this.linksData);

        this.initZoom();

        //this.drawCircles();
	}

	initNodes(g){

        var color = d3.scaleOrdinal(d3.schemeCategory20);

		//Root <g> element of the node
		this.nodeElements = g.append('g')
            .attr('class', 'nodes')
            .selectAll('nodes')
            .data(this.nodesData)
            .enter()
            .append('g')
            .attr('class', 'node')
            .on('mouseover', d => {
                console.log(d, 'mouseover');
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                tooltip.html(d['artist']);
            })
            .on('mouseout', d => {
                console.log(d, 'mouseout');
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
            //.attr('fill', d => 'black')
            .attr("fill", function(d){
                if (d["artist"] !== "")
                    return color(d["artist"]);
                else
                    return "black";
            });
	}


	initLinks(g){

		//<line> element to represent link
		this.linkElements = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.linksData)
            .enter()
			.append('line')
			.attr('stroke','black')
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
    
    displayCircular() {
		var self = this;
		self.simulation.stop()

		var nodes = d3.selectAll(".node");
		var links = d3.selectAll(".links line");  
        var nodeData = nodes.data();
		var nodesTargets = [];

		var newTargets = this.getNodeTargetsLinks([nodeData[0].pgid], links, null);
		nodesTargets.push({ "circleNo" : 0 , "targets" : [nodeData[0].pgid] });
		nodesTargets.push({ "circleNo" : 1 , "targets" : newTargets });

		// Get separated arrays of ids.
		for(var i = 2; i <= nodeData.length; i++){
			var lastNodes = nodesTargets[nodesTargets.length - 1];
			newTargets = this.getNodeTargetsLinks(lastNodes.targets, links, nodeData);

			if(newTargets.length === 0)
			{
				break;
			}

			nodesTargets.push({ "circleNo" : i, "targets" : newTargets});
		}

		//Setting positions around the circle (INSTANT)
		nodesTargets.forEach(function(t, i) {
			var childNodes = nodes.filter(d => t.targets.includes(d.pgid));
			self.drawNodes(childNodes, t.circleNo);
		});

		
	}

    getNodeTargetsLinks(sourcesId, links, nodeTargets) {
		var src = links.filter(d => sourcesId.includes(d.source.pgid));

		var targetIds = [];
        src.each(function(d, i){
			if(nodeTargets != null)
			{
				if(!nodeTargets.includes(d.influencer_pgid))
				{
					targetIds.push(d.influencer_pgid);
				}
			}
			else
			{
				targetIds.push(d.influencer_pgid);
			}
		});
		
		return targetIds;
	}
	
	drawNodes(childNodes, circleNumber) {
		var self = this;
		var cX = this.width/2;
		var cY = this.height/2;
		var lineChanges = [];
		var childNodesSize = childNodes.size();

		childNodes.each(function(d, i) {
            var coord = {'x': 0, 'y' : 0 };
            
			if(i == 0)
			{
                coord.x = cX;
                coord.y = cY;
            }
			else 
			{
                coord = self.calculateCircleCoords(i, childNodesSize, circleNumber);
			}

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
			//var src = d3.selectAll(".links line").filter(function(l){return l.source === d})
			var trgt = d3.selectAll(".links line").filter(function(l){return l.target === d})

			//console.log(src);

			//We must do this because we can't put multiple transitions separatly on a DOM element.
			//We must keep a reference to the lines and how they must be changed and use transition once.
			// if(!src.empty()){
				
			// 	src.each(function(line){

			// 		//console.log(this)

			// 		if(!lineChanges.some(function(el){return el.line === this}.bind(this)))
			// 		{
			// 			lineChanges.push({
			// 				"line": this, 
			// 				"x1": coord.x, 
			// 				"y1": coord.y
			// 			});
			// 		}
			// 		else{
			// 			for (var i in lineChanges) {
			// 				if (lineChanges[i].line === this) {
			// 					lineChanges[i].x1 = coord.x;
			// 					lineChanges[i].y1 = coord.y;
			// 					break; //Stop this loop, we found it!
			// 				}
			// 			}
			// 		}

			// 	});

			// }
			// if(!trgt.empty()){

			// 	trgt.each(function(line){

			// 		//console.log(this)

			// 		if(!lineChanges.some(function(el){return el.line === this}.bind(this)))
			// 		{
			// 			lineChanges.push({
			// 				"line": this, 
			// 				"x2": coord.x, 
			// 				"y2": coord.y
			// 			});
			// 		}
			// 		else{
			// 			for (var i in lineChanges) {
			// 				if (lineChanges[i].line === this) {
			// 					lineChanges[i].x2 = coord.x;
			// 					lineChanges[i].y2 = coord.y;
			// 					break; //Stop this loop, we found it!
			// 				}
			// 			}
			// 		}

			// 	});
			// }
		});
	}

	calculateCircleCoords(i, numberOfNodes, circleNumber){

		var angle = i * (2*Math.PI/numberOfNodes);

		var cX = this.width/2;
		var cY = this.height/2;

		var radius = circleNumber * 100;

		return {
			"x" : cX + radius * Math.cos(angle), 
			"y" : cY + radius * Math.sin(angle)
		}

		
	}

    drawCircles(){
        var size = d3.selectAll(".node").size();
        var g = d3.select("#root");

        for(var i=0; i < 20; i++){
            var radius = (i + 1) * 80;
            var coord = this.calculateCircleCoords(i, size);

            g.append("circle")
                .attr("cx", coord.x)
                .attr("cy", coord.y)
                .attr("r", radius )
                .style("stroke","black")
                .style("fill","none");
        }
    }

}

export { ConcentricCircleGraph }