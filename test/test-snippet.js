require("mocha");
var assert = require("assert");
const Snippet = require("../src/core/snippet");

/**
 * Test Snippet Class
 */
describe("Snippet", function () {
    describe("unit tests", function(){
        it("should create from snippet", function () {
            var code = "var a = 0;";
            var id = 42;
            var order = 3;
            var packageObject = {
                name: "p1",
                stars: 100
            };
            var snippet = new Snippet(code, id, order, packageObject);
            assert.strictEqual(snippet.code, code);
            assert.strictEqual(snippet.id, id);
            assert.strictEqual(snippet.order, order);
            assert.strictEqual(snippet.package, packageObject.name);
            assert.strictEqual(snippet.stars, packageObject.stars);
        });
    });
    describe("functions", function () {
        it("unevaluated snippets last", function () {
            var snippetA = new Snippet("a");
            var snippetB = new Snippet("b");
            var snippetC = new Snippet("c");
            var snippetD = new Snippet("d");
            snippetA.errors = [{}];
            snippetC.errors = [{}];
            var result = [snippetA, snippetB, snippetC, snippetD].sort(Snippet.sort);
            assert.strictEqual(result[0].code, "a");
            assert.strictEqual(result[2].code, "b");
        });
        it("sort rankings should be correct", function () {
            var snippetA = new Snippet("a");
            var snippetB = new Snippet("b");
            var snippetC = new Snippet("c");
            var snippetD = new Snippet("d");
            snippetA.rankValue = 1;
            snippetB.rankValue = 2;
            snippetC.rankValue = 0;
            snippetD.rankValue = 0;
            var result = [snippetA, snippetB, snippetC, snippetD].sort(Snippet.sort);
            assert.strictEqual(result[0].code, "c");
            assert.strictEqual(result[1].code, "d");
            assert.strictEqual(result[2].code, "a");
            assert.strictEqual(result[3].code, "b");
        });
        it("sort should rank 1 below 0", function () {
            var snippetA = new Snippet("");
            var snippetB = new Snippet("");
            snippetA.rankValue = 0;
            snippetB.rankValue = 1;
            var result = Snippet.sort(snippetA, snippetB);
            assert.strictEqual(result, -1);

        });
    }); 
});