require("mocha");
const assert = require("assert");
const delay = require("delay");
const sinon = require("sinon");
const stripAnsi = require("strip-ansi");

const PromptHandler = require("../src/ui/prompt/prompt-handler");
const {render} = require("../src/patch/ink-testing-library-patch");
const CliPrompt = require("../src/ui/components/prompts/input/cli-prompt");
const NcqCLI = require("../src/cli/ncq-cli");
const fs = require("fs");
const state = require("../src/core/state");
const rimraf = require("rimraf");
const Project = require("../src/core/project");
const path = require("path");
const { getBaseDirectory } = require("../src/common");
const chalk = require("chalk");

const replDir = path.join(getBaseDirectory(), "testRepls");

const ESC = "\u001B";
const ARROW_RIGHT = '\u001B[C';
const ARROW_DOWN = '\u001B[B';
const DELETE = '\u007F';
const cursor = (c) => {return chalk.inverse(c);};

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

describe("NcqCLI", function(){
    var output = [];
    var stubWrite;
    var stubLoadProject;
    var currentProject;

    before(()=>{
        state.render = render;
        state.silent = true;
        state.replDir = "testRepls";
        stubWrite = sinon.stub(state, "write");
        stubWrite.callsFake(function(message) {
            output.push(message);
        });
        stubLoadProject = sinon.stub(Project, "loadProject");
        stubLoadProject.callsFake(function (string) {
            currentProject = string;
            return;
        });
    });

    beforeEach(()=>{
        output = [];
        currentProject = undefined;
    });

    describe("commands", function(){

        it("should run", async function(){
            var promptHandler = new PromptHandler(CliPrompt);
            promptHandler.render = render;            
            var cli = new NcqCLI(promptHandler);
            cli.run();
            await send("exit", promptHandler.app.stdin);
            assert.strictEqual(output[0], "Welcome to the NCQ Command Line Interface. Type help for more information.");
        }); 
        it("should do repl help", async function(){
            var promptHandler = new PromptHandler(CliPrompt);
            promptHandler.render = render;            
            var cli = new NcqCLI(promptHandler);
            cli.run();
            await send("help repl", promptHandler.app.stdin);
            await send("exit", promptHandler.app.stdin);
            assert.strictEqual(output[1], "Command to start a REPL.");
        }); 

    });

    describe("repl", function(){
        var cli;

        beforeEach(()=>{
            if(fs.existsSync("testRepls")) rimraf.sync("testRepls");
            state.lastSession = undefined;
            cli = new NcqCLI(new PromptHandler(CliPrompt));
            cli.defaultProjectName = "ncq_test";
        });

        it("repl with no existing should ask for name then cancel", async function(){
            cli.run();
            await send("repl"); //repl command
            var app = state.app;
            await press(ESC); //escape new or load dialogue
            await press(ESC); //escape app

            var expected = chalk.green("Project name ") + "? ncq_test1" + cursor(" ")+"\n";
            assert.strictEqual(app.frames[0], expected);
            expected = chalk.dim("Project name ? ") + chalk.dim("ncq_test1") + "\n";
            assert.strictEqual(app.lastFrame(), expected);
        }); 
        it("should ask if want to load or new when existing", async function(){
            //make fake project 1
            if(!fs.existsSync(replDir)) fs.mkdirSync(replDir);
            if(!fs.existsSync(path.join(replDir, cli.defaultProjectName +"1"))) fs.mkdirSync(path.join(replDir, cli.defaultProjectName + "1"));


            cli.run();
            await send("repl"); //repl command
            var out1 = state.app.lastFrame();
            var app = state.app;
            await press(ESC); //escape new or load dialogue
            var out2 = app.lastFrame();
            await press(ESC); //escape app

            var lines = out1.split("\n");
            assert.strictEqual(lines[0], "Create new REPL or load existing REPL?");
            assert.strictEqual(stripAnsi(lines[1]), "(*) [ Create New ]");
            assert(stripAnsi(lines[2]).startsWith("( ) ncq_test1"));
            assert.strictEqual(out2, chalk.dim("Create new REPL or load existing REPL?"));
        }); 
        it("should be able to load previous", async function(){
            //make fake project 1
            if(!fs.existsSync(replDir)) fs.mkdirSync(replDir);
            if(!fs.existsSync(path.join(replDir, cli.defaultProjectName +"1"))) fs.mkdirSync(path.join(replDir, cli.defaultProjectName + "1"));
            state.lastSession = {
                lastProject: "test1"
            };
            
            cli.run();
            await send("repl"); //repl command
            await press(ARROW_DOWN);
            await press("\r");

            assert.strictEqual(currentProject, "test1");
        }); 
        it("should be able to load another", async function(){
            //make fake project 1
            if(!fs.existsSync(replDir)) fs.mkdirSync(replDir);
            if(!fs.existsSync(path.join(replDir, cli.defaultProjectName +"1"))) fs.mkdirSync(path.join(replDir, cli.defaultProjectName + "1"));
            state.lastSession = {
                lastProject: "test1"
            };
            
            cli.run();
            await send("repl"); //repl command
            await press(ARROW_DOWN);
            await press(ARROW_DOWN);
            await press("\r");

            assert.strictEqual(currentProject, "ncq_test1");
        }); 
        it("should ask for name on create new project and then create it", async function(){
            //make fake project 1
            if(!fs.existsSync(replDir)) fs.mkdirSync(replDir);
            if(!fs.existsSync(path.join(replDir, cli.defaultProjectName +"1"))) fs.mkdirSync(path.join(replDir, cli.defaultProjectName + "1"));

            cli.run();
            await send("repl"); //repl command
            await press("\r"); //select new
            var app = state.app;
            await press("\r"); //confirm name

            var expected = chalk.green("Project name ") + "? ncq_test2" + cursor(" ")+"\n";
            assert.strictEqual(app.frames[0], expected);
            assert.strictEqual(currentProject, "ncq_test2");
        }).timeout(0); 
        it("should handle no name on new", async function(){
            //make fake project 1
            if(!fs.existsSync(replDir)) fs.mkdirSync(replDir);
            if(!fs.existsSync(path.join(replDir, cli.defaultProjectName +"1"))) fs.mkdirSync(path.join(replDir, cli.defaultProjectName + "1"));

            cli.run();
            await send("repl"); //repl command
            await press("\r"); //select new
            var app = state.app;
            for(var i=0; i<9; i++) await press(DELETE);
            await press("\r"); //confirm name

            assert.strictEqual(output[1], "No project name!");
            assert.strictEqual(typeof currentProject, "undefined");
        }).timeout(0); 
        it("should overwrite existing project", async function(){
            //make fake project 1
            if(!fs.existsSync(replDir)) fs.mkdirSync(replDir);
            if(!fs.existsSync(path.join(replDir, cli.defaultProjectName +"1"))) fs.mkdirSync(path.join(replDir, cli.defaultProjectName + "1"));

            cli.run();
            await send("repl"); //repl command
            await press("\r"); //select new
            await press(DELETE);
            await press("1"); //write 1
            await press("\r"); //confirm name
            var app = state.app;
            await press("\r");

            const expected = "Project already exists at ncq_test1. Do you want to overwrite?\n" +
            "\x1B[36m(*) Yes\x1B[39m  ( ) No";
            assert.strictEqual(app.lastFrame(), expected);
        }).timeout(0); 
        it("should be able to cancel overwrite prompt", async function(){
            //make fake project 1
            if(!fs.existsSync(replDir)) fs.mkdirSync(replDir);
            if(!fs.existsSync(path.join(replDir, cli.defaultProjectName +"1"))) fs.mkdirSync(path.join(replDir, cli.defaultProjectName + "1"));

            cli.run();
            await send("repl"); //repl command
            await press("\r"); //select new
            await press(DELETE);
            await press("1"); //write 1
            await press("\r"); //confirm name
            var app = state.app;
            await press(ESC);
            
            const expected = "\x1B[2mProject already exists at ncq_test1. Do you want to overwrite?\x1B[22m\n" +
                "\x1B[36m\x1B[2m(*) Yes\x1B[22m\x1B[39m  \x1B[2m( ) No\x1B[22m";
            assert.strictEqual(app.lastFrame(), expected);
        });
        it("should be able to say no to overwrite prompt", async function(){
            //make fake project 1
            if(!fs.existsSync(replDir)) fs.mkdirSync(replDir);
            if(!fs.existsSync(path.join(replDir, cli.defaultProjectName +"1"))) fs.mkdirSync(path.join(replDir, cli.defaultProjectName + "1"));

            cli.run();
            await send("repl"); //repl command
            await press("\r"); //select new
            await press(DELETE);
            await press("1"); //write 1
            await press("\r"); //confirm name
            var app = state.app;
            await press(ARROW_RIGHT);
            await press("\r");
            
            const expected = "Project already exists at ncq_test1. Do you want to overwrite?\n" +
                    "( ) Yes  \x1B[36m(*) No\x1B[39m";
            assert.strictEqual(app.lastFrame(), expected);
        }); 
        afterEach(()=>{
            if(fs.existsSync("testRepls")) rimraf.sync("testRepls");
        });
    });

    after(()=>{
        state.silent = false;
        stubWrite.restore();
        stubLoadProject.restore();
    });
});