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
        if(!snippet.errors || snippet.errors.length < 1) return {snippet, fixed};
        
        if(snippet.errors[0].fatal){
            //is line already commented out
            var line = this.getLine(snippet.code, snippet.errors[0].line)
            if(typeof line === "undefined")  return {snippet, fixed};
            if(line.trim().startsWith("//")) return {snippet, fixed};
        }

        for(var e of snippet.errors){
            var fix = this.fixError(snippet, e);
            snippet = fix.snippet;
            if(fix.fixed){
                fixed = true;
                break;
            }
        }

        return {snippet, fixed};
    }

    fixError(snippet, error){
        var fixed = false;
        var errorType = this.getError(error.message);
        var fix = undefined;
        if(!this.rules[errorType]) return {snippet, fixed}
        switch(errorType){
            case "no-import-export":
                fix = this.fixNoImportExport(snippet, error);
                break;
            case "parsing-error":
                fix = this.fixParsingError(snippet, error);
                break;
        }
        if(typeof fix === "undefined"){
            fixed = false;
        }
        else{
            snippet = fix;
            fixed = true;
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

        //rerun eslint for after fix eval
        if(fixed) snippet = this.runESLint(snippet);

        return snippet;
    }

    getError(message){
        if(message === "Parsing error: 'import' and 'export' may appear only with 'sourceType: module'"){
            return "no-import-export";
        }
        if(message.startsWith("Parsing error: ")) return "parsing-error";
    }


    runESLintAsModule(code){
        this.linter.config.parserOptions.sourceType = "module";
        var fix = this.linter.fix(code);
        this.linter.config.parserOptions.sourceType = "script";
        return fix;
    }

    fixNoImportExport(snippet, error){

        //1. try to do one run
        var fix = this.runESLintAsModule(snippet.code);
        var messages = fix.messages;
        //if there are error messages
        if(messages && messages.length > 0){
            var nextError = fix.messages[0];
            //is it fatal (parsing error)?
            if(error.fatal){
                return undefined;
                // if(typeof nextError.line === "undefined") return undefined;
                // var lines = this.getLines(snippet.code, 1, nextError.line-1);
                // console.log(lines)
                // //if no lines, unfixable
                // if(typeof lines === "undefined" || lines.length < 1) return undefined;
                // //run this section only
                // var nextFix = this.runESLintAsModule(lines);
                // //still a fatal parsing error, unfixable
                // if(nextFix.messages && nextFix.messages > 0 && nextFix.messages[0].fatal){
                //     return undefined;
                // }
                // //merge back
                // var end = this.getLines(snippet.code, nextError.line)
                // snippet.code = nextFix.output+"\n" + end;
                // return snippet;
            }
        }

        snippet.code = fix.output;
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
        if(typeof code === "undefined") return undefined;
        snippet.code = code;
        return snippet;
    }

    getLine(code, line){
        if(typeof line === "undefined") return undefined;
        var index = line - 1;
        var lines = code.split("\n");
        if(index >= lines.length) return undefined;
        return lines[index];
    }

    getLines(code, start, end){
        if(typeof start === "undefined") return undefined;
        var lines = code.split("\n");
        if(typeof end === "undefined"){
            end = lines.length;
        }
        start = start - 1;
        var subset = lines.slice(start, end);
        return subset.join("\n");
    }

    commentLine(code, lineNum){
        var line = this.getLine(code, lineNum);
        if(typeof line === "undefined") return undefined;
        var lines = code.split("\n");
        var index = lineNum - 1;

        lines[index] = "// " + line;

        return lines.join("\n");
    }

    replaceLine(code, lineNum, replacement){
        if(typeof lineNum === "undefined") return undefined;
        var index = lineNum - 1;
        var lines = code.split("\n");
        lines[index] = replacement;
        return lines.join("\n");
    }
}

module.exports = Fixer;