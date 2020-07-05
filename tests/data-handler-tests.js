require("mocha");
var assert = require('assert');
const path = require("path");
const DataHandler = require("../ncq/data-handler");
const {getBaseDirectory} = require("../ncq/utils");

const BASE = getBaseDirectory();
const SNIPPET_DIR = path.join(BASE, "data/snippets.json");
const TASK_PATH = path.join(BASE, "data/id,tasks.txt");

describe('DataHandler', function() {
    describe('functions', function(){
        it('should return map of tasks to packages', async function(){
            var data = new DataHandler();
            var tasks = data.loadTasks(TASK_PATH);
            assert(tasks.size > 0);
        });
        it('should make keyword array from string', async function(){
            var data = new DataHandler();
            var keywords  = await data.getKeywords("do a task");
            assert(keywords[0] == "task");
        });
        it('should load in some snippets', function(){
            var data = new DataHandler();
            data.MAX = 500;
            data.loadSnippets(SNIPPET_DIR);
            //has snippets
            assert(data.idTosnippets.size > 0);
            //has a package
            assert(data.packageToSnippet.size > 0);
            // //has snippets for package
            // assert(data.packageToSnippet.get("cors").length > 0);
            //has keywords in keyword map
            assert(data.keyWordMap.size > 0);
        }).timeout(60000); //this may take a while;
        // it('should be able to search for snippets using package name', function(){
        //     var data = new DataHandler();
        //     data.MAX = 1000;
        //     data.loadSnippets(SNIPPET_DIR);
        //     var snippets = data.getSnippetsFor("cors");
        //     assert(snippets.length > 0);
        // });
        it('should be able to handle an empty task', function(){
            var data = new DataHandler();
            data.MAX = 500;
            data.loadSnippets(SNIPPET_DIR);
            var snippets = data.getSnippetsFor("");
            assert(snippets.length == 0);
        }).timeout(60000);
        it('should be able to search for task and return no results', function(){
            var data = new DataHandler();
            data.MAX = 1000;
            data.loadSnippets(SNIPPET_DIR);
            var snippets = data.getSnippetsFor("nonsense task 123456 hello 654321 moo");
            assert(snippets.length == 0);
        }).timeout(60000);
        it('should be able to search for task', function(){
            var data = new DataHandler();
            data.MAX = 1000;
            data.loadSnippets(SNIPPET_DIR);
            var snippets = data.getSnippetsFor("file filename using paths"); //we dont have nlp atm so we have to use a specific example
            assert(snippets.length > 0);
        }).timeout(60000);
        it('results for file and files should be the same', function(){
            //test the stemming
            var data = new DataHandler();
            data.MAX = 1000;
            data.loadSnippets(SNIPPET_DIR);
            var snippets = data.getSnippetsFor("file");
            var snippets2 = data.getSnippetsFor("files");
            assert(snippets.length == snippets2.length);
        }).timeout(60000);
    });
});