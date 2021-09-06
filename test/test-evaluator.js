require("mocha");
var assert = require("assert");
const Snippet = require("../src/core/snippet");
const Evaluator = require("../src/core/evaluator/evaluator");

/**
 * Test Evaluator class.
 */
describe("Evaluator", function () {
    describe("functions", function () {
        it("should get errors for snippets", function () {
            var snippets = [
                new Snippet("<html>")
            ];
            var evaluator = new Evaluator();
            var evaluatedSnippets = evaluator.errors(snippets);
            assert.strictEqual(evaluatedSnippets[0].errors.length, 1);
        });
        it("should fix snippets", function () {
            var snippets = [
                new Snippet("var b = 1")
            ];
            var evaluator = new Evaluator();
            var evaluatedSnippets = evaluator.fix(snippets);
            assert.strictEqual(evaluatedSnippets[0].code, "var b = 1;");
        });
        it("should handle import", function () {
            var snippets = [
                new Snippet("import 'x';")
            ];
            var evaluator = new Evaluator();
            var evaluatedSnippets = evaluator.fix(snippets);
            assert.strictEqual(evaluatedSnippets[0].code, "require('x');");
        });
        it("should handle single parsing error", function () {
            var snippets = [
                new Snippet(
                    "var a;\n" +
                    "<jsx>"
                )
            ];
            var evaluator = new Evaluator();
            var evaluatedSnippets = evaluator.fix(snippets);
            assert.strictEqual(evaluatedSnippets[0].code, "var a;\n// <jsx>");
        });
        // it("should handle error on wrong line", function () {
        //     var snippets = [
        //         new Snippet(
        //             'return (\n' +
        //             ');\n' +
        //             'export default App;'
        //         )
        //     ];
        //     var evaluator = new Evaluator();
        //     var evaluatedSnippets = evaluator.fix(snippets);
        //     //line 3 already commented out
        //     assert.strictEqual(evaluatedSnippets[0].code, "return (\n// );\n// export default App;")
        // });
        // it("should handle export/input before parsing error", function () {
        //     var snippets = [
        //         new Snippet(
        //             'export const CONTINUE = 100\n' +
        //             'export const SWITCHING_PROTOCOLS = 101\n' +
        //             '\n' +
        //             'export const STATUS_MAP = {\n' +
        //             "    [CONTINUE]: 'Continue',\n" +
        //             "    [SWITCHING_PROTOCOLS]: 'Switching Protocols',\n" +
        //             '}'
        //         )
        //     ];
        //     var evaluator = new Evaluator();
        //     var evaluatedSnippets = evaluator.fix(snippets);
        //     assert.strictEqual(evaluatedSnippets[0].code, '//export const CONTINUE = 100\n' +
        //     '//export const SWITCHING_PROTOCOLS = 101\n' +
        //     '\n' +
        //     '// export const STATUS_MAP = {\n' +
        //     "//     [CONTINUE]: 'Continue',\n" +
        //     "//     [SWITCHING_PROTOCOLS]: 'Switching Protocols',\n" +
        //     '// }');
        // });
        // it("doesn't timeout on this case", function () {
        //     //the import conversion doesnt work here, needs a better fix
        //     var snippets = [
        //         new Snippet(
        //             '/* a2\n' +
        //             ' */ import a /* a3 */ from "a"; /* a4 */ /* not-a\n' +
        //             '*/ // comment after import chunk'
        //         )
        //     ];
        //     var evaluator = new Evaluator();
        //     var evaluatedSnippets = evaluator.fix(snippets);
        //     assert(true);
        // });
    });
});