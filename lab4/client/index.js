import * as d3 from 'd3';
import dataGetter from './data/getter';
import { ForceGraph } from './graphs/force';
import ArcGraph from './graphs/arc';

var svg = d3.select("svg");


function selectDiagram(name) {
    dataGetter()
        .then(data => {
            switch(name) {
                case 'force':
                    var forceGraph = new ForceGraph(data.artists, data.influences, svg);
                    forceGraph.init();

                    //setTimeout(function(){forceGraph.disposeInCircle()}, 1000)
                    break;
                case 'arc':
                    var arcGraph = new ArcGraph(data.artists, data.influences, svg);
                    arcGraph.init();
                default:
                    console.log(`${name} as no diagram associated`);
            }
        });
}

document.querySelector('#diagramSelector').addEventListener('change', e => {
    svg.selectAll('*').remove();
    selectDiagram(e.target.value)
});

window.onload = () => {
    selectDiagram(document.querySelector('#diagramSelector').value);
}
    
window.onresize = function(){

    svg.attr('width', window.innerWidth);
    svg.attr('height', window.innerHeight);
}
