const configInst = require("../src/config");
configInst.configPath = "testConfig.json";
require("mocha");
const assert = require("assert");
const state = require("../src/core/state");
const REPL = require("../src/repl/repl");
const sinon = require("sinon");
const fs = require("fs");
const path = require("path");
const { getBaseDirectory } = require("../src/common");
const Project = require("../src/core/project");
const rimraf = require("rimraf");
const delay = require("delay");
const {render} = require("../src/patch/ink-testing-library-patch");
const chalk = require("chalk");
const child_process = require("child_process");

async function send(command, stdin = state.app.stdin){
    await delay(100);
    stdin.write(command);
    await delay(100);
    stdin.write("\r");
    await delay(100);
}

async function press(button, app = state.app){
    app.stdin.write(button);
    await delay(100);
}

const ESC = "\u001B";

describe("REPL", function(){
    var writeStub;
    var output = [];
    before(()=>{
        state.silent = true;
        state.replDir = "testRepls";
        state.render = render;
        writeStub = sinon.stub(state, "write");
        writeStub.callsFake((message)=>{
            output.push(message);
        })
    });

    beforeEach(()=>{
        output = [];
    })

    describe("commands", function(){
        it("should handle no given packages", function(){
            var repl = new REPL();
            repl.install("");
            assert.strictEqual(output[0], "Error: No package name given.\nUsage: .install <pkg>");
            assert.strictEqual(repl.installedPackages.length, 0);
        });
        it("should install package", function(){
            var repl = new REPL();
            Project.createProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            repl.install("lodash");
            var packageJsonPath = path.join(getBaseDirectory(), state.replDir, "test1", "package.json");
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, {encoding: "utf-8"}));
            var dependencies = packageJson.dependencies;
            assert.ok(dependencies["lodash"])
            process.chdir(path.join(getBaseDirectory()));
            assert.strictEqual(repl.installedPackages[0], "lodash")
        }).timeout(0);
        it("should install multiple packages", function(){
            var repl = new REPL();
            Project.createProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            repl.install("lodash express");
            var packageJsonPath = path.join(getBaseDirectory(), state.replDir, "test1", "package.json");
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, {encoding: "utf-8"}));
            var dependencies = packageJson.dependencies;
            assert.ok(dependencies["lodash"])
            assert.ok(dependencies["express"])
            process.chdir(path.join(getBaseDirectory()));
            assert.strictEqual(repl.installedPackages[0], "lodash")
            assert.strictEqual(repl.installedPackages[1], "express")
        }).timeout(0);
        it("should handle try to install already installed", function(){
            var repl = new REPL();
            Project.createProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            repl.install("lodash");
            repl.install("lodash");
            var packageJsonPath = path.join(getBaseDirectory(), state.replDir, "test1", "package.json");
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, {encoding: "utf-8"}));
            var dependencies = packageJson.dependencies;
            assert.ok(dependencies["lodash"]);
            process.chdir(path.join(getBaseDirectory()));
            assert.strictEqual(repl.installedPackages.length, 1)
            assert.strictEqual(repl.installedPackages[0], "lodash")
        }).timeout(0);
        it("should handle non existant package", function(){
            var repl = new REPL();
            Project.createProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            repl.install("nonexistantpackageNCQ");
            process.chdir(path.join(getBaseDirectory()));
            assert.strictEqual(repl.installedPackages.length, 0);
        }).timeout(0);
        it("should handle multiple package where errors", function(){
            var repl = new REPL();
            Project.createProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            repl.install("lodash NCQerror");
            var packageJsonPath = path.join(getBaseDirectory(), state.replDir, "test1", "package.json");
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, {encoding: "utf-8"}));
            var dependencies = packageJson.dependencies;
            assert.strictEqual(typeof dependencies, "undefined");
            process.chdir(path.join(getBaseDirectory()));
            assert.strictEqual(repl.installedPackages.length, 0)
        }).timeout(0);
        it("should uninstall package", function(){
            var repl = new REPL();
            Project.createProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            repl.install("lodash");
            assert.strictEqual(repl.installedPackages[0], "lodash")
            repl.uninstall("lodash");
            process.chdir(path.join(getBaseDirectory()));
            assert.strictEqual(repl.installedPackages.length, 0)
        }).timeout(0);
        it("should handle no given packages for uninstall", function(){
            var repl = new REPL();
            repl.uninstall("");
            assert.strictEqual(output[0], "Error: No package name given.\nUsage: .uninstall <pkg>");
            assert.strictEqual(repl.installedPackages.length, 0);
        });
        it("should handle uninstall error", function(){
            var repl = new REPL();
            var stub = sinon.stub(child_process, "execSync")
            stub.callsFake((command, options)=>{
                throw new Error("should handle uninstall thowing error");
            });
            repl.uninstall("NCQerror");
            stub.restore();
            assert.strictEqual(output[0], "Uninstall failed with code undefined");
        });
        it("should get dependencies", function(){
            var repl = new REPL();
            Project.createProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            repl.install("lodash");
            var dependencies = repl.getDependencies();
            assert.ok(dependencies["lodash"]);
            process.chdir(path.join(getBaseDirectory()));
        }).timeout(0);
    });
    describe("input handling", function(){
        it("should be able to run a repl", async function(){
            Project.createProject("test1");
            process.chdir(path.join(state.replDir, "test1"));
            var repl = new REPL();
            repl.run();
            await delay(100);
            assert.notStrictEqual(typeof state.app, "undefined"); //there is a prompt
            await press(ESC); //exit
            assert.strictEqual(state.app.lastFrame(), "\x1B[2mNCQ \x1B[1m[] \x1B[22m\x1B[2m> \x1B[22m\n") //prompt was canceled
        }).timeout(10000);
        it("should be able to load a previously installed package", async function(){
            Project.createProject("test1");
            process.chdir(path.join(state.replDir, "test1"));
            var repl = new REPL();
            repl.run();
            await delay(100);
            await send(".install chalk");
            assert.strictEqual(repl.installedPackages[0], "chalk")
            await press(ESC); //exit

            //reload
            repl = new REPL();
            repl.run();
            await delay(100);
            assert.strictEqual(repl.installedPackages[0], "chalk")
            await press(ESC); //exit

        }).timeout(10000);
        it("should be able to exit using .exit command", async function(){
            Project.createProject("test1");
            process.chdir(path.join(state.replDir, "test1"));
            var repl = new REPL();
            repl.run();
            await delay(100);
            await send(".exit") //exit
            const expected = chalk.cyan("NCQ ") + chalk.bold("[] ") + "> .exit\n"; //will not be dim
            assert.strictEqual(state.app.lastFrame(), expected);
        }).timeout(10000);
        it("should be able to uninstall", async function(){
            Project.createProject("test1");
            process.chdir(path.join(state.replDir, "test1"));
            var repl = new REPL();
            repl.run();
            await delay(100);
            await send(".install chalk");
            assert.strictEqual(repl.installedPackages[0], "chalk")
            await send(".uninstall chalk");
            assert.notStrictEqual(repl.installedPackages[0], "chalk")
            await press(ESC); //exit

        }).timeout(10000);
        it("should ask to save if edited", async function(){
            Project.createProject("test1");
            process.chdir(path.join(state.replDir, "test1"));
            var repl = new REPL();
            repl.run();
            await delay(100);
            await send("var a = 0;")
            await send(".exit") //exit

            //ask if save
            const expected = "Do you want to save your REPL before exit?\n" 
            + chalk.cyan("(*) Save and Exit") + "  ( ) Exit  ( ) Cancel";
            assert.strictEqual(state.app.lastFrame(), expected);

            await press("\r") //confirm
            assert.strictEqual(output[1], "Session saved to: index.js")
        }).timeout(10000);
    });

    afterEach(()=>{
        if(process.cwd() !== getBaseDirectory()){
            process.chdir(getBaseDirectory());
        }
        if(fs.existsSync("testRepls")) rimraf.sync("testRepls");
    })

    after(()=>{
        writeStub.restore();
        state.silent = false;
        state.render = undefined;
    });
});