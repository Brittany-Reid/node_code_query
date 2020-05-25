const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const fse = require("fs-extra");
const cprocess = require("child_process");
const winston = require("winston");
const Cmd = require("./base-cmd");
const ncq = require("./ncq");
const repl = require("./repl");

/**
 * Extended Cmd with our commands, for our CLI.
 */
class NcqCmd extends Cmd {
  constructor(input, packages) {
    super(input);

    this.opening =
      "Welcome to NCQ Command Line Interface. Type help() for more information.";
    this.replWarning =
      "No REPL. Create a node.js REPL with the repl() command to use this command: ";
    this.unknown = "Did not understand command: ";
    this.helpPrompt = "Write help to show the list of commands.";
    this.replCmds = Object.keys(repl.state);
    this.packages = packages;
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
   * Help for list_packages command.
   */
  help_list_packages(inp) {
    console.log("Lists available packages.");
  }

  /**
   * Lists packages in the snippet directory for repl.
   */
  do_list_packages(inp) {
    for (let i = 0; i < this.packages.length; i++) {
      console.log(this.packages[i]);
    }
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
      //check packages
      required = inp.split(" ");
      for (let i = 0; i < required.length; i++) {
        if (!this.packages.includes(required[i])) {
          console.log(
            "could not find package " + required[i] + " cannot create repl"
          );
          return false;
        }
      }
    }
    //make temp
    this.counter++;
    var tmpDir = path.join(ncq.BASE, "tmp" + this.counter);
    if (fs.existsSync(tmpDir)) {
      rimraf.sync(tmpDir);
    }
    fs.mkdirSync(tmpDir);
    //copy repl
    fs.copyFileSync(
      path.join(ncq.BASE, "ncq/repl.js"),
      path.join(tmpDir, "repl.js")
    );
    //copy dependant files
    fse.copySync(path.join(ncq.BASE, "ncq/ui"), path.join(tmpDir, "ui"));
    fs.copyFileSync(
      path.join(ncq.BASE, "package.json"),
      path.join(tmpDir, "package.json")
    );
    fs.copyFileSync(
      path.join(ncq.BASE, "package-lock.json"),
      path.join(tmpDir, "package-lock.json")
    );
    //copy repl
    fs.copyFileSync(
      path.join(ncq.BASE, "ncq/data-handler.js"),
      path.join(tmpDir, "data-handler.js")
    );
    //change directory
    process.chdir(tmpDir);
    // install packages within that directory
    cprocess.execSync(
      "npm install " +
        required.join(" ") +
        " --save --production --no-optional",
      {
        stdio: [process.stdin, process.stdout, process.stdout],
      }
    );
    this.resetStdin();
    //do repl
    var args = ["repl.js"];
    args.push(required);
    args.push("--save");
    cprocess.execSync("node repl.js " + required.join(" "), {
      stdio: "inherit",
    });
    //return to our directory
    process.chdir(ncq.BASE);
    //delete the temporary folder
    rimraf.sync(tmpDir);
  }
}

module.exports = NcqCmd;
