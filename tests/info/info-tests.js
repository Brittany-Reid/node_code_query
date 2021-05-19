require("mocha");
const { doesNotMatch } = require("assert");
var assert = require("assert");
const path = require("path");
const DataHandler = require("../../ncq/core/data-handler");
const { getConfig } = require("../../ncq/config");
const { getBaseDirectory } = require("../../ncq/utils");

var config = getConfig();
const BASE_DIR = getBaseDirectory();
const SNIPPET_DIR = path.join(BASE_DIR, config.get("files.snippets"));
const SNIPPET_DB = path.join(BASE_DIR, config.get("files.snippetDB"));
const INFO_DIR = path.join(BASE_DIR, config.get("files.info"));
const INFO_DB = path.join(BASE_DIR, config.get("files.packageDB"));
const TASK_DIR = path.join(BASE_DIR, config.get("files.tasks"));

/**
 * Stats for the paper :)
 */

describe("Info", function () {
    this.timeout(0);

    /**
     * Runs once. Makes a global datahandler.
     */
    before(() => {
        data = new DataHandler();
        // data.loadPackages(INFO_DIR, INFO_DB);
        // data.loadSnippets(SNIPPET_DIR, SNIPPET_DB);
        //data.loadTasks(TASK_DIR);
    });


    it("How many packages?", function () {
        data.loadPackages(INFO_DIR, INFO_DB);
        console.log("Packages: " + data.nameToId.size);
    });

    it("How many snippets?", function(){
        data.loadSnippets(SNIPPET_DIR, SNIPPET_DB);
        console.log("Snippets: " + data.snippets.length);
    });

    // it("How many tasks?", function(){
    //     console.log("Tasks: " + data.tasks.size);
    // });
});