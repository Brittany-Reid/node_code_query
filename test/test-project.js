const configInst = require("../src/config");
configInst.configPath = "testConfig.json";

require("mocha");
const assert = require("assert");
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const sinon = require("sinon");
const Project = require("../src/core/project");
const state = require("../src/core/state");
const { getBaseDirectory } = require("../src/common");

describe("Project", function(){
    before(()=>{
        state.silent = true;
        state.replDir = "testRepls";
    });

    describe("unit tests", function(){
        it("should create project", function(){
            Project.createProject("test1");
            assert.strictEqual(fs.existsSync(path.join(state.replDir, "test1")), true);
        });
        it("should overwrite project if already exists", function(){
            Project.createProject("test1");
            //cause some trouble
            var packageJsonPath = path.join(state.replDir, "test1", "package.json");
            fs.rmSync(packageJsonPath);
            //recreate
            Project.createProject("test1");
            //folder and package json should exist
            assert.strictEqual(fs.existsSync(path.join(state.replDir, "test1")), true);
            assert.strictEqual(fs.existsSync(packageJsonPath), true);
        }).timeout(0);
        it("should error on loading non-existant project", function(){
            var stub = sinon.stub(state, "write");
            var output = [];
            stub.callsFake((message)=>{
                output.push(message);
            });
            Project.loadProject("test1");
            assert.strictEqual(output[0], "Error: Project 'test1' does not exist!")
            stub.restore();
        });
        it("should load project", function(){
            var ran = false;
            var dir = undefined;
            Project.createProject("test1");
            var stub = sinon.stub(child_process, "execSync")
            stub.callsFake((command, options)=>{
                ran = true;
                dir = process.cwd();
                return Buffer.from("");
            });
            Project.loadProject("test1");
            stub.restore();
            assert.ok(ran); //it ran
            assert.strictEqual(path.resolve(dir), path.resolve(path.join(getBaseDirectory(), state.replDir, "test1"))); //it was in the right dir
            assert.strictEqual(path.resolve(process.cwd()), path.resolve(getBaseDirectory())); //it returned to the right dir
        });
        it("should handle a repl error", function(){
            Project.createProject("test1");
            var stub = sinon.stub(child_process, "execSync")
            stub.callsFake((command, options)=>{
                throw new Error("should handle a repl error");
            });
            try{
                Project.loadProject("test1");
                assert.fail();
            } catch(e){
                assert.ok(true);
            }
            stub.restore();
            assert.strictEqual(path.resolve(process.cwd()), path.resolve(getBaseDirectory())); //it returned to the right dir
        });
        it("should do install", function(){
            Project.createProject("test1");
            var stub = sinon.stub(child_process, "execSync")
            stub.callsFake((command, options)=>{
                return Buffer.from("");
            });
            Project.loadProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            stub.restore();
            Project.install(["lodash"]);
            var packageJsonPath = path.join(getBaseDirectory(), state.replDir, "test1", "package.json");
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, {encoding: "utf-8"}));
            var dependencies = packageJson.dependencies;
            assert.ok(dependencies["lodash"])

            process.chdir(getBaseDirectory());
        }).timeout(0);
        it("should handle nonexistant package", function(){
            Project.createProject("test1");
            var stub = sinon.stub(child_process, "execSync")
            stub.callsFake((command, options)=>{
                return Buffer.from("");
            });
            Project.loadProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            stub.restore();
            try{
                Project.install(["nonexistantpackagetestNCQ"]); //cannot contain capital letters
                assert.fail()
            } catch(e){
                assert.ok(true);
            }
            process.chdir(getBaseDirectory());
        }).timeout(0);
        it("should do uninstall", function(){
            Project.createProject("test1");
            var stub = sinon.stub(child_process, "execSync")
            stub.callsFake((command, options)=>{
                return Buffer.from("");
            });
            Project.loadProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            stub.restore();
            Project.install(["lodash"]);
            var packageJsonPath = path.join(getBaseDirectory(), state.replDir, "test1", "package.json");
            var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, {encoding: "utf-8"}));
            var dependencies = packageJson.dependencies;
            assert.ok(dependencies["lodash"])
            Project.uninstall(["lodash"]);
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, {encoding: "utf-8"}));
            dependencies = packageJson.dependencies;
            assert.strictEqual(typeof dependencies, "undefined");

            process.chdir(getBaseDirectory());
        }).timeout(0);
        it("should handle uninstall thowing error", function(){
            Project.createProject("test1");
            process.chdir(path.join(getBaseDirectory(), state.replDir, "test1"));
            var stub = sinon.stub(child_process, "execSync")
            stub.callsFake((command, options)=>{
                throw new Error("should handle uninstall thowing error");
            });
            try{
                Project.uninstall([""])
                assert.fail();
            } catch(e){
                assert.ok(true);
            }
            stub.restore();
            process.chdir(getBaseDirectory());
        }).timeout(0);
    });
    
    afterEach(()=>{
        if(fs.existsSync("testRepls")) rimraf.sync("testRepls");
    });

    after(() =>{
    })
});
