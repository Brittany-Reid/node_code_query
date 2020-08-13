require("mocha");
var assert = require("assert");
const path = require("path");
const NCQ = require("../ncq/core/ncq");

/**
 * NCQ tests
 */
describe("NCQ", function () {
    var ncqService;
    describe("functions", function(){
        it("should initialize object", function(){
            ncqService = new NCQ();
            ncqService.initialize();

            assert(ncqService !== undefined);
            assert(ncqService.state !== undefined);
        }).timeout(0); //no timeout for loading

        it("should search for snippets by task", function(){
            var snippets = ncqService.snippetsByTask("read file");
            assert(snippets.length > 0);
        });
        it("should search for snippets by package", function(){
            var snippets = ncqService.snippetsByPackages(["acute"]);
            assert(snippets.length > 0);
        });
        it("should search for packages by task", function(){
            var packages = ncqService.packagesByTask("read file");
            assert(packages.length > 0);
        });
    });
});