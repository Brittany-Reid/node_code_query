require("mocha");
var assert = require("assert");
const NCQ = require("../ncq/core/ncq");

/**
 * NCQ tests
 */
describe("NCQ", function () {
    var ncqService;
    describe("functions", function(){
        it("should initialize object", async function(){
            ncqService = new NCQ({recordLimit: 1000});
            await ncqService.initialize();

            assert(ncqService !== undefined);
            assert(ncqService.state !== undefined);
        }).timeout(0); //no timeout for loading
        it("should search for snippets by package", function(){
            var snippets = ncqService.snippetsByPackages(["111-hello-world"]);
            assert(snippets.length > 0);
        });
        it("should search for packages by task", function(){
            var packages = ncqService.packagesByTask("utility");
            assert(packages.length > 0);
        });
    });
});