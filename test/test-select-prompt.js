require("mocha");
const assert = require("assert");
const delay = require("delay");
const configInst = require("../src/config");
configInst.configPath = "testConfig.json";
const {render} = require("../src/patch/ink-testing-library-patch");
const React = require("react");
const SelectPrompt = require("../src/ui/components/prompts/select/select-prompt");

const e = React.createElement;

const ARROW_UP = '\u001B[A';
const ESC = "\u001B";
const ARROW_DOWN = '\u001B[B';
const ARROW_LEFT = '\u001B[D';
const ARROW_RIGHT = '\u001B[C';

describe("SelectMenu", function(){
    describe("unit tests", function(){
        it("should work with default options", function(){
            var element = e(SelectPrompt, {});
            var app = render(element);
            app.unmount();
            const expected = "";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should display a message above options", function(){
            var element = e(SelectPrompt, {message: "Which letter?", items:["A", "B"]});
            var app = render(element);
            app.unmount();
            const expected = "Which letter?\n\x1B[36m(*) A\x1B[39m  ( ) B";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should dim all on cancel", async function(){
            var element = e(SelectPrompt, {message: "Which letter?", items:["A", "B"]});
            var app = render(element);
            await delay(100);
            app.stdin.write(ESC);
            await delay(100);
            app.unmount();
            const expected = "\x1B[2mWhich letter?\x1B[22m\n\x1B[36m\x1B[2m(*) A\x1B[22m\x1B[39m  \x1B[2m( ) B\x1B[22m";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should pass cancel function", async function(){
            var selected = await new Promise((resolve) => {
                var a = async () => {
                    var element = e(SelectPrompt, {message: "Which letter?", items:["A", "B"], onCancel: (selected) => {
                        resolve(selected);
                    }});
                    var app = render(element);
                    await delay(100);
                    app.stdin.write(ESC);
                    await delay(100);
                    app.unmount();
                    const expected = "\x1B[2mWhich letter?\x1B[22m\n\x1B[36m\x1B[2m(*) A\x1B[22m\x1B[39m  \x1B[2m( ) B\x1B[22m";
                    assert.strictEqual(app.lastFrame(), expected);
                };
                a();
            });
            assert.strictEqual(selected, "A");
        });
    });
});