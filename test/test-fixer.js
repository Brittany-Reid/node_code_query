require("mocha");
var assert = require("assert");
const Fixer = require("../src/core/evaluator/fixer");
const LinterHandler = require("../src/core/evaluator/linter-handler");
const Snippet = require("../src/core/snippet");
const sinon = require("sinon");

describe("Fixer", function () {
    /**@type {Fixer}*/
    var fixer; 
    before(function(){
        fixer = new Fixer(new LinterHandler());
    });

    describe("unit tests", function(){
        describe("wasFixed", function(){
            it("should return fixed for fixing import error", function () {
                var snippet = new Snippet("import 'a'")
                var messagesA = fixer.linter.lint(snippet.code);
                var messagesB = fixer.linter.fix(snippet.code).messages;
                var fixed = fixer.wasFixed(messagesA, messagesB);
                assert.strictEqual(fixed, true);
            });
            it("should return nonfixed for syntax only", function () {
                var snippet = new Snippet("var a")
                var messagesA = fixer.linter.lint(snippet.code);
                var messagesB = fixer.linter.fix(snippet.code).messages;
                var fixed = fixer.wasFixed(messagesA, messagesB);
                assert.strictEqual(fixed, false);
            });
        });
        describe("hasCode", function(){
            it("tells us if a code snippet is all comments", function () {
                const snippet = new Snippet("\n\n//<var a;");
                var result = fixer.hasCode(snippet, true);
                assert.strictEqual(result.hasCode, false);
            });
        });
        describe("fix", function(){
            it("fixes style warnings", function () {
                const snippet = new Snippet("\tvar a;");
                var result = fixer.fix(snippet);
                assert.strictEqual(result.code, "var a;");
                assert.strictEqual(result.fixed, false)
            });
            it("fixes import", function () {
                const snippet = new Snippet("import 'a';");
                var result = fixer.fix(snippet);
                assert.strictEqual(result.code, "require('a');");
                assert.strictEqual(result.fixed, true)
            });
            it("fixes import/export with other parsing errors", function () {
                const snippet = new Snippet("import 'a';\n<jsx>");
                var result = fixer.fix(snippet);
                assert.strictEqual(result.code, "require('a');\n// <jsx>");
                assert.strictEqual(result.fixed, true)
            });
            it("fixes parsing errors", function () {
                const snippet = new Snippet("<jsx>");
                var result = fixer.fix(snippet);
                assert.strictEqual(result.code, "// <jsx>");
                assert.strictEqual(result.fixed, true)
            });
            it("reports if commented out", function () {
                const snippet = new Snippet("<jsx>");
                var result = fixer.fix(snippet);
                assert.strictEqual(result.hasCode, false);
            });
            it("fixes parsing errors with style errors", function () {
                const snippet = new Snippet("<jsx>\n\tvar a;");
                var result = fixer.fix(snippet);
                assert.strictEqual(result.code, "// <jsx>\nvar a;");
                assert.strictEqual(result.fixed, true)
            });
            it("fixes multiple parsing errors", function () {
                const snippet = new Snippet("<jsx>\n<html>");
                var result = fixer.fix(snippet);
                assert.strictEqual(result.code, "// <jsx>\n// <html>");
                assert.strictEqual(result.fixed, true)
            });
        });
    //     describe("fix imports/exports", function(){
    //         it("comment case is handled", function () {
    //             //dont cut just the line with the error, cut the segment until next error only if it fails first try
    //             const snippet = new Snippet("/*\n*/ import /* hi */ 'a'");
    //             var result = fixer.fix(snippet);
    //             assert.strictEqual(result.code, "/*\n*/ require('a');") //it removes the comment
    //         });
    //         // it("handles import with parsing error", function () {
    //         //     const snippet = new Snippet("import 'a'\n<jsx>");
    //         //     var result = fixer.fix(snippet);
    //         //     assert.strictEqual(result.code, "require('a');\n// <jsx>")
    //         // });
    //     });
    //     describe("attemptFix", function(){
    //         it("attemptFix returns fixed when snippet changed", function () {
    //             const snippet = new Snippet("return (\n);");
    //             var result = fixer.attemptFix(snippet);
    //             assert.strictEqual(result.fixed, true);
    //         });
    //         it("attemptFix on no fix has correct errors", function () {
    //             const snippet = new Snippet("return (\n// );");
    //             var result = fixer.attemptFix(snippet);
    //             assert.strictEqual(result.fixed, false);
    //             assert.strictEqual(result.snippet.errors[0].message, "Parsing error: Unexpected token");
    //         });
    //     });
    // });
    // /*Tests to make sure these things happen for optimization purposes:*/
    // describe("optimization conformity", function(){
    //     it("should fix eslint rule without running eslint twice", function () {
    //         //resolved eslint rules case
    //         const snippet = new Snippet("\tvar a;");
    //         var eslintSpy = sinon.spy(fixer, "runESLint");
    //         var result = fixer.fix(snippet);
    //         assert.strictEqual(result.code, "var a;")
    //         assert.strictEqual(eslintSpy.callCount, 1);
    //         eslintSpy.restore();
    //     });
    //     it("on non fixable eslint error, should only run eslint once", function () {
    //         //resolved eslint rules case
    //         const snippet = new Snippet("function f(a, a){}");
    //         var eslintSpy = sinon.spy(fixer, "runESLint");
    //         var result = fixer.fix(snippet);
    //         assert.strictEqual(result.code, "function f(a, a){}")
    //         assert.strictEqual(eslintSpy.callCount, 1);
    //         eslintSpy.restore();
    //     });
    });
});