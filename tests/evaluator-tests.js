const { getConfig } = require("../ncq/config");

require("mocha");
var assert = require("assert");
var path = require("path");
const DataHandler = require("../ncq/core/data-handler");
const LinterHandler = require("../ncq/core/linter-handler");
const { getBaseDirectory } = require("../ncq/utils");
const Evaluator = require("../ncq/core/evaluator");
const { errors } = require("../ncq/core/linter-handler");
const Snippet = require("../ncq/core/snippet");

var config = getConfig();
const BASE_DIR = getBaseDirectory();
const SNIPPET_DIR = path.join(BASE_DIR, config.get("files.snippets"));
const SNIPPET_DB = path.join(BASE_DIR, config.get("files.snippetDB"));

/**
 * Test LinterHandler class.
 */
describe("Evaluator", function () {
    var snippets = [];
    before(function(){
        // this.timeout(0);
        // var data = new DataHandler();
        // data.loadSnippets(SNIPPET_DIR, SNIPPET_DB);
        // var idToSnippets = data.snippets;
        // for(var id of idToSnippets){
        //     if(!id) continue;
        //     snippets.push(id);
        // }
        // snippets = snippets.slice(0, 1);
        
    });
    describe("functions", function () {
      it("should get errors for snippets", function () {
        var snippets = [
            new Snippet("b = 1")
        ]
        var evaluator = new Evaluator();
        var evaluatedSnippets = evaluator.errors(snippets);
        assert.strictEqual(evaluatedSnippets[0].errors.length, 1)
      });
      it("should fix snippets", function () {
        var snippets = [
            new Snippet("var b = 1")
        ]
        var evaluator = new Evaluator();
        var evaluatedSnippets = evaluator.fix(snippets);
        assert.strictEqual(evaluatedSnippets[0].code, "var b = 1;")
      });
    });
    
});