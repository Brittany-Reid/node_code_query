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
let Table = require('tty-table');
const colors = require('ansi-colors');

var BASE = __dirname;
parts = BASE.split("/");
if (parts[parts.length - 1] != "node_code_query") {
  BASE = path.join(BASE, "..");
}

const LOGDIR = path.join(BASE, "logs/repl");
const SNIPPETDIR = path.join(BASE, "data/snippets.json");
const INFODIR = path.join(BASE, "data/packageStats.json");
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
   * Lists top 50 packages for a given task. By default prints from 0.
   */
  packages(string, index = 0) {
    var task = string.trim();

    //search
    var packages = data.getPackages(task);

    //format header
    var header = [{value: "index", width: 10}, {value: "name"}, {value: "desciption", align: "left"}];

    var subset = packages.slice(index, index+25);

    var rows = [];
    for(var i = 0; i<subset.length; i++){
      var p = subset[i];
      var name = p.name;
      var description = p.description;
      rows.push([(i+index).toString(), name, description]);
    }

    //do table using tty-table (will auto scale)
    let ANSI = Table(header, rows, {headerAlign: "center"}).render()
    console.log(ANSI);

    //print how many are not displayed
    var rest =  packages.length-(subset.length+index);
    if(rest > 0){
      console.log("...and " + rest + " more packages. " + colors.green("Hint: Use packages(\"" + task + "\", " + (index+25) + ") to see more."));
    }
  },

  /**
   * Get samples given a task.
   */
  samples(string) {
    var snippets = data.getSnippetsFor(string);
    if (!snippets || snippets.length < 1) {
      console.log("could not find any samples for this task");
    } else {
      myRepl.inputStream.setSnippets(snippets);
    }
    // set = snippets[string.trim()];
    return;
  },

  /**
   * Get samples for a package name.
   */
  packageSamples(string){
    var package = string.trim();
    var snippets = data.getPackageSnippets(package);
    if (!snippets || snippets.length < 1) {
      console.log("could not find any samples for this package");
    } else {
      myRepl.inputStream.setSnippets(snippets);
    }
    return;
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
    console.log("samples(String task)                 search for samples using a task");
    console.log("packages(String task, int index?)    search for packages using a task, optional index to navigate results");
    console.log("packageSamples(String package)       search for samples for a package");
    console.log("install(String package)              install given package");
    console.log("uninstall(String package)            uninstall given package");
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
  data.loadInfo(INFODIR);
  //data.MAX = 1000; //you can limit the number of loaded snippets if you want to do testing etc
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
