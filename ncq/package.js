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
        this.stars = info["Repository Stars Count"];
        this.keywords = info["Keywords"].split(",");
    }
}

module.exports = Package;