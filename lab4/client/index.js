    import * as d3 from 'd3';
import Artist from './data/Artist.txt';
import ArtistInf from './data/Artist_influenced_by.txt';

const svg = d3.select("svg");
const width = document.querySelector('svg').clientWidth;
const height = document.querySelector('svg').clientHeight;

var color = d3.scaleOrdinal(d3.schemeCategory20);
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) {
        return d.id;
    }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.csv(Artist, artist => Object.assign(artist, {
    id: artist['pgid']
}), (err, artists) => {
    const artistIds = artists.map(({ id }) => id);
    d3.csv(ArtistInf, influence => Object.assign(influence, {
        source: influence['pgid'],
        target: influence['influencer_pgid']
    }), (err, influences) => {

        influences = influences.filter(({ source, target }) => artistIds.includes(source) && artistIds.includes(target));

        var reduced = getAmountOfNodes(100, influences, artists);
        
        var link = svg.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(reduced.influences)
            .enter()
            .append('line')
            .attr('stroke-width', function(d) { 
                return 2;
            });

        var node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('nodes')
            .data(reduced.artists)
            .enter().append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended))
            .on("mouseover",function(){
              console.log("Bring to front")
            });

        node.append("circle")
            .attr('r', 5)
            .attr('fill', d => 'black')

        node.append("text")
            .attr("x", 12)
            .attr("dy", ".35em")
            .attr("fill", "red")
            .text(function (d) { return d.artist; });

        simulation
            .nodes(reduced.artists)
            .on('tick', ticked);

        simulation
            .force('link')
            .links(reduced.influences);

        function ticked() {
            link
                .attr("x1", function(d) {
                    return d.source.x;
                })
                .attr("y1", function(d) {
                    return d.source.y;
                })
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            node
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
        }


    });
});


function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

//Gets X amount of nodes to display with their influence links
function getAmountOfNodes(amount, influences, artists){

    var inf = [];
    var art = [];
    var count = 0;

    influences.forEach(influence => {

        if(count < amount){

            //For actual pgid of the artist
            if(!art.map(a => {return a.pgid}).includes(influence.pgid)){
                art.push(artists.find(a => {return a.pgid === influence.pgid}));
                count++;
            }
            //For the influencer's pgid
            if(!art.map(a => {return a.pgid}).includes(influence.influencer_pgid)){
                //Finds the influencers ID inside the list
                art.push(artists.find(a => {return a.pgid === influence.influencer_pgid}));
                count++;
            }

            //We add the influence link
            inf.push(influence);
        }

    });

    return {
        "artists": art,
        "influences": inf
    }

}
