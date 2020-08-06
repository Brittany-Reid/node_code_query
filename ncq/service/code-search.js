const DataHandler = require("./data-handler");
const { getLogger } = require("../logger");
const Snippet = require("./snippet");
const State = require("./state");

const Evaluator = require("./evaluator");
const { start } = require("repl");
const ProgressMonitor = require("progress-monitor");
const Package = require("./package");

var logger = getLogger();

/**
 * CodeSearch service interfaces with the repl and data.
 * Consider that the repl is simply an implementation of this tool and that the actual functionality
 * could be implemented with any interface (say, a web app).
 */
class CodeSearch {
  constructor() {

    this.evaluator = new Evaluator();

    //list of installed package names
    this.installedPackages = [];
    this.state = new State();
    this.state.data = new DataHandler();
  }

  /**
   * Setup code search. Loads in files.
   * @param {ProgressMonitor} monitor - Event emitter for progress reporting.
   */
  initialize(monitor) {
    logger.info("Loading data");

    var subMonitor1;
    var subMonitor2;
    var subMonitor3;

    if(monitor){
      monitor.emit("start");
      subMonitor1 = monitor.split(22);
      subMonitor2 = monitor.split(28);
      subMonitor3 = monitor.split(50);
    }

    //load info
    var startTime = process.hrtime.bigint();
    this.state.data.loadPackages(this.state.INFO_DIR, this.state.INFO_DB, subMonitor2);
    var endTime = process.hrtime.bigint();
    logger.info("Info took: " + (endTime - startTime));


    startTime = process.hrtime.bigint();
    this.state.data.loadSnippets(this.state.SNIPPET_DIR, this.state.SNIPPET_DB, subMonitor3);
    endTime = process.hrtime.bigint();
    logger.info("Snippets took: " + (endTime - startTime));

    startTime = process.hrtime.bigint();
    //load tasks
    this.state.data.loadTasks(this.state.TASK_DIR, subMonitor1);
    endTime = process.hrtime.bigint();
    logger.info("Tasks took: " + (endTime - startTime));

    if(monitor) monitor.emit("end");
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
    var snippets = this.state.data.taskToSnippets(task);



    //sort snippets
    snippets = snippets.sort(Snippet.sort);

    //linting! im not sorting by this atm but it does work!
    //snippets = this.evaluator.errors(snippets);

    //preference installed
    snippets = snippets.sort(
      this.preferInstalled(Array.from(this.state.installedPackageNames))
    );

    return snippets;
  }

  /**
   * Returns a set of snippets belonging the given packages.
   * @param {Array} packageNames - Package names to search with.
   */
  snippetsByPackages(packageNames) {
    var snippets = [];
    for(var p of packageNames){
      var current = this.state.data.packageToSnippets(p);
      if(current) snippets = snippets.concat(current);
    }
    return snippets;
  }

  /**
   * Returns a set of packages based on the given task.
   */
  packagesByTask(task) {
      task = task.trim();
      var packages = this.state.data.taskToPackages(task);

      //sort
      packages = packages.sort(Package.sort);

      return packages;
  }
}

module.exports = CodeSearch;
