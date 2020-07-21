
const LinterHandler = require("./linter-handler");

/**
 * Evaluates snippets.
 */
class Evaluator{
    constructor(){
        this.linter = new LinterHandler();
    }

    /**
     * Lints snippets and stores errors.
     */
    errors(snippets){
        for(var i=0; i<snippets.length; i++){
            var messages = this.linter.lint(snippets[i].code);
            var errors = LinterHandler.errors(messages);
            snippets[i].errors = errors;
        }

        return snippets;
    }

}

module.exports = Evaluator;