const fs = require("fs")
const child_process = require("child_process");
const utils = require("../utils");

const BASE = utils.getBaseDirectory();
const OPTIONS = utils.options(process.argv);

/**
 * Class with functions for handling Node.js projects.
 */
class Project{
    /**
     * Create a project in the given directory.
     * Assumes you are in base directory.
     * @param {string} projectDir Directory of project.
     */
    static createProject(projectDir, dependencies = []){
        if(!fs.existsSync(projectDir)){
            fs.mkdirSync(projectDir);
        }

        process.chdir(projectDir);

        //init
        child_process.execSync("npm init -y", {
            //allowing stderr unless it causes a problem
            stdio: [process.stdin, undefined, process.stderr],
        });

        //install
        child_process.execSync(
            "npm install " + dependencies.join(" ") + " --save --production --no-optional",
            {
                //allow npm install output
                stdio: [process.stdin, process.stdout, process.stdout],
            }
        );

        process.chdir(BASE);
    }

    /**
     * Start a repl instance for a given project.
     * @param {string} projectDir Directory of project.
     */
    static startReplInProject(projectDir, dependencies = []){
        //could we read dependencies from package.json in repl process?
        process.chdir(projectDir);

        var  nodeOptions = "";
        var args = [];

        //get current process arguments
        if (process.execArgv) {
            nodeOptions = process.execArgv.join(" ") + " ";
        }

        //get repl arguments
        if (OPTIONS.log) {
            args.push("--log");
        }
        if (OPTIONS.usage) {
            args.push("--usage");
        }
        if (OPTIONS.searchless) {
            args.push("--searchless");
        }

        //try to run the repl
        try {
            child_process.execSync(
                "node " + nodeOptions + "../ncq/repl.js " + dependencies.join(" ") + " " + args.join(" "),
                {
                    stdio: "inherit",
                }
            );
        } catch (err) {
            //catch error
            console.log("\nREPL failed with code " + err.status);
            return;
        }

        //return to base dir when done
        process.chdir(BASE);
    }
}

// Project.createProject("tmp4");
// Project.startReplInProject("tmp4");

module.exports = Project;