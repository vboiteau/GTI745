import * as d3 from 'd3';
import dataGetter from './data/getter';
import { ForceGraph } from './graphs/force';
import ArcGraph from './graphs/arc';
import AdjMatrix  from './graphs/matrix.js';

var svg = d3.select("svg");

var currentGraph = null;

function selectDiagram(name) {
    dataGetter()
        .then(data => {
            switch(name) {
                case 'force':
                    currentGraph = new ForceGraph(data.artists, data.influences, svg);
                    currentGraph.init();

                    //setTimeout(function(){forceGraph.disposeInCircle()}, 1000)
                    break;
                case 'arc':
                    currentGraph = new ArcGraph(data.artists, data.influences, svg);
                    currentGraph.init();
                    break;
                case 'adjMatrix':
                    var adjMatrix = new AdjMatrix(data.artists, data.influences, svg);
                    adjMatrix.init();
                    break;
                default:
                    console.log(`${name} as no diagram associated`);
            }
        });
}

document.querySelector('#diagramSelector').addEventListener('change', e => {
    svg.selectAll('*').remove();
    selectDiagram(e.target.value)
});

document.querySelector('#colorSelector').addEventListener('change', e => {
    switch(e.target.value){
        case "ch":
            currentGraph.drawConvexHulls();
            break;
        case "colors":
            currentGraph.removeConvexHulls();
            break;
    }
});


window.onload = () => {
    selectDiagram(document.querySelector('#diagramSelector').value);
}
    
window.onresize = function(){

    svg.attr('width', window.innerWidth);
    svg.attr('height', window.innerHeight);
}
