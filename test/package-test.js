require("mocha");
const assert = require("assert");
const DataHandler = require("../ncq/core/data-handler");

/**
 * Test Package class.
 */
describe("Package", function () {
    var data;

    /**
     * Load in a single package.
     */
    before(async function(){
        this.timeout(0);
        data = new DataHandler({recordLimit:1});
        return await data.loadDatabase();
    })

    describe("unit tests", function(){
        it("should create a package from dataset correctly", function (){
            var package = data.packages[0];
            
            assert(typeof package.id === "number");
            assert(typeof package.name === "string");
            assert(typeof package.description === "string");
            assert(Array.isArray(package.keywords));
            assert(typeof package.hasRunExample === "boolean");
            assert(package.hasReadme);
            assert(typeof package.hasLicense === "boolean");
            assert(typeof package.hasInstallExample === "boolean");
            assert(typeof package.lastUpdate === "number");
            assert(typeof package.hasRepoUrl === "boolean");
            assert(typeof package.snippetCount === "number");
            assert(typeof package.linesInReadme === "number");
            assert(typeof package.stars === "number");
            assert(typeof package.hasTestDirectory === "boolean");
        })
    })
});