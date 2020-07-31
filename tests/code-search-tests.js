require("mocha");
var assert = require("assert");
const path = require("path");
const CodeSearch = require("../ncq/service/code-search");

/**
 * Code Search Tests.
 */
describe("Code Search", function () {
    var codeSearch;
    describe("functions", function(){
        it("should initialize object", function(){
            codeSearch = new CodeSearch();
            codeSearch.initialize();

            assert(codeSearch !== undefined);
            assert(codeSearch.state !== undefined);
        }).timeout(0); //no timeout for loading

        it("should search for snippets by task", function(){
            var snippets = codeSearch.snippetsByTask("read file");
            assert(snippets.length > 0);
        });
        it("should search for snippets by package", function(){
            var snippets = codeSearch.snippetsByPackages(["acute"]);
            assert(snippets.length > 0);
        });
        it("should search for packages by task", function(){
            var packages = codeSearch.packagesByTask("read file");
            assert(packages.length > 0);
        });
    });
});