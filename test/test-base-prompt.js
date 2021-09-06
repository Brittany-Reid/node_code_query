require("mocha");
const assert = require("assert");
const {render} = require("../src/patch/ink-testing-library-patch");
const React = require("react");
const chalk = require("chalk");
const BasePrompt = require("../src/ui/components/prompts/input/base-prompt");
const delay = require("delay");

const e = React.createElement;

describe("BasePrompt", function(){
    describe("unit tests", function(){
        it("should resize", async function(){
            var element = e(BasePrompt, {prefix: "", footer:false, initialInput: "a a a a a"});
            var app = render(element);
            app.stdout.columns = 10;
            await delay(100);
            app.unmount();
            var expected = "> a a a a\na" + chalk.inverse(" ");
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should allow header", async function(){
            var element = e(BasePrompt, {prefix: "", footer:false, initialInput: "1\n2\n3\n4\n5\n", header: "h"});
            var app = render(element);
            app.stdout.rows = 6;
            app.stdout.columns = 5;
            await delay(100);
            app.unmount();
            var lines = app.lastFrame().split("\n");
            //has header
            assert.strictEqual(lines[0], "h");
            //maxheight of input should be 3, total 4
            assert.strictEqual(lines.length, 4);
        });
        it("should handle footer", async function(){
            var element = e(BasePrompt, {prefix: "", initialInput: "a"});
            var app = render(element);
            await delay(100);
            app.unmount();
            var expected = "> a" + chalk.inverse(" ") + "\n";
            for(var f = 1; f<11; f++){
                var command = "     ";
                if(f === 5) command = "Clear ";
                if(f === 10) command = "Cancel ";
                expected += chalk.bold("F" + f) + chalk.bgCyan.black(command);
            }
            expected += chalk.bgCyan("                          ");
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should show suggest in footer", async function(){
            var element = e(BasePrompt, {suggestions: ["hi"], prefix: "", initialInput: "a"});
            var app = render(element);
            await delay(100);
            app.unmount();
            var expected = "> a" + chalk.inverse(" ") + "\n";
            for(var f = 1; f<11; f++){
                var command = "     ";
                if(f === 1) command = "Suggest ";
                if(f === 5) command = "Clear ";
                if(f === 10) command = "Cancel ";
                expected += chalk.bold("F" + f) + chalk.bgCyan.black(command);
            }
            expected += chalk.bgCyan("                       ");
            assert.strictEqual(app.lastFrame(), expected);
        });
    });
});