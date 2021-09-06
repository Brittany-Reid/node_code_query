require("mocha");
const assert = require("assert");
const delay = require("delay");
const configInst = require("../src/config");
configInst.configPath = "testConfig.json";
const {render} = require("../src/patch/ink-testing-library-patch");
const PackageSearch = require("../src/ui/prompt/package-search");
const state = require("../src/core/state");
const stripAnsi = require("strip-ansi");

const ESC = "\u001B";

async function send(command, stdin = state.app.stdin){
    await delay(100);
    stdin.write(command);
    await delay(100);
    stdin.write("\r");
    await delay(100);
}

async function press(button){
    state.app.stdin.write(button);
    await delay(100);
}

describe("PackageSearch", function(){
    var items = [
        {label: "p1", id: 1},
        {label: "p2", id: 2},
        {label: "p3", id: 3}
    ];

    before(()=>{
        state.render = render;
    });

    describe("unit tests", function(){
        it("items are listed", async function(){
            var prompt = new PackageSearch();
            prompt.run(items);
            await delay(100);
            var lines = state.app.lastFrame().split("\n");
            state.app.unmount();
            assert.strictEqual(stripAnsi(lines[0]).trim(), "(*) 1. p1 stars: 0");
            assert.strictEqual(stripAnsi(lines[2]).trim(), "( ) 2. p2 stars: 0");
            assert.strictEqual(stripAnsi(lines[4]).trim(), "( ) 3. p3 stars: 0");
        });
        it("can select an item", async function(){
            var prompt = new PackageSearch();
            var result = await new Promise((resolve, reject)=> {
                var a = async () =>{
                    prompt.run(items).then((selected)=>{
                        resolve(selected);
                    });
                    await delay(100);
                    await send("\r");
                    await delay(100);
                    resolve("");
                };
                a();
            });
            assert.strictEqual(result, "p1");

            var lines = state.app.lastFrame().split("\n");
            assert.strictEqual(lines.length, 2);
            assert.strictEqual(stripAnsi(lines[0]).trim(), "(*) 1. p1 stars: 0");  
        });
        it("can cancel", async function(){
            var prompt = new PackageSearch();
            var result = await new Promise((resolve)=>{
                var a = async () =>{
                    prompt.run(items).catch(e => {
                        resolve(true);
                    });
                    await delay(100);
                    await press(ESC);
                    await delay(100);
                    resolve(false);
                };
                a();
            });
            assert.strictEqual(result, true);
        });
        it("can resize", async function(){
            var prompt = new PackageSearch();
            prompt.run(items);
            await delay(100);
            state.app.stdout.columns = 20;
            await delay(100);
            var lines = state.app.lastFrame().split("\n");
            state.app.unmount();
            assert.strictEqual(stripAnsi(lines[0]).length, 20);
        });
    });
});