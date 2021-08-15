const LinterHandler = require("./linter-handler");

/**
 * Our code snippet fixer.
 */
class Fixer{

    constructor(linter){
        this.linter = linter;
        this.rules = {
            "redeclared-identifier": true,
            "no-import-export": true,
            "parsing-error": true,
        }
    }

    runESLint(snippet){
        var fix = this.linter.fix(snippet.code);
        
        //update snippet
        snippet.code = fix.output;
        snippet.errors = LinterHandler.errors(fix.messages);


        return snippet;
    }

    attemptFix(snippet){
        var fixed = false;
        //run eslint
        snippet = this.runESLint(snippet);
        if(!snippet.errors) return {snippet, fixed};

        var previousErrors = snippet.errors;

        for(var e of snippet.errors){
            var fix = this.fixError(snippet, e);
            snippet = fix.snippet;
            if(fix.fixed){
                fixed = true;
                break;
            }
        }

        //rerun eslint for after fix eval
        snippet = this.runESLint(snippet);

        if(fixed){
            //if was meant to fix parsing and parsing error on same line still, fixed = no
            if(this.getError(previousErrors[0].message) === "parsing-error"){
                if(snippet.errors.length === previousErrors.length){
                    if(snippet.errors[0].line === previousErrors[0].line){
                        fixed = false;
                    }
                }
            }
        }

        //console.log(snippet);
        //process.exit();

        return {snippet, fixed};
    }

    fixError(snippet, error){
        var fixed = false;
        var errorType = this.getError(error.message);
        if(!this.rules[errorType]) return {snippet, fixed}
        switch(errorType){
            case "no-import-export":
                snippet = this.fixNoImportExport(snippet, error);
                fixed = true;
                break;
            case "parsing-error":
                snippet = this.fixParsingError(snippet, error);
                fixed = true;
                break;
            // case "redeclared-identifier":
            //     snippet = this.fixRedeclaredIdentifier(snippet, error);
            //     fixed = true;
            //     break;
        }
        return {snippet, fixed: fixed}
    }

    fix(snippet){
        
        var stop = false;
        var fixed = false;
        var previousFixed;

        //run until no more fixes have been applied
        while(!stop){
            var fix = this.attemptFix(snippet);
            snippet = fix.snippet;
            previousFixed = fixed;
            fixed = fix.fixed;
            if(previousFixed === false && fixed === false){
                stop = true;
            }
        }

        return snippet;
    }

    getError(message){
        // if(message.startsWith("Parsing error: Identifier") && message.endsWith(" has already been declared")){
        //     return "redeclared-identifier";
        // }
        if(message === "Parsing error: 'import' and 'export' may appear only with 'sourceType: module'"){
            return "no-import-export";
        }
        if(message.startsWith("Parsing error: ")) return "parsing-error";
    }

    fixNoImportExport(snippet, error){

        //get subset
        var lineNum = error.line;
        var lines = snippet.code.split("\n");
        var line = lines[lineNum -1]


        //run eslint as module
        this.linter.config.parserOptions.sourceType = "module";
        var fix = this.linter.fix(line);
        this.linter.config.parserOptions.sourceType = "script";


        //if there are errors in this subset, unfixable
        var errors = LinterHandler.errors(fix.messages);
        if(errors.length > 0) return this.fixParsingError(snippet, error);
        
        //otherwise, correct line
        lines[lineNum - 1] = fix.output;
        snippet.code = lines.join("\n");
        return snippet;
    }

    fixRedeclaredIdentifier(snippet, error){
        var code = snippet.code;
        var lineNum = error.line;
        code = this.commentLine(code, lineNum);
        snippet.code = code;
        return snippet;
    }
    fixParsingError(snippet, error){
        var code = snippet.code;
        var lineNum = error.line;
        code = this.commentLine(code, lineNum);
        snippet.code = code;
        return snippet;
    }

    commentLine(code, line){
        var lines = code.split("\n");
        var index = line - 1;

        lines[index] = "// " + lines[index];

        return lines.join("\n");
    }
}

module.exports = Fixer;