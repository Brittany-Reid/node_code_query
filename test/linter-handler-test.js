require("mocha");
var assert = require("assert");
const LinterHandler = require("../ncq/core/linter-handler");

/**
 * Test LinterHandler class.
 */
describe("LinterHandler", function () {  
    describe("functions", function () {
        it("should get messages", function () {
            var messages = new LinterHandler().lint("var foo = bar; bar+1");
            assert.strictEqual(messages.length, 4);
        });
        it("should filter errors", function () {
            var linter =  new LinterHandler();
            var messages = linter.lint("var foo = bar; bar+1");
            var errors = LinterHandler.errors(messages);
            assert.strictEqual(errors.length, 2);
        });
    });
});