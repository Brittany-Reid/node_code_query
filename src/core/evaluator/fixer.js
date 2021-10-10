const LinterHandler = require("./linter-handler");

/**
 * Our code snippet fixer.
 */
class Fixer{

    constructor(linter){
        /**@type {LinterHandler} */
        this.linter = linter;
        this.rules = {
            "parsing-error": true,
        }
    }

    wasFixed(messages, fixedMessages){
        var fixed = false;
        var beforeErrors = LinterHandler.errors(messages);
        var afterErrors = LinterHandler.errors(fixedMessages);
        for(var e of beforeErrors){
            if(e.fatal) continue;
            var currentFixed = true;
            var name = e.ruleId;
            var line = e.line;
            var column = e.column;
            for(var e2 of afterErrors){
                if(name === e2.ruleId && line === e2.line && e2.column === column){
                    currentFixed = false;
                    break;
                }
            }
            if(currentFixed){
                fixed = true;
                break;
            }
        }
        return fixed;
    }

    /** Run full ESLint on code snippet */
    runESLint(snippet){
        //get messages
        var messages = this.linter.lint(snippet.code);

        var fix = this.linter.fix(snippet.code);
        
        //update snippet
        snippet.code = fix.output;
        snippet.errors = LinterHandler.errors(fix.messages);
        var fixed = this.wasFixed(messages, fix.messages);

        snippet = this.hasCode(snippet);
        if(fixed) snippet.fixed = true;

        return snippet;
    }

    /**
     * Try to parse.
     */
    parse(snippet){
        var errors = this.linter.parse(snippet.code);
        snippet.errors = errors;
        return snippet;
    }

    attemptFix(snippet, parse){
        var fixed = false;

        if(parse){
            snippet = this.parse(snippet);
            if(!snippet.errors || snippet.errors.length < 1) return {snippet, fixed};
        }
        
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
            // case "no-import-export":
            //     fix = this.fixNoImportExport(snippet, error);
            //     break;
            case "parsing-error":
                fix = this.fixParsingError(snippet, error);
                break;
        }
        if(typeof fix === "undefined"){
            fixed = false;
        }
        else{
            snippet = fix;
            snippet.fixed = true;
            fixed = true;
        }
        return {snippet, fixed: fixed}
    }

    fix(snippet){

        var first = true;

        //step 1, run eslint
        snippet = this.runESLint(snippet);
        //step 2a, if it has no parsing errors, return
        if(!this.hasErrors(snippet)){
            return snippet;
        }

        //step 2b, if it has parsing errors try to fix
        var stop = false;
        var fixed = false;

        //run until no more fixes have been applied
        while(!stop){
            var fix = this.attemptFix(snippet, !first);
            snippet = fix.snippet;
            fixed = fix.fixed;
            if(fixed === false){
                stop = true;
            }
            if(first) first = false;
        }

        //rerun eslint again if we now have no parsing errors
        //(it wont run eslint fixes if there is a parsing error)
        if(!this.hasErrors(snippet)){
            snippet = this.runESLint(snippet);
        }

        return snippet;
    }

    /**
     * Check for parsing errors.
     * ESLint returns a single fatal error in this case.
     * @param {Snippet} snippet 
     * @returns 
     */
    hasErrors(snippet){
        var errors = snippet.errors;
        if(errors.length < 1) return false;
        if(errors[0].fatal) return true;
    }

    /**
     * Check if has code and update snippet state.
     */
    hasCode(snippet, parse = false){
        if(parse) this.parse(snippet)
        var code = this.linter.linter.getSourceCode();
        if(!code) return snippet;
        var ast = code.ast;
        if(!ast.tokens || ast.tokens.length === 0){
            snippet.hasCode = false;
        }
        return snippet;
    }

    getError(message){
        if(message.startsWith("Parsing error: ")) return "parsing-error";
    }


    runESLintAsModule(code){
        this.linter.config.parserOptions.sourceType = "module";
        var fix = this.linter.fix(code);
        this.linter.config.parserOptions.sourceType = "script";
        return fix;
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