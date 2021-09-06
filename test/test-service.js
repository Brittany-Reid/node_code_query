require("mocha");
var assert = require("assert");
const {render} = require("../src/patch/ink-testing-library-patch");
const Service = require("../src/core/service");
const state = require("../src/core/state");
const sinon = require("sinon");
const stripAnsi = require("strip-ansi");
const delay = require("delay");

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

describe("Service", function () {
    var out = [];
    var writeStub;

    before(()=>{
        state.render = render;
        state.silent = true;
        writeStub = sinon.stub(state, "write");
        writeStub.callsFake((message)=>{
            out.push(message);
        });
        
    });
    describe("functions", function () {
        it("should initialize", async function () {
            var promise = Service.initialize({recordLimit:100});
            var app = state.app;
            await promise;
            
            //the progressbar rendered to 100%
            assert(app.stdout.lastFrame().includes("100%"));
            //packages loaded in
            assert(state.dataHandler.packages.length > 0);
        }).timeout(0);
    });
    describe("package search", function(){
        before(async function(){
            this.timeout(0);
            await Service.initialize({recordLimit:100});
        });
        it("package search fails on no results", async function () {
            var query = "no results query a19823bfb";
            var result = await Service.packageSearch(query);
            assert.strictEqual(stripAnsi(out[0]), "No results for query '" + query + "'");
            assert.strictEqual(typeof result, "undefined");
        });
        it("can cancel package search", async function () {
            var result = Service.packageSearch("utility");
            await delay(100);
            await press(ESC);
            var info = await result;
            assert.strictEqual(typeof info, "undefined");
        });
        it("can select a package", async function () {
            var result = Service.packageSearch("utility");
            await delay(100);
            await press("\r"); //select first
            await delay(100);
            await press(ESC); //escape install
            var info = await result;
            assert.strictEqual(info.packageName, "101");
            assert.strictEqual(info.toInstall, false);
        }).timeout(0);
        it("can select to install package", async function () {
            var result = Service.packageSearch("utility");
            await delay(100);
            await press("\r"); //select first
            await delay(100);
            await press("\r"); //install
            var info = await result;
            assert.strictEqual(info.packageName, "101");
            assert.strictEqual(info.toInstall, true);
        }).timeout(0);
    });
    describe("snippet search", function(){
        before(async function(){
            this.timeout(0);
            await Service.initialize({recordLimit:100});
        });
        it("snippet search retrieves results for a package", async function () {
            var query = "101";
            var result = Service.packageSnippets([query]);
            assert(result.length > 1);
        });
        it("snippet search retrieves results for multiple packages", async function () {
            var packages = ["101", "0ui"]
            var result = Service.packageSnippets(packages);
            assert(result.length > 1);
        });
        it("snippet search returns empty on unknown package", async function () {
            var query = "package_"; //illegal npm package name
            var result = Service.packageSnippets([query]);
            assert.strictEqual(result.length, 0);
        });
    });

    after(()=>{
        writeStub.restore();
    });
});