require("mocha");
const assert = require("assert");
const delay = require("delay");
const configInst = require("../src/config");
configInst.configPath = "testConfig.json";
const {render} = require("../src/patch/ink-testing-library-patch");
const React = require("react");
const { SelectMenu } = require("../src/ui/components/prompts/select/select-menu");

const e = React.createElement;

const ARROW_UP = '\u001B[A';
const ESC = "\u001B";
const ARROW_DOWN = '\u001B[B';
const ARROW_LEFT = '\u001B[D';
const ARROW_RIGHT = '\u001B[C';

describe("SelectMenu", function(){
    describe("unit tests", function(){
        it("should work with default options", function(){
            var element = e(SelectMenu, {});
            var app = render(element);
            app.unmount();
            const expected = "";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should handle unrecognized input", async function(){
            var element = e(SelectMenu, {});
            var app = render(element);
            await delay(100);
            app.stdin.write("a");
            await delay(100);
            app.unmount();
            const expected = "";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should display items", function(){
            var element = e(SelectMenu, {items: ["A"]});
            var app = render(element);
            app.unmount();
            const expected = "\x1B[36m(*) A\x1B[39m";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should be able to select item", async function(){
            var app;
            var selected = await new Promise(async (resolve)=>{
                var element = e(SelectMenu, {items: ["A"], onSelect: (selected) => {
                    resolve(selected);
                }});
                app = render(element);
                await delay(100);
                app.stdin.write("\r");
                await delay(100);
            });
            app.unmount();
            assert.strictEqual(selected, "A");
        });
        it("should handle no select function", async function(){
            var element = e(SelectMenu, {items:["A"]});
            var app = render(element);
            await delay(100);
            app.stdin.write("\r");
            await delay(100);
            app.unmount();
            const expected = "\x1B[36m(*) A\x1B[39m";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should be able to cancel", async function(){
            var app;
            var selected = await new Promise(async (resolve)=>{
                var element = e(SelectMenu, {items: ["A"], onCancel: (selected) => {
                    resolve(selected);
                }});
                app = render(element);
                await delay(100);
                app.stdin.write(ESC);
                await delay(100);
            });
            app.unmount();
            assert.strictEqual(selected, "A");
        });
        it("should handle no cancel function", async function(){
            var element = e(SelectMenu, {items:["A"]});
            var app = render(element);
            await delay(100);
            app.stdin.write(ESC);
            await delay(100);
            app.unmount();
            const expected = "\x1B[36m\x1B[2m(*) A\x1B[22m\x1B[39m";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should be able to select next item", async function(){
            var app;
            var element = e(SelectMenu, {items: ["A", "B"]});
            app = render(element);
            await delay(100);
            app.stdin.write(ARROW_RIGHT);
            await delay(100);
            app.unmount();
            const expected = "( ) A  \x1B[36m(*) B\x1B[39m";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should be able to circle back to first element", async function(){
            var app;
            var element = e(SelectMenu, {items: ["A", "B"]});
            app = render(element);
            await delay(100);
            app.stdin.write(ARROW_RIGHT);
            await delay(100);
            app.stdin.write(ARROW_RIGHT);
            await delay(100);
            app.unmount();
            const expected = "\x1B[36m(*) A\x1B[39m  ( ) B";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should be able to select previous", async function(){
            var app;
            var element = e(SelectMenu, {items: ["A", "B"]});
            app = render(element);
            await delay(100);
            app.stdin.write(ARROW_RIGHT);
            await delay(100);
            app.stdin.write(ARROW_LEFT);
            await delay(100);
            app.unmount();
            const expected = "\x1B[36m(*) A\x1B[39m  ( ) B";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("previous should cycle", async function(){
            var app;
            var element = e(SelectMenu, {items: ["A", "B"]});
            app = render(element);
            await delay(100);
            app.stdin.write(ARROW_LEFT);
            await delay(100);
            app.unmount();
            const expected = "( ) A  \x1B[36m(*) B\x1B[39m";
            assert.strictEqual(app.lastFrame(), expected);
        });
    });
});