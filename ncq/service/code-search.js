const DataHandler = require("./data-handler");
const { getLogger } = require("../logger");
const Snippet = require("./snippet");
const State = require("./state");

var { EventEmitter } = require("events");
const { start } = require("repl");

var logger = getLogger();

/**
 * CodeSearch service interfaces with the repl and data.
 * Consider that the repl is simply an implementation of this tool and that the actual functionality
 * could be implemented with any interface (say, a web app).
 */
class CodeSearch {
  constructor() {
    //list of installed package names
    this.installedPackages = [];
    this.state = new State();
    this.state.data = new DataHandler();
  }

  /**
   * Setup code search. Loads in files.
   * @param {EventEmitter} progress - Event emitter for progress reporting.
   */
  initialize(progress) {
    logger.info("Loading data");

    progress.emit("NCQStartEvent");

    var startTime = process.hrtime.bigint();
    //load tasks
    this.state.data.loadTasks(this.state.TASK_DIR);
    var endTime = process.hrtime.bigint();
    logger.info("Tasks took: " + (endTime - startTime));

    progress.emit("NCQUpdateEvent", 16);

    //load info
    startTime = process.hrtime.bigint();
    this.state.data.loadInfo(this.state.INFO_DIR);
    endTime = process.hrtime.bigint();
    logger.info("Info took: " + (endTime - startTime));

    progress.emit("NCQUpdateEvent", 11);

    //load snippets
    var emitter = new EventEmitter();
    var tick = 0;
    emitter.on("progress", function(){
        tick++;
        progress.emit("NCQUpdateEvent", 7);
    })


    startTime = process.hrtime.bigint();
    this.state.data.loadSnippets(this.state.SNIPPET_DIR, emitter);
    endTime = process.hrtime.bigint();
    logger.info("Snippets took: " + (endTime - startTime));

    progress.emit("NCQStopEvent");
  }

  /**
   * Function generaor for a sort comparator that ranks installed packages above non-installed packages.
   * We use a function generator so we can have an argument, we don't have access to `this` scope in sort.
   * @param {Array} installedPackages - Array of package name strings.
   */
  preferInstalled(installedPackages) {
    /**
     * @param {Snippet} a - First element
     * @param {Snippet} b - Second element
     */
    return function (a, b) {
      if (
        installedPackages.includes(a.packageName) &&
        !installedPackages.includes(b.packageName)
      ) {
        return -1;
      }
      if (
        !installedPackages.includes(a.packageName) &&
        installedPackages.includes(b.packageName)
      ) {
        return 1;
      }
      //sort is stable so values maintain original order, by rank
      return 0;
    };
  }

  /**
   * Returns a set of snippets based on the given task.
   * @param {String} task - Task to search with.
   */
  snippetsByTask(task) {
    task = task.trim();
    var snippets = this.state.data.getSnippetsFor(task);

    //sort snippets
    snippets = snippets.sort(Snippet.sort);

    //preference installed
    snippets = snippets.sort(
      this.preferInstalled(this.state.installedPackageNames)
    );

    return snippets;
  }

  /**
   * Returns a set of snippets belonging the given package.
   * @param {String} packageName - Package name to search with.
   */
  snippetsByPackage(packageName) {
    packageName = packageName.trim();
    var snippets = this.state.data.getPackageSnippets(packageName);
    return snippets;
  }

  /**
   * Returns a set of packages based on the given task.
   */
  packagesByTask(task) {
      task = task.trim();
      var packages = this.state.data.getPackages(task);
      return packages;
  }
}

module.exports = CodeSearch;
