const repl = require("repl");
const PromptReadable = require("./ui/prompt-readable");
const DataHandler = require("./data-handler");
const path = require("path");
const Store = require("data-store");
const natural = require("natural");
const fs = require("fs");
const cprocess = require("child_process");
const winston = require("winston");
var events = require('events');
const fse = require("fs-extra");
const { getLogger } = require("./logger");
const { footer } = require("./ui/footer");
const stream= require("stream");

var BASE = __dirname;
parts = BASE.split("/");
if (parts[parts.length - 1] != "node_code_query") {
  BASE = path.join(BASE, "..");
}

const LOGDIR = path.join(BASE, "logs/repl");
const SNIPPETDIR = path.join(BASE, "data/snippets.json");
const HISTORYDIR = path.join(BASE, "history-repl.json");
const VERSION = "1.0.0";
const NAME = "NCQ";
var installedPackages = [];
var data;
var taskMap;
var options = {};
var myRepl;
var logger;


/**
 * REPL functions.
 */
const state = {
  /**
   * Get packages given a task.
   */
  packages(string) {
    var task = string.trim();
    console.log("");
    console.log("task: " + task);
    if (taskMap.has(task)) {
      var list = taskMap.get(task);
      console.log("packages: ");
      list.forEach((element) => {
        console.log(" - " + element.slice(0, element.length - 5));
      });
      console.log("");
    } else {
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
    if (!snippets || snippets.length < 1) {
      console.log("could not find any sample for this task");
    } else {
      myRepl.inputStream.setSnippets(snippets);
    }
    // set = snippets[string.trim()];
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
    console.log(
      "samples(str)             lists samples catalogued for that package"
    );
    console.log("packages(str)            lists packages for a given task");
    console.log("install(str)             install given package");
    console.log("uninstall(str)           uninstall given package");
    console.log("");
  },
};

function defineReplFunctions() {
  Object.assign(myRepl.context, state);
}

/**
 * Process args for installed packages.
 */
function processArgs() {
  var args = process.argv.slice(2);
  installedPackages = [];

  for (var pk of args) {
    //ignore passed options
    if (!pk.trim().startsWith("--")) {
      installedPackages.push(pk);
    }
  }
}

async function main() {
  processArgs();

  logger = getLogger(true);

  //set up data handler
  data = new DataHandler();
  //load tasks
  var tasks = data.loadTasks(path.join(BASE, "data/id,tasks.txt"));

  //loading event emitter
  var loadingProgress = new events.EventEmitter();

  console.log('LOADING SNIPPETS');

  //we tick 10 times
  var progress = 0;
  loadingProgress.on("progress", function(){
    progress += 10;
    console.log(progress + "%...");
    //for now this is just really simple, we can do a fancy progress bar or something later
  });

  loadingProgress.on("end", function(){
    //newline
    console.log("");
  })

  //load snippets
  data.MAX = 1000; //you can limit the number of loaded snippets if you want to do testing etc
  data.loadSnippets(SNIPPETDIR, loadingProgress);

  tasks = Array.from(tasks.keys());


  //create input readable
  var pReadable = new PromptReadable({
    choices: tasks.slice(0, 10000).sort(),
    prefix: NAME,
    message: "[" + installedPackages.join(" ") + "]",
    footer: footer,
    multiline: true,
    scroll: true,
    history: {
      store: new Store({ path: HISTORYDIR }),
      autosave: true,
    },
  });

  /**
   * Writable, clears prompt on write.
   */
  class PromptWritable extends stream.Writable{
    constructor(promptReadable, options){
      super(options);
      this.isTTY = process.stdout.isTTY;
      this.cleared = false;

      this.promptReadable = promptReadable;
    }

    write(str){
      var prompt = this.promptReadable.p;
      var buffer;
      if(prompt) prompt = prompt.prompt;
      if(prompt){
        if(!prompt.state.submitted){
          buffer = prompt.state.buffer;
          prompt.clear();
          prompt.restore();
        }
      }

      process.stdout.write(str);

      if(prompt && !prompt.state.submitted){
        prompt.renderNoClear();
      }
    }

    _write(str, encoding, done){

      process.stdout.write(str);
      done();
    }
  }

  //create the output object for repl, passing the input object so we can get the prompt
  var pWritable = new PromptWritable(pReadable);

  //set options
  options = {
    prompt: "",
    ignoreUndefined: true,
    input: pReadable,
    output: pWritable,
    breakEvalOnSigint: true,
  };

  myRepl = repl.start(options);
  defineReplFunctions();
}

//run if called as main, not if required
if (require.main == module) {
  main();
}

exports.state = state;
