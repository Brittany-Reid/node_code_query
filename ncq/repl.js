const PromptReadable = require("./ui/prompt-readable");
const PromptWritable = require("./ui/prompt-writable");
const { footer } = require("./ui/footer");
const { getLogger } = require("./logger");
const NCQ = require("./core/ncq");
const utils = require("./utils");

const CliProgress = require("cli-progress");
const cprocess = require("child_process");
const fs = require("fs");
const ProgressMonitor = require("progress-monitor");
const Store = require("data-store");
let Table = require("tty-table");
const chalk = require("chalk");
const repl = require("repl");
const path = require("path");
// const ESTraverse = require("estraverse");
// const codeAnalysis = require("./core/code-analysis");
// const { fa } = require("stopword");

const OPTS = utils.options(process.argv);
const VERSION = "1.0.0";
const NAME = "NCQ";
var ncqService;
var options = {};
var replInstance;
var logger;
var silent = false;
var processArgs = process.argv;
var replExit;
// var replEval;

//run if called as main, not if required
if (require.main == module) {
    main();
}

async function main() {
    await initializeState();

    var options = initializeREPL();

    startREPL(options);
}

/**
 * Initialize application.
 * @param {Boolean} output - output true or false
 * @param {Array} args - supply args in place of process arguments, for testing
 */
async function initializeState(output = false, args) {
    //global silent
    silent = output;
    if (args !== undefined) {
        processArgs = args;
    }

    //setup logger
    logger = getLogger(true);

    //progress for loading
    var monitor;
    if (!silent) {
        monitor = new ProgressMonitor(100);

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
    }

    //setup codesearch service
    ncqService = new NCQ();
    //ncqService.state.data.MAX = 100;
    if (!OPTS.searchless) {
        await ncqService.initialize(monitor);
    }

    ncqService.state.installedPackageNames = getInstalledPackages();

    return options;
}

/**
 * Starts a REPL after options have been initialized.
 */
function startREPL(options) {
    //start repl
    replInstance = repl.start(options);

    //get default repl eval function
    //replEval = replInstance.eval;
    //replInstance.eval = eval;

    // //replace with our function that calls the default
    // replInstance.eval = eval;

    //set commands
    defineCommands();

    return replInstance;
}

/**
 * Process args for installed packages.
 */
function getInstalledPackages() {
    var args = processArgs.slice(2);
    var installedPackages = new Set();

    for (var pk of args) {
    //ignore passed options
        if (!pk.trim().startsWith("--")) {
            installedPackages.add(pk);
        }
    }

    return installedPackages;
}
/**
 * Setup REPL instance and options.
 * @param {Array} tasks - Array of tasks to use for suggestions.
 */
function initializeREPL() {
    var installedPackages = [];
    if(ncqService) installedPackages = Array.from(ncqService.state.installedPackageNames);
    var history;
    if(ncqService){
        history = new Store({ path: ncqService.state.HISTORY_DIR});
    }

    logger.warn(
        "Initialized REPL with packages " +
      installedPackages
    );
    var tasks = []; //ncqService.state.data.getTaskArray();

    //create input stream
    var pReadable = new PromptReadable({
        choices: tasks.slice(0, 10000).sort(),
        prefix: NAME,
        message:
      "[" + installedPackages.join(" ") + "]",
        footer: footer,
        multiline: true,
        scroll: true,
        history: {
            store: history,
            autosave: true,
        },
        show: !silent,
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

    return options;
}

function defineCommands() {
    if (!replExit) replExit = replInstance.commands["exit"];

    replInstance.defineCommand("exit", {
        help: "Exit the repl",
        action: function () {
            //call regular close
            replExit.action.call(replInstance);
            //dont exit process because this is dumb and stops repl exit event and tests
            //instead just stop reading from the prompt readable
            replInstance.input.destroy();
        },
    });

    replInstance.defineCommand("editor", {
        help: "Enter editor mode",
        action: editor,
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

    //search commands
    if (!OPTS.searchless) {
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
    }
}

// /**
//  * Replacement evaluation function that allows us to do things before or after the default eval.
//  * We grab the default eval when we create a repl.
//  */
// function eval(code, context, file, cb) {

//   //playing with this but i think i need to fix how we prompt (not using a readable but overwrite displayprompt)
//   //display prompt is just the text, it looks like u need to do it our way
//   //made pause function set a value in the readable stream that makes read()s not open a new prompt
//   //that way we can do async stuff like here, now we can prompt without getting a second prompt
//   var ast = ncqService.state.parser.parse(code);
//   if (ast) {
//     var requires = codeAnalysis.getRequireStatements(ast);
//     if (requires.length > 0) {
//       console.log(
//         "Would you like to install the packages " + requires.join(", ") + "?"
//       );
//       const { Confirm } = require("enquirer");
//       const prompt = new Confirm({
//         name: "question",
//         message: "Install?",
//       });
//       this.input.pause();
//       prompt
//         .run()
//         .then((answer) => {
//           console.log("Answer:", answer);
//           this.input.resume();
//           replEval(code, context, file, cb);
//         })
//         .catch(console.error);
//     }

//     return;
//   }

//   replEval(code, context, file, cb);
// }

/**
 * Lists top 50 packages for a given task. By default prints from 0.
 */
function packages(string) {
    var parts = string.split(",");
    var task = parts[0];
    var index;
    if (parts[1]) {
        index = parseInt(parts[1]);
    }
    if (!index) index = 0;

    var packages = ncqService.packagesByTask(task);
    //no packages
    if (!packages || packages.length < 1) {
        console.log("No packages found!");
        return;
    }

    //format header
    var header = [
        { value: "index", width: 11, align: "left" },
        { value: "name", align: "left" },
        { value: "desciption", align: "left" },
        { value: "stars", width: 11, align: "left" },
    ];

    var subset = packages.slice(index, index + 25);

    var rows = [];
    for (var i = 0; i < subset.length; i++) {
        var p = subset[i];
        var name = p.name;
        var description = p.description;
        var stars = 0; //p.stars.toString();
        rows.push([(i + index).toString(), name, description, stars]);
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
        chalk.green(
            "Hint: Use .packages " + task + ", " + (index + 25) + " to see more."
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
    if (!packageName) {
        packages = Array.from(ncqService.state.installedPackageNames);
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

    var snippets = ncqService.snippetsByPackages(packages);
    if (!snippets || snippets.length < 1) {
        console.error(
            NAME + ": could not find any samples for packages " + packages.join(" ")
        );
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
    var snippets = ncqService.snippetsByTask(task);
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
    if (silent) output = undefined;

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
    for (var p of packages) {
        ncqService.state.installedPackageNames.add(p);
    }

    var packageArray = Array.from(ncqService.state.installedPackageNames);

    //update repl
    replInstance.inputStream.setMessage("[" + packageArray.join(" ") + "]");
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
        if (ncqService.state.installedPackageNames.has(packageName)) {
            ncqService.state.installedPackageNames.delete(packageName);
        }
    }

    replInstance.inputStream.setMessage(
        "[" +
      Array.from(ncqService.state.installedPackageNames).join(" ").trim() +
      "]"
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
        ncqService.state.BASE_DIR,
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

exports.initializeState = initializeState;
exports.initializeREPL = initializeREPL;
exports.startREPL = startREPL;
