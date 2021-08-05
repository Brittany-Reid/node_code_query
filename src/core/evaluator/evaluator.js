
const LinterHandler = require("./linter-handler");
const Snippet = require("../snippet");

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
            var errors = LinterHandler.errors(fix.messages);

            //module errors on script
            if(this.linter.config.parserOptions.sourceType === "script"){
                //is it a module?
                var isModule = false;
                for(var e of errors){
                    if(e.message === "Parsing error: 'import' and 'export' may appear only with 'sourceType: module'"){
                        isModule = true;
                    }
                }
                //if module, fix as module
                if(isModule){
                    this.linter.config.parserOptions.sourceType = "module";
                    fix = this.linter.fix(snippets[i].code);
                    snippets[i].code = fix.output;
                    this.linter.config.parserOptions.sourceType = "script";
                    //run again for commonjs errors
                    fix = this.linter.fix(snippets[i].code);
                }
            }
            snippets[i].code = fix.output;
            snippets[i].errors = LinterHandler.errors(fix.messages);
        }

        return snippets;
    }

}

module.exports = Evaluator;