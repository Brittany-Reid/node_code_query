require("mocha");
var assert = require("assert");
const LinterHandler = require("../src/core/evaluator/linter-handler");
const noExport = require("../src/core/evaluator/rules/no-export");

/**
 * Test Evaluator class.
 */
describe("Snippet", function () {
    /**@type {LinterHandler} */
    var linter; 
    before(()=>{
        linter = new LinterHandler();
        //add rule
        linter.linter.defineRule("no-export", noExport);
        linter.config.rules["no-export"] = "error";
        //set to module or import causes parsing error
        if(!linter.config.parserOptions) linter.config.parserOptions = {};
        linter.config.parserOptions.sourceType = "module";
    });
    describe("functions", function () {
        it("should handle export default", function () {
            var code = "export default a;";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "//export default a;");
        });
        it("should handle export default", function () {
            var code = "var a;\nexport { a };";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "var a;\n//export { a };");
        });
        it("should handle export default", function () {
            var code = "export * from 'a';";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "//export * from 'a';");
        });
        it("should handle multiline", function () {
            var code = "var a,b;\nexport {\na,\nb\n};";
            var result = linter.fix(code);
            assert.strictEqual(result.output, "var a,b;\n/*\nexport {\na,\nb\n};*/\n");
        });
    }); 
});

