import * as d3 from 'd3';
import Artist from './data/Artist.txt';
import ArtistInf from './data/Artist_influenced_by.txt';

const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

const color = d3.scaleOrdinal(d3.schemeCategory20);
const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) {
        return d['# pgid'];
    }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.csv(Artist, (err, artists) => {
    d3.csv(ArtistInf, (err, influences) => {
        console.log({ artists, influences });
        const link = svg.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(influences)
            .enter()
            .append('line')
            .attr('stroke-width', function(d) { return Math.sqrt(d.value);});

        var node = svg.append('g')
            .attr('class', 'nodes')
            .data(artists)
            .enter()
            .append('circle')
            .attr('r', 5)
            .attr('fill', d => 'black');

        node.attr('id', d => d['# pgid']);

        node.append('title')
            .text(d => d['# pgid']);

        link.append('title')
            .text(d => d['# pgid']);

        simulation
            .nodes(artists)
            .on('tick', ticked);

        simulation
            .force('link')
            .links(influences);

        function ticked() {
            link
                .attr("x1", function(d) { return d['# pgid'].x; })
                .attr("y1", function(d) { return d['# pgid'].y; })
                .attr("x2", d => d[' influencer_pgid'].x)
                .attr("y2", d => d[' influencer_pgid'].y);

            node
                .attr("cx", function(d) { 
                    console.log(d);
                    return d.x;
                })
                .attr("cy", function(d) {
                    return d.y;
                });
        }
    });
});
