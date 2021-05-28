
const LinterHandler = require("./linter-handler");
const Snippet = require("./snippet");

/**
 * Evaluates snippets.
 */
class Evaluator{
    constructor(){
        this.linter = new LinterHandler();
    }

    /**
     * Lints snippets and stores errors.
     * @param {Snippet[]} snippets Array of snippets to get error for.
     * @return {Snippet[]} Array of snippets with error information updated.
     */
    errors(snippets){
        for(var i=0; i<snippets.length; i++){
            var messages = this.linter.lint(snippets[i].code);
            var errors = LinterHandler.errors(messages);
            snippets[i].errors = errors;
        }

        return snippets;
    }

    /**
     * Fix errors for a given array of snippet objects.
     * @param {Snippet[]} snippets Set of snippets to fix.
     * @return {Snippet[]} Array of snippets after fixing with error information updated.
     */
    fix(snippets){
        for(var i=0; i<snippets.length; i++){
            var fix = this.linter.fix(snippets[i].code);
            var code = fix.output;
            var messages = fix.messages;
            var errors = LinterHandler.errors(messages);
            snippets[i].errors = errors;
            snippets[i].code = code;
        }

        return snippets;
    }

}

module.exports = Evaluator;