const Linter = require("eslint").Linter;
const nodeRules = require("eslint-plugin-node").rules;
const noImport = require("./rules/no-import")
const noExport = require("./rules/no-export")

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
        this.config.env = {node: true, es2020: true}
        this.config.parserOptions = {
            sourceType: "script"
        }
    }

    setupRules(){
        var scopedNodeRules = {};
        Object.keys(nodeRules).forEach((key)=>{
            scopedNodeRules["node/" + key] = nodeRules[key];
        })
        this.linter.defineRules(scopedNodeRules);
        this.linter.defineRule("no-import", noImport);
        this.linter.defineRule("no-export", noExport);

        //console.log(this.linter.getRules().get("node/no-path-concat"))

        var rules = {
            //custom fixes
            "no-import" : "error",
            "no-export" : "error",
            //errors
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
            "semi" : "warn"
        }

        // var rules = {
        //     //custom
        //     "no-import" : "error",
        //     //best practice
        //     "accessor-pairs": ["warn", { "setWithoutGet": true, "enforceForClassMembers": true }],
        //     "curly": ["warn", "multi-line"],
        //     "eqeqeq": ["warn", "always", { "null": "ignore" }],
        //     "dot-location": ["warn", "property"],
        //     "no-caller": "warn",
        //     "no-empty-pattern": "warn",
        //     "no-eval": "warn",
        //     "no-extend-native": "warn",
        //     "no-extra-bind": "warn",
        //     "no-fallthrough": "warn",
        //     "no-floating-decimal": "warn",
        //     "no-func-assign": "warn",
        //     "no-global-assign": "warn",
        //     "no-implied-eval": "warn",
        //     "no-iterator": "warn",
        //     "no-labels": ["warn", { "allowLoop": false, "allowSwitch": false }],
        //     "no-lone-blocks": "warn",
        //     // "no-multi-spaces": "warn", //style
        //     "no-multi-str": "warn",
        //     "no-new": "warn",
        //     "no-new-func": "warn",
        //     "no-new-wrappers": "warn",
        //     "no-octal": "warn",
        //     "no-octal-escape": "warn",
        //     "no-proto": "warn",
        //     "no-redeclare": ["warn", { "builtinGlobals": false }],
        //     "no-return-assign": ["warn", "except-parens"],
        //     "no-self-assign": ["warn", { "props": true }],
        //     "no-self-compare": "warn",
        //     "no-sequences": "warn",
        //     "no-throw-literal": "warn",
        //     "no-unmodified-loop-condition": "warn",
        //     "no-useless-call": "warn",
        //     "no-useless-escape": "warn",
        //     "no-with": "warn",
        //     "wrap-iife": ["warn", "any", { "functionPrototypeMethods": true }],
        //     "yoda": ["warn", "never"],
        //     "no-unexpected-multiline": "warn",
        //     //possible errors
        //     "no-cond-assign": "warn",
        //     "no-constant-condition": ["error", { "checkLoops": false }], //error
        //     "no-control-regex": "warn",
        //     "no-debugger": "warn",
        //     "no-dupe-args": "error", //error
        //     "no-dupe-keys": "error", //error
        //     "no-duplicate-case": "warn",
        //     "no-empty-character-class": "warn",
        //     "no-ex-assign": "warn",
        //     "no-extra-boolean-cast": "warn",
        //     "no-extra-parens": ["warn", "functions"],
        //     "no-invalid-regexp": "error",
        //     "no-irregular-whitespace": "warn",
        //     "node/no-new-require": "warn",
        //     "no-obj-calls": "error",
        //     "node/no-path-concat": "warn",
        //     "no-regex-spaces": "warn",
        //     "no-sparse-arrays": "warn",
        //     "no-template-curly-in-string": "warn",
        //     "no-unreachable": "error",
        //     "no-unsafe-finally": "warn",
        //     "no-unsafe-negation": "warn",
        //     "use-isnan": ["warn", {
        //         "enforceForSwitchCase": true,
        //         "enforceForIndexOf": true
        //     }],
        //     "valid-typeof": ["warn", { "requireStringLiterals": true }],
        //     //variables
        //     "no-delete-var": "warn",
        //     "no-shadow-restricted-names": "error",
        //     //es6
        //     "constructor-super": "error",
        //     "no-class-assign": "warn",
        //     "no-const-assign": "error",
        //     "no-dupe-class-members": "error",
        //     "no-new-symbol": "error",
        //     "no-this-before-super": "error",
        //     "no-useless-computed-key": "warn",
        //     "no-useless-constructor": "warn",
        // };

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
        })
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