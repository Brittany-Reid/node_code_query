/**
 * Object holding package inforation.
 */

class Package{
    constructor(info, id){
        //identifier
        this.id = id;

        //fields from info object
        this.name = info["Name"];

        //set of snippets belonging to this package
        this.snippets = [];
    }
}

module.exports = Package;