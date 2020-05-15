require("mocha");
var assert = require('assert');
const repl = require("../ncq/repl");
const PromptReadable = require("../ncq/ui/prompt-readable");
const sinon = require("sinon");

var output = [];
var input = [];
describe('repl', function() {

    /**
     * Code to run before every test.
     */
    before(()=> {
        //stub console log to push to an array
        sinon.stub(console, 'log').callsFake(function(string){
            output.push(string);
        });
    });

    describe('repl functions', function(){
        it('version', function(){
            repl.state.version();
            assert.equal(output[0], "Node Query Library (NQL) version 1.0.0");
        });
        it('help', function(){
            repl.state.help();
            //should print some help output
            assert(output != []);
        });
        it('install and uninstall', function(){
            //install a package we wont ever use
            repl.state.install("one-liner-joke");
            //should print some help output
            const joke = require("one-liner-joke");
            var j = joke.getRandomJoke();
            repl.state.uninstall("one-liner-joke");
            assert(j);
        }).timeout(100000000); //this may take a while
    });

    after(() => {
        console.log.restore();
        //console.log(output);
    });

});
