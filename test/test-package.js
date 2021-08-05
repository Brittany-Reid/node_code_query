require("mocha");
const assert = require("assert");
const DataHandler = require("../src/core/data-handler");
const Package = require("../src/core/package");

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
    });

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
        });
        it("should get rank", function(){
            var package = data.packages[0];
            var rank = package.rank();
            assert.strictEqual(rank, package.ableToBuildPrediction);
        });
        it("should sort based on rank", function(){
            var p1 = new Package({name: "p1", ableToBuild: 0}, 0);
            var p2 = new Package({name: "p2", ableToBuild: 1}, 0);
            var p3 = new Package({name: "p3", ableToBuild: 0}, 0);
            var packages = [p1, p2, p3].sort(Package.sort);
            assert.strictEqual(packages[0].name, "p2");
        });
        it("should sort based on stars", function(){
            var p1 = new Package({name: "p1", ableToBuild: 0, stars:1000}, 0);
            var p2 = new Package({name: "p2", ableToBuild: 1}, 0);
            var p3 = new Package({name: "p3", ableToBuild: 0, stars:10}, 0);
            var packages = [p1, p2, p3].sort(Package.sort);
            assert.strictEqual(packages[0].name, "p1");
            assert.strictEqual(packages[1].name, "p3");
        });
    });
});