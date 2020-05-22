const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const fse = require("fs-extra");
const cprocess = require("child_process");
const winston = require("winston");
const SuggestionPrompt = require("./ui/prompts/suggestion-prompt");
const PromptHandler = require("./ui/prompt-handler");
const Cmd = require("./cmd");
const DataHandler = require("./data-handler");
const utils = require("./utils");

const OPTIONS = utils.options(process.argv);
const BASE = utils.getBaseDirectory();
const SNIPPETDIR = path.join(BASE, "data/snippets");
const LOGDIR = path.join(BASE, "logs/main");
var data = new DataHandler();
var packages = [];
var counter = 0;

/*
Our main program. From here we can start a repl with specified packages.
*/
class ncqCmd extends Cmd {
  constructor(input) {
    super(input);
  }

  /**
   * The default command, when the command matches no other commands.
   */
  default(inp) {
    if (inp == "x" || inp == "q") {
      return this.do_exit(inp);
    }
    console.log(
      "Did not understand command: " +
        inp +
        "\nWrite help to show the list of commands."
    );
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
    if (!packages || packages.length == 0) {
      data.loadPackages(SNIPPETDIR);
    }
    packages.forEach((element) => {
      console.log(element);
    });
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
        if (!packages.includes(required[i])) {
          console.log(
            "could not find package " + required[i] + " cannot create repl"
          );
          return false;
        }
      }
    }
    //make temp
    counter++;
    var tmpDir = path.join(BASE, "tmp" + counter);
    if (fs.existsSync(tmpDir)) {
      rimraf.sync(tmpDir);
    }
    fs.mkdirSync(tmpDir);
    //copy repl
    fs.copyFileSync(
      path.join(BASE, "ncq/repl.js"),
      path.join(tmpDir, "repl.js")
    );
    //copy dependant files
    fse.copySync(path.join(BASE, "ncq/ui"), path.join(tmpDir, "ui"));
    fs.copyFileSync(
      path.join(BASE, "package.json"),
      path.join(tmpDir, "package.json")
    );
    fs.copyFileSync(
      path.join(BASE, "package-lock.json"),
      path.join(tmpDir, "package-lock.json")
    );
    //copy repl
    fs.copyFileSync(
      path.join(BASE, "ncq/data-handler.js"),
      path.join(tmpDir, "data-handler.js")
    );
    //change directory
    process.chdir(tmpDir);
    // install packages within that directory
    cprocess.execSync(
      "npm install " + required.join(" ") + " --save --production --no-optional",
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
    process.chdir(BASE);
    //delete the temporary folder
    rimraf.sync(tmpDir);
  }
}

async function setupLogger() {
  var logger = winston.createLogger();

  //create default silent logger
  logger.add(
    new winston.transports.Console({
      name: "console.info",
      format: winston.format.simple(),
      silent: true,
    })
  );

  //if --log is set as arg
  if (OPTIONS.log == true) {
    if (fs.existsSync(LOGDIR)) {
      //make dir if it doesnt exist
      fse.mkdirSync(LOGDIR, { recursive: true });
    }

    
    //debug for debugging
    logger.add(
      new winston.transports.File({
        filename: path.join(
          LOGDIR,
          "/debug" + Math.floor(Date.now() / 1000) + ".log"
        ),
        level: "debug",
      })
    );

    //info for results
    logger.add(
      new winston.transports.File({
        filename: path.join(
          LOGDIR,
          "/run" + Math.floor(Date.now() / 1000) + ".log"
        ),
        level: "info",
      })
    );
  }

  logger.log("debug", "Base directory: " + BASE);
  logger.log("debug", "Logger initialized at: " + LOGDIR);
}

async function main() {
  await setupLogger();
  packages = await data.loadPackges(SNIPPETDIR);

  var myPrompt = new PromptHandler(SuggestionPrompt, {
    choices: packages.slice(),
  });

  new ncqCmd(myPrompt).run();
}

//run if called as main, not if required
if (require.main == module) {
  main();
}