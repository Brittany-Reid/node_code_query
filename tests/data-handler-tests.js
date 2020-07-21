require("mocha");
var assert = require("assert");
const path = require("path");
const DataHandler = require("../ncq/service/data-handler");
const { getBaseDirectory } = require("../ncq/utils");

const BASE = getBaseDirectory();
const SNIPPET_DIR = path.join(BASE, "data/snippets.json");
const INFO_DIR = path.join(BASE, "data/packageStats.json");
const TASK_PATH = path.join(BASE, "data/id,tasks.txt");

/**
 * Test DataHandler class. This can be time intensive, because we are loading from a file, so some tests have extended time out.
 * Feel free to adjust them if they timeout for you.
 */
describe("DataHandler", function () {
  var data;
  /**
   * Runs once. Makes a global datahandler.
   */
  before(() => {
    data = new DataHandler();
    data.MAX = 10000;
  });

  describe("functions", function () {
    it("should load in package info", function () {
      data.loadInfo(INFO_DIR);
      assert(data.packageToInfo.size > 0);
    }).timeout(0); //no timeout for load
    it("should load in some snippets", function () {
      data.loadSnippets(SNIPPET_DIR);

      //has snippets
      assert(data.idTosnippets.size > 0);
      //has snippets for packages
      assert(data.packageToSnippet.size > 0);
      //has keywords in keyword map
      assert(data.keyWordMap.size > 0);
    }).timeout(0); //no timeout for load
    it("should load in tasks", async function () {
      data.loadTasks(TASK_PATH);
      assert(data.tasks.size > 0);
    }).timeout(0); //no timeout fr load
    it("should make keyword array from string", async function () {
      var keywords = await data.getKeywords("do a tasks");
      //remove stopwords and stem
      assert(keywords[0] == "task");
    });
    it("should be able to search for task", function () {
      var snippets = data.getSnippetsFor("read files");
      assert(snippets.length > 0);
    });
    it("should be able to handle an empty task", function () {
      var snippets = data.getSnippetsFor("");
      assert(snippets.length == 0);
    });
    it("should be able to search for task and return no results", function () {
      var snippets = data.getSnippetsFor(
        "nonsense task 123456 hello 654321 moo"
      );
      assert(snippets.length == 0);
    });
    it("results for file and files should be the same", function () {
      var snippets = data.getSnippetsFor("file");
      var snippets2 = data.getSnippetsFor("files");
      assert(snippets.length == snippets2.length);
    });
    it("should get package snippets", function () {
      //get first packagename to test with
      var packageName = Array.from(data.packageToSnippet.keys())[0];

      //get snippets for this package name
      var snippets = data.getPackageSnippets(packageName);

      //must have at least 1 snippet
      assert(snippets.length > 0);
    });
    it("should get package names for task", function () {
      var packages = data.getPackages("read files");
      assert(packages.length > 0);
    });
    it("should get package names for task that is a suggestion", function () {
      var ids = Array.from(data.idTosnippets.keys());

      //add test task
      data.tasks.set("test task", [ids[0]]);

      var packages = data.getPackages("test task");
      assert(packages.length > 0);
    });
  });
});
