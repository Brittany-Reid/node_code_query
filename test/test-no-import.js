require("mocha");
var assert = require("assert");
const LinterHandler = require("../src/core/evaluator/linter-handler");
const noImport = require("../src/core/evaluator/rules/no-import");

/**
 * Test Evaluator class.
 */
describe("Snippet", function () {
    /**@type {LinterHandler} */
    var linter; 
    before(()=>{
        linter = new LinterHandler();
        //add rule
        linter.linter.defineRule("no-import", noImport);
        linter.config.rules["no-import"] = "error";
        //set to module or import causes parsing error
        if(!linter.config.parserOptions) linter.config.parserOptions = {};
        linter.config.parserOptions.sourceType = "module";
    });
    describe("functions", function () {
        it("should handle import 'name'", function () {
            var code = "import 'name'";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "require('name');");
        });
        it("should handle import x from 'name'", function () {
            var code = "import x from 'name'";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "const x = require('name');");
        });
        it("should handle import {x} from 'name'", function () {
            var code = "import {x} from 'name'";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "const {x} = require('name');");
        });
        it("should handle import {a, b} from 'name'", function () {
            var code = "import {a, b} from 'name'";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "const {a, b} = require('name');");
        });
        it("should handle import * as x from 'name'", function () {
            var code = "import * as x from 'name'";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "const x = require('name');");
        });
        it("should handle {x as alias}", function () {
            var code = "import {x as alias} from 'name'";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "const {x:alias} = require('name');");
        });
        it("should handle combo", function () {
            var code = "import a, * as b from 'name'";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "const a = require('name');\nconst b = require('name');");
        });
        it("should handle combo", function () {
            var code = "import a, {b} from 'name'";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "const a = require('name');\nconst {b} = require('name');");
        });
        it("should handle combo", function () {
            var code = "import a, {b, a as f} from 'name'";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "const a = require('name');\nconst {b, a:f} = require('name');");
        });
    }); 
});

