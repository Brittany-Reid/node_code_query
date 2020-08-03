/**
 * Object holding package inforation.
 */

class Package{
    constructor(info, id){
        //identifier
        this.id = id;

        //fields from info object
        this.name = info["Name"];
        this.description = info["Description"];
        this.stars = parseInt(info["Repository Stars Count"]);
        if(!this.stars) this.stars = 0;
        this.keywords = info["Keywords"].split(",");

        this.rankValue = undefined;
    }

    /**
     * Calculate a rank value for packages. For now let's just use stars.
     */
    rank(){
        if(!this.rankValue){
            this.rankValue = this.stars;
        }
        return this.rankValue;
    }

    /**
     * Package sort function, use as comparator argument to Array.sort() etc.
     * Sorts in descending order.
     */
    static sort(a, b){
        //calculate rank
        var rankA = a.rank();
        var rankB = b.rank();

        //if a is less than b
        if(rankA < rankB){
            return 1;
        }

        //if a is more than b
        if(rankA > rankB){
            return -1;
        }

        return 0;

        
    }
}

module.exports = Package;