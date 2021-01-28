const Cmd = require("./base-cmd");
const utils = require("../utils");

const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const fse = require("fs-extra");
const cprocess = require("child_process");
const { TransformationRule } = require("natural");

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
      "No REPL. Create a node.js REPL with the repl command to use this command:";
    this.unknown = "Did not understand command:";
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
    // Cant understand what this peace of code is doing in here
    // replCmds array seems to be always empty, so IF statment neve evaluates TRUE
    var cmd = inp.substring(0, inp.indexOf("("));
    if (this.replCmds.includes(cmd)) {
      console.log(`${this.replWarning} ${inp}`);
      console.log(this.helpPrompt);
      return;
    }
    

    //otherwise, don't understand command
    console.log(`${this.unknown} ${inp}`);
    console.log(this.helpPrompt);
  }

  //TODO: move this into repl later
  // /**
  //  * Help for list_packages command.
  //  */
  // help_list_packages(inp) {
  //   console.log("Lists available packages.");
  // }

  // /**
  //  * Lists packages in the snippet directory for repl.
  //  */
  // do_list_packages(inp) {
  //   for (let i = 0; i < this.packages.length; i++) {
  //     console.log(this.packages[i]);
  //   }
  // }

  /**
   * Help for repl command.
   */
  help_repl(inp) {
    console.log("Runs a node.js repl.");
  }

  do_repl(inp) {

    const emptyStr = "";
    const singleSpaceStr = " ";
    const dirPrefix = "tmp";

    //if packages
    var required = [];
    if (inp.trim() != emptyStr) {
      //print packages
      console.log(inp);
      //get list of packages
      required = inp.split(singleSpaceStr);
    }

    //make temporary folder
    this.counter++;
    var tmpDir = path.join(BASE, dirPrefix + this.counter);
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
        var tmpDir = path.join(BASE, dirPrefix + this.counter);
      }
    }

    fs.mkdirSync(tmpDir);

    //change directory
    process.chdir(tmpDir);

    fs.writeFileSync(
      "package.json",
      '{"license": "ISC", "description": "temporary repl", "repository": "null"}'
    );
    fs.writeFileSync("package-lock.json", '{"lockfileVersion": 1}');

    // install packages within that directory
    cprocess.execSync(
      `npm install ${required.join(singleSpaceStr)} --save --production --no-optional`,
      {
        stdio: [process.stdin, process.stdout, process.stdout],
      }
    );

    //reset stdin
    this.resetStdin();

    //do repl
    var args = [];
    if (OPTIONS.log) {
      args.push("--log");
    }
    if (OPTIONS.usage) {
      args.push("--usage");
    }
    if (OPTIONS.searchless) {
      args.push("--searchless");
    }

    //pass current process arguments
    
    var nodeOptions = emptyStr;

    if (process.execArgv) {
      nodeOptions = process.execArgv.join(singleSpaceStr);
    }

    try {
      cprocess.execSync(
        `node ${nodeOptions} ../ncq/repl.js ${required.join(singleSpaceStr)} ${args.join(singleSpaceStr)}`,
        { 
          stdio: "inherit",
        }
      );
    } catch (err) {
      console.log(`\nREPL failed with code ${err.status}`);
      return;
    }

    //return to our directory
    process.chdir(BASE);

    //retain folder if recording usage
    if (!OPTIONS.usage) {
      //delete the temporary folder
      rimraf.sync(tmpDir);
    }
  }
}

module.exports = NcqCmd;
