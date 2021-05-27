require("mocha");
var assert = require("assert");
const ProgressMonitor = require("progress-monitor");

// const path = require("path");
const DataHandler = require("../ncq/core/data-handler");
const Package = require("../ncq/core/package");
const Snippet = require("../ncq/core/snippet");

/**
 * Test DataHandler class. This can be time intensive, because we are loading from a file, so some tests have extended time out.
 */
describe("DataHandler", function () {
    /**
     * @type {DataHandler}
     */
    var data;

    /**
       * Runs once. Makes a global datahandler.
       */
    before(() => {
        data = new DataHandler();
    });

    describe("functions", function () {
        describe("load", function () {
            it("should load in database", async function () {
                await data.loadDatabase();
                //check if objects are loaded
                assert(data.idToPackage.size > 0);
                assert(data.packageNameToId.size > 0);
                assert(data.idToSnippet.size > 0);
                assert(data.packageIdToSnippetIdArray.size > 0);
                assert(data.packageIndex !== undefined);
            }).timeout(0); //no timeout for load
            it("should report with a monitor", async function () {
                var data2 = new DataHandler({recordLimit:100});
                var monitor = new ProgressMonitor();
                var works = 0;
                monitor.on("work", ()=>{
                    works++;
                })
                await data2.loadDatabase(monitor);
                assert(monitor.state.done);
                //work is called 100 times on submonitor2
                assert(works === 100);
                
            }).timeout(0); //no timeout for load
        });
        describe("retrieval", function () {
            it("should be able to search packages with string", function () {
                var packages = data.searchPackages("utility");
                //check we got results
                assert(packages.length > 0);
                assert(packages[0] instanceof Package);
            });
            it("should handle no results", function () {
                var packages = data.searchPackages("impossible task abwebfifeibib gibberish");
                //check we got no results
                assert(packages.length === 0);
            });
            it("should be able to get snippets for a package", function () {
                var packageName = data.packageNameToId.keys().next().value;
                var snippets = data.getSnippetsForPackage(packageName);
                assert(snippets.length > 0);
                assert(snippets[0] instanceof Snippet)
            });
            it("should be able to get array of packages", function () {
                var packages = data.packages;
                assert(packages.length > 0);
                assert(packages[0] instanceof Package);
            });
            it("should be able to get array of snippets", function () {
                var snippets = data.snippets;
                assert(snippets.length > 0);
                assert(snippets[0] instanceof Snippet);
            });
        });
        describe("utility", function () {
            it("should make keyword array from string", async function () {
                var keywords = await DataHandler.keywords("do a tasks");
                //remove stopwords and stem
                assert(keywords[0] == "task");
            });
        });
    });
});
