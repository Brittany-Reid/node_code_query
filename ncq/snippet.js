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
    }
 }

 module.exports = Snippet;