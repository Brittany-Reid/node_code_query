require("mocha");
var assert = require("assert");
const Evaluator = require("../src/core/evaluator/evaluator");
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
    describe("sorting", function () {
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
        it("code snippets with no code should go last", function () {
            /* This is meant to handle all commented out cases.
            * I already filtered code snippets to remove empty ones from the dataset.
            */
            var snippetA = new Snippet(""); //empty
            var snippetB = new Snippet("<jsx>\n</jsx>"); //will be completely commented out
            var snippetC = new Snippet("class A extends B{\nconstructor(){}\n}") //will have an error
            var snippetD = new Snippet("var a;") //no errors

            var snippets = [snippetA, snippetB, snippetC, snippetD];
            var evaluatedSnippets = new Evaluator().fix(snippets);
            
            assert.strictEqual(evaluatedSnippets[0].hasCode, false);
            assert.strictEqual(evaluatedSnippets[1].hasCode, false);
            assert.strictEqual(evaluatedSnippets[2].errors.length, 1);
            assert.strictEqual(evaluatedSnippets[3].errors.length, 0);

            evaluatedSnippets.sort(Snippet.sort);
            
            assert.strictEqual(evaluatedSnippets[0].code, snippetD.code); //no error
            assert.strictEqual(evaluatedSnippets[1].code, snippetC.code); //has errors
            //no code, retains original order
            assert.strictEqual(evaluatedSnippets[2].code, snippetA.code);
            assert.strictEqual(evaluatedSnippets[3].code, snippetB.code);

        });
    }); 
});