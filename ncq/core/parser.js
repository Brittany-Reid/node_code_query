const espree = require("espree");

/**
 * Wrap espree parse with our options.
 */
class Parser{
    constructor(){
        this.parser = espree;
        this.options = {
            ecmaVersion: 6,
        }
    }

    parse(code){
        var ast;
        try{
            ast = this.parser.parse(code, this.options);
        }
        catch(e){
            //for any parse error, return null
            return;
        }
        return ast;
    }
}

module.exports = Parser;