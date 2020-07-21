const PromptReadable = require("./ui/prompt-readable");
const PromptWritable = require("./ui/prompt-writable");
const { footer } = require("./ui/footer");
const { getLogger } = require("./logger");
const CodeSearch = require("./service/code-search");

const CliProgress = require("cli-progress");
const cprocess = require("child_process");
// var events = require("events");
const Store = require("data-store");
let Table = require("tty-table");
const colors = require("ansi-colors");
const repl = require("repl");
const VERSION = "1.0.0";
const NAME = "NCQ";
var searcher;
var options = {};
var replInstance;
var logger;

/**
 * REPL functions.
 */
const state = {
  /**
   * REPL Function to search for samples by task, then make cyclable.
   * @param {String} task - Task to search by
   */
  samples(task) {
    //get snippets
    var snippets = searcher.snippetsByTask(task);
    if (!snippets || snippets.length < 1) {
      console.log("could not find any samples for this task");
      return;
    }

    //set cyclable
    replInstance.inputStream.setSnippets(snippets);
    return;
  },

  /**
   * Get samples for a package name.
   * @param {String} packageName - Package name to search by
   */
  packageSamples(packageName) {
    var snippets = searcher.snippetsByPackage(packageName);
    if (!snippets || snippets.length < 1) {
      console.error(NAME + ": could not find any samples for this package");
      return;
    }

    //set cycleable
    replInstance.inputStream.setSnippets(snippets);
    return;
  },

  /**
   * Lists top 50 packages for a given task. By default prints from 0.
   */
  packages(task, index = 0) {
    var packages = searcher.packagesByTask(task);

    //format header
    var header = [
      { value: "index", width: 10 },
      { value: "name" },
      { value: "desciption", align: "left" },
    ];

    var subset = packages.slice(index, index + 25);

    var rows = [];
    for (var i = 0; i < subset.length; i++) {
      var p = subset[i];
      var name = p.name;
      var description = p.description;
      rows.push([(i + index).toString(), name, description]);
    }

    //do table using tty-table (will auto scale)
    let tableANSI = Table(header, rows, { headerAlign: "center" }).render();
    console.log(tableANSI);

    //print how many are not displayed
    var rest = packages.length - (subset.length + index);
    if (rest > 0) {
      console.log(
        "...and " +
          rest +
          " more packages. " +
          colors.green(
            'Hint: Use packages("' +
              task +
              '", ' +
              (index + 25) +
              ") to see more."
          )
      );
    }
  },

  /**
   * Install passed package.
   * @param {String} packageString - String list of package names
   * @param {Object} output - Output option for execSync, by default 'inherit'.
   */
  install(packageString, output = "inherit") {
    //get package array
    var packages = packageString.split(" ");
    //cli install
    try {
      cprocess.execSync(
        "npm install " +
          packages.join(" ") +
          " --save --production --no-optional",
        {
          stdio: output,
        }
      );
    } catch (err) {
      //catch error installing
      console.log("Install failed with code " + err.status);
      return;
    }

    //update state
    searcher.state.installedPackageNames = searcher.state.installedPackageNames.concat(
      packages
    );

    //update repl
    replInstance.inputStream.setMessage(
      "[" + searcher.state.installedPackageNames.join(" ") + "]"
    );
  },

  /**
   * Uninstall passed package.
   * @param {String} packageString - String list of package names
   * @param {Object} output - Output option for execSync, by default 'inherit'.
   */
  uninstall(packageString, output = "inherit") {
    //get packages
    var packages = packageString.split(" ");

    //cli uninstall
    try {
      cprocess.execSync(
        "npm uninstall " + packages.join(" ") + " --save --production",
        {
          stdio: output,
        }
      );
    } catch (err) {
      //catch error uninstalling
      console.log("Uninstall failed with code " + err.status);
      return;
    }

    //update installed packages
    for (var packageName of packages) {
      var index = searcher.state.installedPackageNames.indexOf(packageName);
      if (index != -1) searcher.state.installedPackageNames.splice(index);
    }

    replInstance.inputStream.setMessage(
      "[" + searcher.state.installedPackageNames.join(" ").trim() + "]"
    );
  },

  /**
   * Print version.
   */
  version() {
    console.log(`Node Query Library (NQL) version ${VERSION}`);
  },

  /**
   * Print help.
   */
  help() {
    console.log("========================================");
    console.log(
      "samples(String task)                 search for samples using a task"
    );
    console.log(
      "packages(String task, int index?)    search for packages using a task, optional index to navigate results"
    );
    console.log(
      "packageSamples(String package)       search for samples for a package"
    );
    console.log("install(String package)              install given package");
    console.log("uninstall(String package)            uninstall given package");
    console.log("");
  },

  /**
   * Exit REPL.
   */
  exit() {
    process.exit(0);
  },
};

//run if called as main, not if required
if (require.main == module) {
  main();
}

async function main() {
  //init
  initialize();

  //start repl
  replInstance = repl.start(options);

  //assign functions
  Object.assign(replInstance.context, state);
}

/**
 * Initialize application.
 */
function initialize() {
  logger = getLogger(true);
  
  var ticks = 0;
  var progressBar = new CliProgress.SingleBar({format: "LOADING: [{bar}]", barCompleteChar: '\u25AE', barIncompleteChar:'.'});
  progressBar.on("NCQStartEvent", function(){
    progressBar.start(100, 0);
  });
  progressBar.on("NCQUpdateEvent", function(value = 1){
    ticks += value;
    progressBar.update(ticks);
  });
  progressBar.on("NCQStopEvent", function(){
    //if you forget this the process will hang
    progressBar.update(100);
    progressBar.stop();
  });


  //setup codesearch service
  searcher = new CodeSearch();
  //searcher.state.data.MAX = 100;
  searcher.initialize(progressBar);

  searcher.state.installedPackageNames = getInstalledPackages();

  var tasks = searcher.state.data.getTaskSet();

  initializeREPL(tasks);
}

/**
 * Process args for installed packages.
 */
function getInstalledPackages() {
  var args = process.argv.slice(2);
  var installedPackages = [];

  for (var pk of args) {
    //ignore passed options
    if (!pk.trim().startsWith("--")) {
      installedPackages.push(pk);
    }
  }

  return installedPackages;
}
/**
 * Setup REPL instance and options.
 * @param {Array} tasks - Array of tasks to use for suggestions.
 */
function initializeREPL(tasks) {
  //create input stream
  var pReadable = new PromptReadable({
    choices: tasks.slice(0, 10000).sort(),
    prefix: NAME,
    message: "[" + searcher.state.installedPackageNames.join(" ") + "]",
    footer: footer,
    multiline: true,
    scroll: true,
    history: {
      store: new Store({ path: searcher.state.HISTORY_DIR }),
      autosave: true,
    },
  });

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
}

exports.state = state;