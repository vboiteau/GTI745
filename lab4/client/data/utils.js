
//Source : https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
function cross (a, b, o) {
	return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

export function convexHull(points) {
   points.sort(function(a, b) {
      return a[0] == b[0] ? a[1] - b[1] : a[0] - b[0];
   });

   var lower = [];
   for (var i = 0; i < points.length; i++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
         lower.pop();
      }
      lower.push(points[i]);
   }

   var upper = [];
   for (var i = points.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
         upper.pop();
      }
      upper.push(points[i]);
   }

   upper.pop();
   lower.pop();
   return lower.concat(upper);
}

//Removes superfluous links between Nodes
export function simplifyNodes(nodes) {
    //var self = this;

    var removeLinks = [];

    //All Nodes
    nodes.artists.forEach(artist => {

        //Get direct neighbors
        var directInfluence = findNeighbors(artist, nodes);

        //For each directly influenced artist
        directInfluence.forEach(direct => {

            var indirectInfluence = findNeighbors(direct, nodes);

            indirectInfluence.forEach(indirect => {

                if(directInfluence.includes(indirect)){

                    console.log(`${artist.artist} posses indirect link to ${indirect.artist}`)

                    removeLinks.push(nodes.influences.find(function(i) {
                        return i.target === artist && i.source === indirect;
                    }));

                }
            });

        });

    });

    nodes.influences.filter(function(influence, index, obj){
        if(removeLinks.includes(influence)){
            console.log(influence)

            console.log(obj.splice(index, 1));
        }


    })

    console.log(nodes.influences.length)

    return nodes;

}

//Find the neighbors of node inside list of nodes
function findNeighbors(node,nodes){

    //console.log(node.artist + " influenced : ");

    //Find directly infuenced artists
    var influenced = nodes.influences.filter(influence => {

        return influence.target === node
    }).map(i => { return i.source } );

    influenced.forEach(i => {
        //console.log('%c \t' + i.artist, 'color: #FF0000')
    });

    return influenced;

}

//End of sourced code