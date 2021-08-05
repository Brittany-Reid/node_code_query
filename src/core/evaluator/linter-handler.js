const Linter = require("eslint").Linter;
const nodeRules = require("eslint-plugin-node").rules;
const noImport = require("./rules/no-import");
const noExport = require("./rules/no-export");

/**
 * Handles linting with ESLint. Constructs linter with our settings.
 */
class LinterHandler {
    constructor() {
        this.linter = new Linter();
        this.config = {};
        this.options = {
            allowInlineConfig: false,
            filename: "main.js",
        };
        

        var rules = this.setupRules();

        this.config.rules = rules;
        this.config.env = {node: true, es2020: true};
        this.config.parserOptions = {
            sourceType: "script"
        };
    }

    setupRules(){
        var scopedNodeRules = {};
        Object.keys(nodeRules).forEach((key)=>{
            scopedNodeRules["node/" + key] = nodeRules[key];
        });
        this.linter.defineRules(scopedNodeRules);
        this.linter.defineRule("no-import", noImport);
        this.linter.defineRule("no-export", noExport);

        //console.log(this.linter.getRules().get("node/no-path-concat"))

        var rules = {
            //custom fixes
            "no-import" : "error",
            "no-export" : "error",
            //errors
            //"no-undef": "error",
            "no-dupe-args": "error", //error
            "no-dupe-keys": "error", //error
            "no-invalid-regexp": "error",
            "no-obj-calls": "error",
            "no-this-before-super": "error",
            "no-shadow-restricted-names": "error",
            "constructor-super": "error",
            "no-const-assign": "error",
            "no-dupe-class-members": "error",
            "no-new-symbol": "error",
            /*
             * Warning level rules.
             * These don't provide any error info, so count as warnings.
             */
            //possible errors with fixes
            "eqeqeq": ["warn", "always"],
            "curly": ["warn", "multi-line"],
            //consistant style fixes
            "dot-location": ["warn", "property"],
            "no-extra-bind": "warn",
            "no-floating-decimal": "warn",
            "no-multi-spaces": "warn",
            "yoda": ["warn", "never"],
            "no-extra-boolean-cast": "warn",
            "no-regex-spaces": "warn",
            "indent": ["warn", "tab"],
            "no-useless-computed-key": "warn",
            "semi": "warn"
        };

        return rules;
    }

    /**
   * Lints string code.
   * @param {string} code String code to lint.
   * @return {Linter.LintMessage[]} Array of linter messages.
   */
    lint(code) {
        var messages = this.linter.verify(code, this.config, this.options);
        return messages;
    }

    /**
   * Filters an array of messages to error severity only.
   * @param {Linter.LintMessage[]} messages Messages to filter.
   * @return {Linter.LintMessage[]} Array of filtred messages.
   */
    static errors(messages){
        var errors = messages.filter(function(message){
            if(message.severity == 2) return true;
        });
        return errors;
    }

    /**
   * Fix a given string of code.
   * @param {string} code String code to fix.
   * @returns {Linter.FixReport} Fix report object for the fixed code.
   */
    fix(code){
        return this.linter.verifyAndFix(code, this.config, this.options);
    }
}

module.exports = LinterHandler;
