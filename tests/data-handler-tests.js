require("mocha");
var assert = require('assert');
const path = require("path");
const DataHandler = require("../ncq/data-handler");
const {getBaseDirectory} = require("../ncq/utils");

const BASE = getBaseDirectory();
const SNIPPET_DIR = path.join(BASE, "data/snippets");
const TASK_PATH = path.join(BASE, "data/tasks.txt");

describe('DataHandler', function() {
    describe('functions', function(){
        it('should return map of tasks to packages', async function(){
            var data = new DataHandler();
            await data.loadTasks(TASK_PATH);
            assert(data.getTasks().size > 0);
        });
        it('should return list of packages', async function(){
            var data = new DataHandler();
            var packages  = await data.loadPackges(SNIPPET_DIR);
            assert(packages.length > 0);
        });
        it('should make keyword array from string', async function(){
            var data = new DataHandler();
            var keywords  = await data.getKeywords("do a task");
            assert(keywords[0] == "task");
        });
        it('should load in some snippets', async function(){
            var data = new DataHandler();
            await data.loadSnippets(SNIPPET_DIR);
            //has snippets
            assert(data.snippets.size > 0);
            //has a package
            assert(data.packageToSnippet.size > 0);
            //has snippets for package
            assert(data.packageToSnippet.get("cors").length > 0);
            //has keywords in keyword map
            assert(data.keyWordMap.size > 0);
        });
        it('should be able to search for snippets using package name', async function(){
            var data = new DataHandler();
            await data.loadSnippets(SNIPPET_DIR);
            var snippets = await data.getSnippetsFor("cors");
            assert(snippets.length > 0);
        });
        it('should be able to handle empty task', async function(){
            var data = new DataHandler();
            await data.loadSnippets(SNIPPET_DIR);
            var snippets = await data.getSnippetsFor("");
            assert(snippets.length == 0);
        });
        it('should be able to search for task and return no results', async function(){
            var data = new DataHandler();
            await data.loadSnippets(SNIPPET_DIR);
            var snippets = await data.getSnippetsFor("do thing");
            assert(snippets.length == 0);
        });
        it('should be able to search for task', async function(){
            var data = new DataHandler();
            await data.loadSnippets(SNIPPET_DIR);
            var snippets = await data.getSnippetsFor("file filename using paths"); //we dont have nlp atm so we have to use a specific example
            assert(snippets.length > 0);
        });
    });
});