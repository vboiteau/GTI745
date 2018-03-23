import * as d3 from 'd3';
import Artist from './data/Artist.txt';
import ArtistInf from './data/Artist_influenced_by.txt';
import { ForceGraph } from './ForceGraph.js';
import { ConcentricCircleGraph } from './ConcentricCircleGraph.js';

var svg = d3.select("svg");

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

        var forceGraph = new ConcentricCircleGraph(reduced.artists, reduced.influences, svg);

        forceGraph.init();

        //setTimeout(function(){forceGraph.disposeInCircle(".node")}, 1000)
        
    });
});

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
    
window.onresize = function(){

    svg.attr('width', window.innerWidth);
    svg.attr('height', window.innerHeight);
}