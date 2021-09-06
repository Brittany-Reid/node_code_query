require("mocha");
const assert = require("assert");
const delay = require("delay");
const configInst = require("../src/config");
configInst.configPath = "testConfig.json";
const { HandledInputPrompt } = require("ink-scroll-prompts");
const PromptHandler = require("../src/ui/prompt/prompt-handler");
const {render} = require("../src/patch/ink-testing-library-patch");

const ESC = "\u001B";

describe("PromptHandler", function(){

    describe("unit tests", function(){
        it("should be able to accept input from an ink component", async function(){
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;

            var input = await new Promise((resolve, reject) => {
                var a = async () => {
                    const callback = (input) => {
                        resolve(input);
                    }
                    promptHandler.run().then(callback);
                    const {stdin, unmount} = promptHandler.app;
                    await delay(100);
                    stdin.write("a");
                    await delay(100);
                    stdin.write("\r");
                    await delay(100);
                    unmount();
                }
                a();
            });
            assert.strictEqual(input, "a");
        }); 

        it("should be able to exit on esc", async function(){
            var promptHandler = new PromptHandler(HandledInputPrompt);
            promptHandler.render = render;

            promptHandler.run().then(e=>{
                assert(false);
            }).catch(e => {
                assert(true);
            });
            const {stdin, unmount} = promptHandler.app;
            await delay(100);
            stdin.write(ESC);
            await delay(300);
        });
    })
})