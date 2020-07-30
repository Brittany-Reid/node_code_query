require("mocha");
const { getConfig } = require("../ncq/config");

var assert = require("assert");
const path = require("path");
const DataHandler = require("../ncq/service/data-handler");
const { getBaseDirectory } = require("../ncq/utils");

var config = getConfig();
const BASE_DIR = getBaseDirectory();
const SNIPPET_DIR = path.join(BASE_DIR, config.get("files.snippets"));
const SNIPPET_DB = path.join(BASE_DIR, config.get("files.snippetDB"));
const INFO_DIR = path.join(BASE_DIR, config.get("files.info"));
const INFO_DB = path.join(BASE_DIR, config.get("files.packageDB"));
const TASK_DIR = path.join(BASE_DIR, config.get("files.tasks"));

/**
 * Test DataHandler class. This can be time intensive, because we are loading from a file, so some tests have extended time out.
 */
describe("DataHandler", function () {
  var data;

  /**
   * Runs once. Makes a global datahandler.
   */
  before(() => {
    data = new DataHandler();
  });

  describe("functions", function () {
    describe("load", function () {
      it("should load in package info", function () {
        data.loadPackages(INFO_DIR, INFO_DB);
        //has packages
        assert(data.idToPackage.size > 0);
        assert(data.packageIndex !== undefined);
        assert(data.nameToId.size > 0);
      }).timeout(0); //no timeout for load
      it("should load in some snippets", function () {
        data.loadSnippets(SNIPPET_DIR, SNIPPET_DB);
        //has snippets
        assert(data.snippets.length > 0);
        assert(data.snippetIndex !== undefined);
      }).timeout(0); //no timeout for load
      it("should load in tasks", async function () {
        data.loadTasks(TASK_DIR);
        assert(data.tasks.size > 0);
      }).timeout(0); //no timeout for load
    });
    describe("retrieve", function () {
      it("should be able to search snippets with task", function () {
        var snippets = data.taskToSnippets("read files");
        assert(snippets.length > 0);
      });
      it("should be able to search packages with task", function () {
        var packages = data.taskToPackages("read files");
        assert(packages.length > 0);
      });
      it("should be able to search snippets with package", function () {
        var packages = data.packageToSnippets("acute");
        assert(packages.length > 0);
      });
      it("should be able to get array of tasks", function () {
        var tasks = data.getTaskArray();
        assert(tasks.length > 0);
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
