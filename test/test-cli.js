require("mocha");
const assert = require("assert");
const delay = require("delay");
const sinon = require("sinon");
const configInst = require("../src/config");
configInst.configPath = "testConfig.json";
const { HandledInputPrompt } = require("ink-scroll-prompts");
const PromptHandler = require("../src/ui/prompt/prompt-handler");
const {render} = require("../src/patch/ink-testing-library-patch");
const CLI = require("../src/cli/cli");
const state = require("../src/core/state");

async function send(command, stdin){
    await delay(100);
    stdin.write(command);
    await delay(100);
    stdin.write("\r");
    await delay(100);
}

describe("CLI", function(){
    var output = [];
    var stub;

    before(() => {
        state.silent = true;
        // stub console log to push to an array
        stub = sinon.stub(state, "write")
        stub.callsFake(function (string) {
            output.push(string);
        });
    });

    beforeEach(()=>{
        output = [];
    })

    describe("unit tests", function(){
        it("should do opening", async function(){
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.opening = "Hi!"
            cli.run();
            await send("help", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            await delay(100);
            promptHandler.app.unmount();

            assert.strictEqual(output[0], "Hi!");
        }); 
        it("should run help", async function(){
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.run();
            await send("help", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            await delay(100);
            promptHandler.app.unmount();

            assert.strictEqual(output[1], "help   List available commands with \"help\"");
        }); 
        it("should handle new command with no summary", async function () {
            class CLI2 extends CLI{
                do_something(){

                }
            }

            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI2(promptHandler);
            cli.run();
            await send("help", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            promptHandler.app.unmount();

            assert.strictEqual(output[0], "exit        Exits the application");
            assert.strictEqual(output[1], "help        List available commands with \"help\"");
            assert.strictEqual(output[2], "something   ");
        });
        it("should print help for exit", async function () {
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.run();
            await send("help exit", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            await delay(100);
            promptHandler.app.unmount();

            assert.strictEqual(output[0], "Exits the application. Shorthand: Ctrl-D.");
        });
        it("should print help for help", async function () {
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.run();
            await send("help help", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            promptHandler.app.unmount();

            assert.strictEqual(
                output[0],
                'List available commands with "help" or detailed help with "help <cmd>".'
            );
        });
        it("should handle unknown syntax", async function () {
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.run();
            await send("aaaaa", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            promptHandler.app.unmount();

            assert.strictEqual(output[0], "*** Unknown syntax: aaaaa");
        });
        it("should handle spaces", async function () {
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.run();
            await send(" ", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            promptHandler.app.unmount();

            assert.strictEqual(output[0], "*** Unknown syntax:  ");
        });
        it("should do previous command on enter", async function () {
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.run();
            await send("help", promptHandler.app.stdin);
            await send("", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            promptHandler.app.unmount();

            assert.strictEqual(output[1], output[3]);
        });
        it("should do nothing on first enter", async function () {
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.run();
            await send("", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            promptHandler.app.unmount();

            assert.strictEqual(output.length, 0);
        });
        it("should do previous command on enter even if unknown", async function () {
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.run();
            await send("aaaaa", promptHandler.app.stdin);
            await send("", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            promptHandler.app.unmount();

            assert.strictEqual(output[0], output[1]);
        });
        it("should handle unknown help", async function () {
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;
            var cli = new CLI(promptHandler);
            cli.run();
            await send("help aaaaa", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            promptHandler.app.unmount();

            assert.strictEqual(output[0], "*** No help on aaaaa");
        });
    })

    /**
     * After all tests, restore functions.
     */
    after(() => {
        stub.restore();
        state.silent = false;
    });
})