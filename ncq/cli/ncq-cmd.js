const Cmd = require("./base-cmd");
const utils = require("../utils");

const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const Project = require("../core/project");

var BASE;
var OPTIONS;

/**
 * Extended Cmd with our commands, for our CLI.
 */
class NcqCmd extends Cmd {
    constructor(input) {
        super(input);

        BASE = utils.getBaseDirectory();
        OPTIONS = utils.options(process.argv);

        this.opening =
      "Welcome to NCQ Command Line Interface. Type help for more information.";
        this.replWarning =
      "No REPL. Create a node.js REPL with the repl command to use this command: ";
        this.unknown = "Did not understand command: ";
        this.helpPrompt = "Write help to show the list of commands.";
        this.replCmds = [];
        this.counter = 0;
    }

    /**
   * Extend run to print custom intro.
   */
    async run() {
        console.log(this.opening);
        await super.run();
    }

    /**
   * The default command, when the command matches no other commands.
   */
    default(inp) {
    //if command is a repl command, give user help for how to start repl
        var cmd = inp.substring(0, inp.indexOf("("));
        if (this.replCmds.includes(cmd)) {
            console.log(this.replWarning + inp);
            console.log(this.helpPrompt);
            return;
        }

        //otherwise, don't understand command
        console.log(this.unknown + inp);
        console.log(this.helpPrompt);
    }

    /**
   * Help for repl command.
   */
    help_repl(inp) {
        console.log("Runs a node.js repl.");
    }

    do_repl(inp) {
    //if packages
        var required = [];
        if (inp.trim() != "") {
            //print packages
            console.log(inp);
            //get list of packages
            required = inp.split(" ");
        }

        //make temporary folder
        this.counter++;
        var tmpDir = path.join(BASE, "tmp" + this.counter);
        //if not logging usage temporary folder works as expected, can be overwrtten
        if(!OPTIONS.usage){
            if (fs.existsSync(tmpDir)) {
                rimraf.sync(tmpDir);
            }
        }
        else{
            //otherwise, find a nonexistant tmpN
            while(fs.existsSync(tmpDir)){
                this.counter++;
                tmpDir = path.join(BASE, "tmp" + this.counter);
            }
        }

        Project.createProject(tmpDir, required);

        //reset stdin
        this.resetStdin();

        Project.startReplInProject(tmpDir, required);

        //retain folder if recording usage
        if (!OPTIONS.usage) {
            //delete the temporary folder
            rimraf.sync(tmpDir);
        }
    }
}

module.exports = NcqCmd;
