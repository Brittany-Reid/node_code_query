const Cmd = require("./cmd");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const fse = require("fs-extra");
const cprocess = require("child_process");
const SuggestionPrompt = require("./ui/prompts/suggestion-prompt");
const PromptHandler = require("./ui/prompt-handler");
const winston = require('winston');

/*
Our main program. From here we can start a repl with specified packages.
*/

var BASE = __dirname;
//fall back if we run from node_code_query/ncq
if (
  path.dirname(BASE) != "node_code_query" &&
  path.dirname(BASE) != "node_code_query/"
) {
  BASE = path.join(BASE, "../");
}
var LOGDIR = path.join(BASE, 'logs/main');
var SNIPPETDIR = path.join(BASE, "data/snippets");
var packages = [];
var counter = 0;

/**
 * Loads the list of packages.
 */
function loadPackages() {
  packages = [];

  var files = fs.readdirSync(SNIPPETDIR);

  files.forEach((file) => {
    var fPath = path.join(SNIPPETDIR, file);
    var ext = path.extname(fPath);
    if (ext === ".desc") {
      packages.push(path.basename(file, ext));
    }
  });

  return packages;
}

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
      loadPackages();
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
    //print packages
    console.log(inp);

    //check packages
    var required = inp.split(" ");
    for (let i = 0; i < required.length; i++) {
      if (!packages.includes(required[i])) {
        console.log("could not find package " + required[i] + " cannot create repl");
        return false;
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

    //change directory
    process.chdir(tmpDir);
    // install packages within that directory
    cprocess.execSync("npm install " + required.join(" ") + " --save", {
      stdio: [process.stdin, process.stdout, process.stdout],
    });
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

//set up logger for main process
if(!fs.existsSync(LOGDIR)){
  //make dir if it doesnt exist
  fse.mkdirSync(LOGDIR, {recursive : true});
}
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //debug for debugging
    new winston.transports.File({ filename: path.join(LOGDIR, '/debug' + Math.floor(Date.now() /1000) + '.log'), level: 'debug' }),
    //info for results
    new winston.transports.File({ filename: path.join(LOGDIR, '/run' + Math.floor(Date.now() /1000) + '.log'), level: 'info' })
  ]
});

logger.log("debug", "Base directory: " + BASE);
logger.log("debug", "Logger initialized at: " + LOGDIR);

loadPackages();

var myPrompt = new PromptHandler(SuggestionPrompt, {
  choices : packages.slice(),
});

new ncqCmd(myPrompt).run();

exports.loadPackages = loadPackages;