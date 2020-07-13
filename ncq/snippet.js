/**
 * Snippet object, with fields
 */

 class Snippet{
    constructor(code, id, packageName, order){
        //snippet string
        this.code = code;
        //id code
        this.id = id;
        //package name snippet belongs to
        this.packageName = packageName;
        //order in readme
        this.order = order;

        //initialize values for ranking
        this.packageStars = -1; //number of stars for package
        this.lintErrors = -1; //linter errors
        this.runtimeErrors = 1; //runtime errors
    }
 }

 module.exports = Snippet;