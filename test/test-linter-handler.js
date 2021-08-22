require("mocha");
var assert = require("assert");
const LinterHandler = require("../src/core/evaluator/linter-handler");

/**
 * Test LinterHandler class.
 */
describe("LinterHandler", function () {  
    describe("functions", function () {
        it("parse should not report style warnings", function () {
            var snippet = "\tvar a;";
            var linter = new LinterHandler();
            var result = linter.parse(snippet)
            assert.strictEqual(result.length, 0);
        });
        it("should get messages", function () {
            var linter = new LinterHandler();
            linter.config.rules = {
                "no-undef": "error"
            };
            var messages = linter.lint("var foo = bar;");
            assert.strictEqual(messages.length, 1);
            assert.strictEqual(messages[0].ruleId, "no-undef");
        });
        it("should filter errors", function () {
            var linter = new LinterHandler();
            linter.config.rules = {
                "no-undef": "error",
                "semi": "warn"
            };
            var messages = linter.lint("var foo = bar");
            var errors = LinterHandler.errors(messages);
            assert.strictEqual(errors.length, 1);
            assert.strictEqual(messages[0].ruleId, "no-undef");
        });
        it("should fix errors", function () {
            var linter = new LinterHandler();
            linter.config.rules = {
                "semi": "warn"
            };
            var result = linter.fix("var foo = bar");
            assert.strictEqual(result.output, "var foo = bar;");
        });
        
    });
});