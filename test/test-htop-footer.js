require("mocha");
const assert = require("assert");
const {render} = require("../src/patch/ink-testing-library-patch");
const React = require("react");
const HtopFooter = require("../src/ui/components/prompts/input/htop-footer");
const chalk = require("chalk");

const e = React.createElement;

describe("HtopFooter", function(){
    describe("unit tests", function(){
        it("should work with default options", function(){
            var element = e(HtopFooter, {});
            var app = render(element);
            app.unmount();
            var expected = "";
            for(var f = 1; f<13; f++){
                expected += chalk.bold("F" + f) + chalk.bgCyan.black("     ");
            }
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should be able to provide a function key label", function(){
            var element = e(HtopFooter, {keys: {f1: "Label"}});
            var app = render(element);
            app.unmount();
            var expected = "";
            for(var f = 1; f<13; f++){
                var command  = "     ";
                if(f === 1) command = "Label ";
                expected += chalk.bold("F" + f) + chalk.bgCyan.black(command);
            }
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should hide suggest", function(){
            var element = e(HtopFooter, {keys: {f1: "Suggest"}});
            var app = render(element);
            app.unmount();
            var expected = "";
            for(var f = 1; f<13; f++){
                var command  = "     ";
                expected += chalk.bold("F" + f) + chalk.bgCyan.black(command);
            }
            assert.strictEqual(app.lastFrame(), expected);
        });
    });
});