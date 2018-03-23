import * as d3 from 'd3';
import dataGetter from './dataGetter'
import { ForceGraph } from './ForceGraph'

var svg = d3.select("svg");


dataGetter()
    .then(data => {
        var forceGraph = new ForceGraph(data.artists, data.influences, svg);
        forceGraph.init();

        //setTimeout(function(){forceGraph.disposeInCircle()}, 1000)
    });

    
window.onresize = function(){

    svg.attr('width', window.innerWidth);
    svg.attr('height', window.innerHeight);
}
