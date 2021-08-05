require("mocha");
const assert = require("assert");
const {render} = require("../src/patch/ink-testing-library-patch");
const React = require("react");
const chalk = require("chalk");
const delay = require("delay");
const { ReplPrompt } = require("../src/ui/components/prompts/input/repl-prompt");
const Snippet = require("../src/core/snippet");
const state = require("../src/core/state");

const e = React.createElement;


const ESC = "\u001B";
const ARROW_RIGHT = '\u001B[C';
const F5 = '\u001B[15~';
const F2 = "\u001B[12~";
const F3 = "\u001B[13~";
const DELETE = '\u007F';

async function press(button, app = state.app){
    app.stdin.write(button);
    await delay(100);
}

describe("ReplPrompt", function(){
    var snippets = [new Snippet("a", 0, 0, {name: "p1"}), new Snippet("b", 0, 0, {name: "p2"})];

    describe("unit tests", function(){
        it("should display first given snippet", async function(){
            var element = e(ReplPrompt, {prefix: "", snippets: snippets});
            var app = render(element);
            await delay(100);
            app.unmount();
            var header = chalk.cyan("package: " + snippets[0].package + ", 1/2");

            var lines = app.lastFrame().split("\n");
            //has header
            assert.strictEqual(lines[0], header);
            //displaying snippet
            assert.strictEqual(lines[1], "> a\x1B[7m \x1B[27m");
            //footer displays next and prev
            assert.strictEqual((lines[2].includes("Next") && lines[2].includes("Prev")), true);
        });
        it("should hide header and footer controls if no snippets", async function(){
            var element = e(ReplPrompt, {prefix: ""});
            var app = render(element);
            await delay(100);
            app.unmount();

            var lines = app.lastFrame().split("\n");
            //no header and no snippet
            assert.strictEqual(lines[0], "> \x1B[7m \x1B[27m");
            //footer does not display next and prev
            assert.strictEqual((!lines[1].includes("Next") && !lines[1].includes("Prev")), true);
        });
    });
    describe("input handling", function(){
        it("should clear snippet on clear", async function(){
            var element = e(ReplPrompt, {prefix: "", snippets: snippets});
            var app = render(element);
            await delay(100);
            await press(F5, app);
            app.unmount();
            var lines = app.lastFrame().split("\n");
            //no header and no snippet
            assert.strictEqual(lines[0], "> \x1B[7m \x1B[27m");
            //footer does not display next and prev
            assert.strictEqual((!lines[1].includes("Next") && !lines[1].includes("Prev")), true);
        });
        it("should cycle snippets", async function(){
            var element = e(ReplPrompt, {prefix: "", snippets: snippets});
            var app = render(element);
            await delay(100);
            await press(F3, app);
            var frame1 = app.lastFrame();
            await press(F3, app);
            app.unmount();

            var lines = frame1.split("\n");
            //has correct header
            assert.strictEqual(lines[0], chalk.cyan("package: " + snippets[1].package + ", 2/2"));
            //snippet 2 is displayed
            assert.strictEqual(lines[1], "> b\x1B[7m \x1B[27m");

            lines = app.lastFrame().split("\n");
            //cycled around
            assert.strictEqual(lines[0], chalk.cyan("package: " + snippets[0].package + ", 1/2"));
            //snippet 1 is displayed
            assert.strictEqual(lines[1], "> a\x1B[7m \x1B[27m");

        });
        it("should do nothing on cycle with no snippets", async function(){
            var element = e(ReplPrompt, {prefix: "", footer:false});
            var app = render(element);
            await delay(100);
            await press(F3, app);
            app.unmount();
            assert.strictEqual(app.lastFrame(), "> \x1B[7m \x1B[27m\n");
        });
        it("should be able to move to previous", async function(){
            var element = e(ReplPrompt, {prefix: "", snippets: snippets});
            var app = render(element);
            await delay(100);
            await press(F3, app);
            await press(F2, app);

            var lines = app.lastFrame().split("\n");
            //has correct header
            assert.strictEqual(lines[0], chalk.cyan("package: " + snippets[0].package + ", 1/2"));
            //snippet 1 is displayed
            assert.strictEqual(lines[1], "> a\x1B[7m \x1B[27m");

            await press(F2, app);
            app.unmount();

            lines = app.lastFrame().split("\n");
            //has correct header
            assert.strictEqual(lines[0], chalk.cyan("package: " + snippets[1].package + ", 2/2"));
            //snippet 2 is displayed
            assert.strictEqual(lines[1], "> b\x1B[7m \x1B[27m");
        });

        it("should hide header on cancel", async function(){
            var element = e(ReplPrompt, {prefix: "", snippets: snippets});
            var app = render(element);
            await delay(100);
            await press(ESC, app);
            app.unmount();

            var expected = chalk.dim("> ")+ chalk.dim("a") + "\n";
            //has no header
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should call onCancel", async function(){
            var result = await new Promise((resolve, reject) => {
                var a = async () =>{
                    var element = e(ReplPrompt, {prefix: "", snippets: snippets, onCancel: ()=>{
                        resolve(true);
                    }});
                    var app = render(element);
                    await delay(100);
                    await press(ESC, app);
                    app.unmount();
                    resolve(false);
                };
                a();
            });
            //called onCancel
            assert.strictEqual(result, true);
        });
        it("should do nothing on cycle after clear", async function(){
            var element = e(ReplPrompt, {prefix: "", snippets: snippets});
            var app = render(element);
            await delay(100);
            await press(F5, app);
            await press(F3, app);
            app.unmount();
            var lines = app.lastFrame().split("\n");
            //no header and no snippet
            assert.strictEqual(lines[0], "> \x1B[7m \x1B[27m");
            //footer does not display next and prev
            assert.strictEqual((!lines[1].includes("Next") && !lines[1].includes("Prev")), true);
        });
    });
});