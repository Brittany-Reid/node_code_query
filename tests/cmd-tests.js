require("mocha");
var assert = require('assert');
const Cmd = require("../ncq/cmd");
const PromptHandler = require("../ncq/ui/prompt-handler");
const cprocess = require("child_process");
const sinon = require("sinon");
const {Input} = require("enquirer");

var output = [];
var input = [];
describe('Cmd', function() {

    /**
     * Code to run before every test.
     */
    before(()=> {
        //stub console log to push to an array
        sinon.stub(console, 'log').callsFake(function(string){
            output.push(string);
        });

        //stub the cmd accept input to take from an array.
        sinon.stub(Input.prototype, "run").callsFake(async function (){
            var r = input[0];
            input = input.slice(1, input.length);
            return await r;
        });

        //stub process exit
        sinon.stub(process, 'exit');
    });

    describe('functions', function(){
        it('should run exit', function(){
            var myCMD = new Cmd(new PromptHandler(Input));
            input = [];
            input.push("exit\n");
            myCMD.run();
            assert.ok("done");
        });
        it('should run help then exit', function(){
            var myCMD = new Cmd(new PromptHandler(Input));
            input = [];
            output = [];
            input.push("help\n");
            input.push("exit\n");
            myCMD.run();

            //help should print something
            assert(output != []);
        });
        it('should run exit help then exit', function(){
            var myCMD = new Cmd(new PromptHandler(Input, {history:{}}));
            input = [];
            output = [];
            input.push("help exit\n");
            input.push("exit\n");
            myCMD.run();

            //help should print something
            assert(output != []);
        });
        it('should run help help then exit', function(){
            var myCMD = new Cmd(new PromptHandler(Input));
            input = [];
            output = [];
            input.push("help help\n");
            input.push("exit\n");
            myCMD.run();

            //help should print something
            assert(output != []);
        });
        it('should run help? then exit', function(){
            var myCMD = new Cmd(new PromptHandler(Input));
            input = [];
            output = [];
            input.push("help?\n");
            input.push("exit\n");
            myCMD.run();

            //help should print something
            assert(output != []);
        });
        it('should handle unknown commands', function(){
            var myCMD = new Cmd(new PromptHandler(Input));
            input = [];
            output = [];
            input.push("abcdefg\n");
            input.push("exit\n");
            myCMD.run();

            //should print something
            assert(output != []);
        });
        it('should do previous command on empty', function(){
            var myCMD = new Cmd(new PromptHandler(Input));
            input = [];
            output = [];
            input.push("help exit\n");
            input.push("\n");
            input.push("exit\n");
            myCMD.run();

            //should repeat previous command
            assert(output[0] == output[1]);
        });
    });
    describe('inheritance', function() {
        it('should support inheritance', function() {
            class Custom extends Cmd{};
            assert(Custom != null);

            var myCMD = new Custom();
            assert(myCMD != null);
        });
        it('should recognize functions when extended', function() {
            class Custom extends Cmd{
                do_test(inp){
                    console.log("testing");
                }

                async acceptInput(){
                    var r = input[0];
                    input = input.slice(1, input.length);
                    return await r;
                }
            };
            var myCMD = new Custom();
            input = [];
            output = [];
            input.push("test");
            input.push("help");
            input.push("exit");
            myCMD.run();

            assert.notStrictEqual(output[0], "testing");
        });
    });

    /**
     * Restore all functions.
     */
    after(()=> {
        console.log.restore();
        Input.prototype.run.restore();
        process.exit.restore();
    });
});