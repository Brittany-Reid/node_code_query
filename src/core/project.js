const fs = require("fs");
const child_process = require("child_process");
const { getBaseDirectory } = require("../common");
const state = require("./state");
const config = require("../config");
const rimraf = require("rimraf");
const path = require("path");
const { getLogger } = require("./logger");

const logger = getLogger();

/**
 * Class with functions for handling Node.js projects.
 */
class Project{
    /**
     * Creates project with name in REPLs folder.
     * @param {string} projectName 
     * @param {*} dependencies 
     */
    static createProject(projectName, dependencies=[]){
        //create repl directory if neccessary
        Project.replDirectory();

        var projectPath = path.join(state.replDir, projectName);

        if(fs.existsSync(projectPath)){
            rimraf.sync(projectPath);
        }
        fs.mkdirSync(projectPath);

        process.chdir(projectPath);

        //init
        child_process.execSync("npm init -y", {
            stdio: [process.stdin, undefined, process.stderr],
        });

        //install
        state.write("npm install");
        child_process.execSync(
            "npm install " + dependencies.join(" ") + " --save --production --no-optional",
            {
                stdio: [process.stdin, state.stdout, state.stderr],
            }
        );

        process.chdir(getBaseDirectory());
    }

    static replDirectory(){
        if(!fs.existsSync(state.replDir)) fs.mkdirSync(state.replDir);
    }

    static loadProject(projectName){
        var projectPath = path.join(state.replDir, projectName);
        if(!fs.existsSync(projectPath)){
            state.write("Error: Project '" + projectName + "' does not exist!");
            return;
        }

        state.loadedProject = projectName;
        config.saveLastSession(state.loadedProject);
        state.write("\nLoading project '" + projectName + "':");

        //get current process arguments
        var  nodeOptions = "";
        if (process.execArgv) {
            nodeOptions = process.execArgv.join(" ") + " ";
        }

        //app args
        var appOptions = process.argv.slice(2).join(" ");

        process.chdir(projectPath);

        process.once("SIGINT", ()=>{});

        //try to run the repl
        try {
            child_process.execSync(
                "node " + nodeOptions + path.join(getBaseDirectory(), "/src/repl-instance.js " + appOptions),
                {
                    stdio: "inherit",
                }
            );
        } catch (err) {
            //catch error
            if(err.signal !== "SIGINT")
                state.write("\nREPL failed with code " + err.status);
        }

        //return to base dir when done
        process.chdir(getBaseDirectory());
    }

    static install(packages){
        var command = "npm install " + packages.join(" ") + " --save --production --no-optional";
        try {
            child_process.execSync(command,
                {
                    stdio: [process.stdin, state.stdout, state.stderr]
                }
            );
        } catch (err) {
            //catch error installing
            state.write("Install failed with code " + err.status);
            throw err;
        }
    }

    static uninstall(packages){
        var command = "npm uninstall " + packages.join(" ") + " --save --production";
        try {
            child_process.execSync(command,
                {
                    stdio: [process.stdin, state.stdout, state.stderr]
                }
            );
        } catch (err) {
            //catch error installing
            state.write("Uninstall failed with code " + err.status);
            throw err;
        }
    }

    /**
     * Read repl directory and return existing REPL folders.
     */
    static getRepls(){
        var repls = [];
        if(!fs.existsSync(state.replDir)) return repls;
        repls = fs.readdirSync(path.join(getBaseDirectory(), state.replDir));
        return repls;
    }
}

Project.filename = "index.js";

module.exports = Project;