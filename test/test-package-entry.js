require("mocha");
const assert = require("assert");
const {render} = require("../src/patch/ink-testing-library-patch");
const React = require("react");
const chalk = require("chalk");
const stripAnsi = require('strip-ansi');
const delay = require("delay");
const ink = require("@gnd/ink");
const PackageEntry = require("../src/ui/components/package-menu/package-entry");

const e = React.createElement;

describe("PackageEntry", function(){
    describe("unit tests", function(){
        it("should work with default options", async function(){
            var element = e(PackageEntry, {});
            var app = render(element);
            await delay(100);
            app.unmount();
            var lines = app.lastFrame().split("\n");
            assert.strictEqual(stripAnsi(lines[0]).trim(), "( ) 1.  stars: 0");
            assert.strictEqual(lines[1], chalk.grey("Keywords: "));
        });
        it("should display color if selected", async function(){
            var element = e(PackageEntry, {keywords: ["1"], isSelected: true});
            var app = render(element);
            await delay(100);
            app.unmount();
            var lines = app.lastFrame().split("\n");
            assert.ok(lines[0].includes("\x1B[46m"));
            assert.strictEqual(stripAnsi(lines[0]).trim(), "(*) 1.  stars: 0");
            assert.strictEqual(lines[1], chalk.cyan("Keywords: 1"));
        });
        it("should display info", async function(){
            var element = e(PackageEntry, {
                label: "p1",
                description: "this is p1",
                keywords: ["package", "entry"],
                stars: 100,
            });
            var app = render(element);
            await delay(100);
            app.unmount();
            var lines = app.lastFrame().split("\n");
            assert.strictEqual(stripAnsi(lines[0]).trim(), "( ) 1. p1 stars: 100");
            assert.strictEqual(lines[1], "this is p1");
            assert.strictEqual(lines[2], chalk.grey("Keywords: package, entry"));
        });
        it("should limit description size", async function(){
            var element = e(ink.Box, {width:10}, 
                e(PackageEntry, {
                    label: "p1",
                    description: "aaaaaaaaaaaaaaaaa",
                    keywords: ["package", "entry"],
                    stars: 100,
                })
            );
            var app = render(element);
            await delay(100);
            app.unmount();
            var lines = app.lastFrame().split("\n");
            assert.strictEqual(lines[1].length, 10)
            assert.strictEqual(stripAnsi(lines[2]).length, 10)
            assert.strictEqual(lines.length, 3)
        });
    });
});