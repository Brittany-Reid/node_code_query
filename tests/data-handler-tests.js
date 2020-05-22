require("mocha");
var assert = require('assert');
const DataHandler = require("../ncq/data-handler");

describe('DataHandler', function() {
    describe('functions', function(){
        it('should return map of tasks to packages', async function(){
            var data = new DataHandler();
            await data.loadTasks("data/tasks.txt");
            assert(data.getTasks().size > 0);
        });
        it('should return list of packages', async function(){
            var data = new DataHandler();
            var packages  = await data.loadPackges("data/snippets");
            assert(packages.length > 0);
        });
    });
});