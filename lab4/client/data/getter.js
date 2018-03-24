import * as d3 from 'd3';
import Artist from './Artist.txt';
import ArtistInf from './Artist_influenced_by.txt';
import ArtistMarket from './Artist_market_or_style.txt';
let data = null;

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

export default () => new Promise(resolve => {
    if (data) {
        resolve(data);
    }
    d3.csv(Artist, artist => Object.assign(artist, {
        id: artist['pgid']
    }), (err, artists) => {
        const artistIds = artists.map(({ id }) => id);
        d3.csv(ArtistInf, influence => Object.assign(influence, {
            source: influence['pgid'],
            target: influence['influencer_pgid']
        }), (err, influences) => {
            d3.csv(ArtistMarket, market => Object.assign(market, {
                id: market['# pgid'],
                name: market[' market']
            }), (err, markets) => {
                influences = influences.filter(({ source, target }) => artistIds.includes(source) && artistIds.includes(target));

                markets.forEach(({ id, name }) => {
                    artists = artists.map(artist => {
                        if (artist.id === id) {
                            artist.markets = artist.markets || [];
                            if(artist.markets.find(market => market.name === name)) {
                                artist.markets = artist.markets
                                    .map(market => {
                                        if (market.name === name) {
                                            market.count += 1; 
                                        }
                                        return market;
                                    })
                                    .sort((a, b) => b.count - a.count);
                            } else {
                                artist.markets.push({
                                    name,
                                    count: 1
                                });
                            }
                        }
                        return artist;
                    });
                });

                data = getAmountOfNodes(100, influences, artists);

                data.influences.forEach(d => {
                    d.source = data.artists.find(artist => artist.id === d.source);
                    d.target = data.artists.find(artist => artist.id === d.target);
                });
                resolve(data);
            });
        });
    });
});


