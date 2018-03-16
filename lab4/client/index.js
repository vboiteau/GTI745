import * as d3 from 'd3';
import Artist from './data/Artist.txt';
import ArtistInf from './data/Artist_influenced_by.txt';

const svg = d3.select("svg");
const width = document.querySelector('svg').clientWidth;
const height = document.querySelector('svg').clientHeight;

console.log(width, height, document);

const color = d3.scaleOrdinal(d3.schemeCategory20);
const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) {
        return d.id;
    }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.csv(Artist, artist => Object.assign(artist, {
    id: artist['# pgid']
}), (err, artists) => {
    const artistIds = artists.map(({ id }) => id);
    d3.csv(ArtistInf, influence => Object.assign(influence, {
        source: influence['# pgid'],
        target: influence[' influencer_pgid']
    }), (err, influences) => {
        influences = influences.filter(({ source, target }) => artistIds.includes(source) && artistIds.includes(target));
        const link = svg.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(influences)
            .enter()
            .append('line')
            .attr('stroke-width', function(d) { 
                return 2;
            });

        const node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(artists)
            .enter().append('circle')
            .attr('r', 5)
            .attr('fill', d => 'black')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        node.append('title')
            .text(d => d.id);

        simulation
            .nodes(artists)
            .on('tick', ticked);

        simulation
            .force('link')
            .links(influences);

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
                .attr("cx", function(d) { 
                    return d.x;
                })
                .attr("cy", function(d) {
                    return d.y;
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
