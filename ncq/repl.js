const PromptReadable = require("./ui/prompt-readable");
const PromptWritable = require("./ui/prompt-writable");
const { footer } = require("./ui/footer");
const { getLogger } = require("./logger");
const CodeSearch = require("./service/code-search");

const CliProgress = require("cli-progress");
const cprocess = require("child_process");
const fs = require("fs");
const ProgressMonitor = require("progress-monitor");
const Store = require("data-store");
let Table = require("tty-table");
const colors = require("ansi-colors");
const repl = require("repl");
const path = require("path");

const VERSION = "1.0.0";
const NAME = "NCQ";
var searcher;
var options = {};
var replInstance;
var logger;

//run if called as main, not if required
if (require.main == module) {
  main();
}

async function main() {
  //init
  initialize();

  //start repl
  replInstance = repl.start(options);

  defineCommands();
}

/**
 * Initialize application.
 */
function initialize() {
  logger = getLogger(true);

  var ticks = 0;

  var monitor = new ProgressMonitor(100);

  var progressBar = new CliProgress.SingleBar({
    format: "LOADING: [{bar}]",
    barCompleteChar: "\u25AE",
    barIncompleteChar: ".",
  });

  monitor.on("start", function () {
    progressBar.start(100, 0);
  });

  var worked = 0;
  monitor.on("work", function (value) {
    worked += value;
    progressBar.update(worked);
  });

  monitor.on("end", function () {
    progressBar.update(100);
    progressBar.stop();
  });

  //setup codesearch service
  searcher = new CodeSearch();
  //searcher.state.data.MAX = 100;
  searcher.initialize(monitor);

  searcher.state.installedPackageNames = getInstalledPackages();

  var tasks = searcher.state.data.getTaskArray();

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

function defineCommands() {

  replInstance.defineCommand("exit", {
    help: "Exit the repl",
    action: function(){
      process.exit(0);
    },
  });

  replInstance.defineCommand("editor", {
    help: "Enter editor mode",
    action: editor,
  });

  replInstance.defineCommand("packages", {
    help:
      "Search for packages using a task, optional index to navigate results. (Usage: .packages <task> , <index>)",
    action: packages,
  });

  replInstance.defineCommand("samples", {
    help:
      "Search for samples using package names, or with no arguments, your installed packages. (Usage: .samples <package/s>)",
    action: samples,
  });

  replInstance.defineCommand("samplesByTask", {
    help: "Search for samples using a task. (Usage: .samplesByTask <task>)",
    action: samplesByTask,
  });

  replInstance.defineCommand("version", {
    help: "Print REPL version",
    action: version,
  });

  replInstance.defineCommand("install", {
    help: "Install given package. (Usage: .install <package>)",
    action: install,
  });

  replInstance.defineCommand("uninstall", {
    help: "Uninstall given package. (Usage: .uninstall <package>)",
    action: uninstall,
  });
}

/**
 * Lists top 50 packages for a given task. By default prints from 0.
 */
function packages(string) {
  var parts = string.split(",");
  var task = parts[0];
  var index;
  if(parts[1]){
    index = parseInt(parts[1])
  }
  if(!index) index = 0;

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
          'Hint: Use .packages ' +
            task +
            ', ' +
            (index + 25) +
            " to see more."
        )
    );
  }
}

/**
 * Get samples for a package name or multiple names.
 * @param {String} packageName - Package name/s to search by
 */
function samples(packageName) {
  var packages;

  //get array of packages
  if (packageName === undefined) {
    packages = searcher.state.installedPackageNames;
  } else {
    packages = packageName.trim().split(" ");
  }

  if (packages.length < 1) {
    console.log(
      NAME +
        ": No packages installed. Install a package using .install or supply a package name as argument. See .help for more info."
    );
    return;
  }

  var snippets = searcher.snippetsByPackages(packages);
  if (!snippets || snippets.length < 1) {
    console.error(NAME + ": could not find any samples for packages.");
    return;
  }

  //set cycleable
  replInstance.inputStream.setSnippets(snippets);
  return;
}

/**
 * REPL Function to search for samples using a task, then make cyclable.
 * @param {String} task - Task to search by
 */
function samplesByTask(task) {
  console.log(task);
  if (!task) {
    console.log(
      NAME + ": Command samplesByTask requires a task string, see .help"
    );
    return;
  }

  //get snippets
  var snippets = searcher.snippetsByTask(task);
  if (!snippets || snippets.length < 1) {
    console.log("could not find any samples for this task");
    return;
  }

  //set cyclable
  replInstance.inputStream.setSnippets(snippets);
  return;
}

/**
 * Install passed package.
 * @param {String} packageString - String list of package names
 * @param {Object} output - Output option for execSync, by default 'inherit'.
 */
function install(packageString, output = "inherit") {
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
}

/**
 * Uninstall passed package.
 * @param {String} packageString - String list of package names
 * @param {Object} output - Output option for execSync, by default 'inherit'.
 */
function uninstall(packageString, output = "inherit") {
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
}

/**
 * Print version.
 */
function version() {
  console.log(`Node Query Library (NQL) version ${VERSION}`);
}

//for now just prints context
function editor() {
  //print instructions
  console.log("// Entering editor mode");

  //get code from repl context
  var code = replInstance.lines.join("\n");

  //open a new process for editing so we can do this sync (we could do a custom command for things like vim too!)

  //save file
  fs.writeFileSync("index.js", code);

  var appPath = path.join(
    searcher.state.BASE_DIR,
    "ncq/ui/default-editor-process.js"
  );
  var filePath = path.join(process.cwd(), "index.js");
  var command = "node " + appPath + " " + filePath;
  var lastMod = fs.statSync(filePath).mtime.toISOString();

  //https://stackoverflow.com/questions/25789064/node-js-readline-with-interactive-child-process-spawning
  //not exactly related but a bit of info on setrawmode and why it avoids some weird bugs
  process.stdin.setRawMode(true);

  try {
    cprocess.execSync(command, {
      stdio: "inherit",
    });
  } catch (err) {
    console.log(err.status);
  }

  //without this ctrl+c is passed to parent, this really seems to fix a lot of child process issues!
  process.stdin.setRawMode(false);

  //if there was no modification, done
  if (fs.statSync(filePath).mtime.toISOString() === lastMod) {
    return;
  }

  console.log("// Loading and running new context, will print");

  //clear context
  this.clearBufferedCommand();
  this.resetContext();
  // Object.assign(replInstance.context, state); //bit of a hack to get our commands back, should i move them to the dot style?
  //call default load
  replInstance.commands["load"].action.call(replInstance, "index.js");
}
