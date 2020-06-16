const repl = require("repl");
const PromptReadable = require("./ui/prompt-readable");
const DataHandler = require("./data-handler");
const path = require("path");
const natural = require("natural");
const fs = require("fs");
const cprocess = require("child_process");
const winston = require("winston");
const fse = require("fs-extra");
const {footer} = require("./ui/footer");

var BASE = __dirname;
parts = BASE.split("/");
if (parts[parts.length - 1] != "node_code_query") {
  BASE = path.join(BASE, "..");
}

/* library description */
const library_desc = {};
/* snippet description */
const snippets = {};
// keywords extracted from package description and snippet description (needs to clean up)
const tfidf = new natural.TfIdf();
// my stop words
const our_stopwords = [
  "package",
  "js",
  "based",
  "zero",
  "providing",
  "massive",
  "amounts",
];

const LOGDIR = path.join(BASE, "logs/repl");
const SNIPPETDIR = path.join(BASE, "data/snippets");
const VERSION = "1.0.0";
const NAME = "NCQ";
const threshold_sim = 0.25;
const NUM_KEYWORDS = 20;
const ARG_PACKS = process.argv
  .slice(2)
  .reduce((acc, y) => {
    acc = acc + y + " ";
    return acc;
  }, "")
  .trim();
var installedPackages = [];
if (ARG_PACKS.trim() != "") {
  installedPackages = ARG_PACKS.split(" ");
}
var data;
var taskMap;

//set up the repl logger
if (!fs.existsSync(LOGDIR)) {
  //make dir if it doesnt exist
  fse.mkdirSync(LOGDIR, { recursive: true });
}
const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  defaultMeta: { service: "user-service" },
  transports: [
    //debug for debugging
    new winston.transports.File({
      filename: path.join(
        LOGDIR,
        "/debug" + Math.floor(Date.now() / 1000) + ".log"
      ),
      level: "debug",
    }),
    //info for results
    new winston.transports.File({
      filename: path.join(
        LOGDIR,
        "/run" + Math.floor(Date.now() / 1000) + ".log"
      ),
      level: "info",
    }),
  ],
});

var options = {};
var myRepl;

/**
 * REPL functions.
 */
const state = {
  /**
   * Get packages given a task.
   */
  packages(string){
    var task = string.trim();
    console.log("");
    console.log("task: " + task);
    if(taskMap.has(task)){
      var list = taskMap.get(task);
      console.log("packages: ");
      list.forEach(element => {
        console.log(" - " + element.slice(0, element.length-5));
      });
      console.log("");
    }
    else{
      console.log("Can find no packages for task: " + task);
    }
  },

  /**
   * Install passed package.
   * TODO: Handle fail.
   */
  install(string, output = "inherit") {
    //get packages
    var packages = string.split(" ");
    //commandline install
    cprocess.execSync(
      "npm install " +
        packages.join(" ") +
        " --save --production --no-optional",
      {
        stdio: output,
      }
    );
    installedPackages = installedPackages.concat(packages);
    if (myRepl) {
      myRepl.inputStream.setMessage("[" + installedPackages.join(" ") + "]");
    }
  },

  /**
   * Uninstall passed package.
   */
  uninstall(string, output = "inherit") {
    //get packages
    var packages = string.split(" ");
    //commandline uninstall
    cprocess.execSync(
      "npm uninstall " + packages.join(" ") + " --save --production",
      {
        stdio: output,
      }
    );
    for (let i = 0; i < packages.length; i++) {
      if (installedPackages.includes(packages[i])) {
        var index = installedPackages.indexOf(packages[i]);
        installedPackages.splice(index);
      }
    }
    if (myRepl) {
      myRepl.inputStream.setMessage(
        "[" + installedPackages.join(" ").trim() + "]"
      );
    }
  },

  samples(string) {
    var snippets = data.getSnippetsFor(string);
    if(!snippets || snippets.length < 1){
      console.log("could not find any sample for this task");
    }
    else{
      myRepl.inputStream.setSnippets(snippets);
    }
    // set = snippets[string.trim()];
    // if (set == undefined) {
    //   console.log("could not find any sample for this package");
    // } else {
    //   //convert set to array
    //   var array = Array.from(set);
    //   //set snippets to be cyclable
    //   myRepl.inputStream.setSnippets(array);
    // }
    return;
  },

  /**
   * Exit REPL.
   */
  exit(string) {
    process.exit(0);
  },

  /**
   * Print version.
   */
  version(string) {
    console.log(`Node Query Library (NQL) version ${VERSION}`);
  },

  /**
   * Print help.
   */
  help() {
    console.log("========================================");
    console.log("samples(str)             lists samples catalogued for that package");
    console.log("packages(str)            lists packages for a given task");
    console.log("install(str)             install given package");
    console.log("uninstall(str)           uninstall given package");
    console.log("");
  },
};

function defineReplFunctions() {
  Object.assign(myRepl.context, state);
}

async function main() {
  logger.log("debug", "Base directory: " + BASE);
  logger.log("debug", "Logger initialized at: " + LOGDIR);

  //set up data handler
  data = new DataHandler();
  //load tasks
  await data.loadTasks(path.join(BASE, "data/tasks.txt"));
  //load snippets
  await data.loadSnippets(SNIPPETDIR);
  taskMap = data.getTasks();
  var tasks = Array.from(taskMap.keys());

  //create input readable
  var pReadable = new PromptReadable({
    choices: tasks.slice(0, 1000).sort(),
    prefix: NAME,
    message: "[" + installedPackages.join(" ") + "]",
    footer: footer,
    multiline: true,
    scroll: true
  });

  //set options
  options = {
    prompt: "",
    ignoreUndefined: true,
    input: pReadable,
    output: process.stdout,
  };

  myRepl = repl.start(options);
  defineReplFunctions();
}

//run if called as main, not if required
if (require.main == module) {
  main();
}

exports.state = state;
