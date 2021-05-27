const DataHandler = require("./data-handler");
const { getLogger } = require("../logger");
const State = require("./state");

const Evaluator = require("./evaluator");
const ProgressMonitor = require("progress-monitor"); /* eslint-disable-line */
const Package = require("./package");

var logger;

/**
 * NCQ service interfaces with the repl and data.
 * Consider that the repl is simply an implementation of this tool and that the actual functionality
 * could be implemented with any interface (say, a web app).
 */
class NCQ {
    constructor({
        recordLimit = false
    } = {}) {
        this.recordLimit = recordLimit,
        this.evaluator = new Evaluator();

        //list of installed package names
        this.installedPackages = [];
        this.state = new State();
        this.state.data = new DataHandler({recordLimit:this.recordLimit});

        if(!logger) logger = getLogger();
    }

    /**
   * Setup code search. Loads in files.
   * @param {ProgressMonitor} monitor - Event emitter for progress reporting.
   */
    async initialize(monitor) {
        logger.info("Loading data");

        //load info
        var startTime = process.hrtime.bigint();
        await this.state.data.loadDatabase(monitor);
        var endTime = process.hrtime.bigint();
        logger.info("Data took: " + (endTime - startTime));
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
        return;
        // task = task.trim();
        // var snippets = this.state.data.taskToSnippets(task);

        // //sort snippets
        // snippets = snippets.sort(Snippet.sort);

        // //linting! im not sorting by this atm but it does work!
        // //snippets = this.evaluator.errors(snippets);

        // //preference installed
        // snippets = snippets.sort(
        //     this.preferInstalled(Array.from(this.state.installedPackageNames))
        // );

        // return snippets;
    }

    /**
   * Returns a set of snippets belonging the given packages.
   * @param {Array} packageNames - Package names to search with.
   */
    snippetsByPackages(packageNames) {
        var snippets = [];
        for(var p of packageNames){
            var current = this.state.data.getSnippetsForPackage(p);
            if(current) snippets = snippets.concat(current);
        }

        snippets = this.evaluator.fix(snippets);

        return snippets;
    }

    /**
   * Returns a set of packages based on the given task.
   */
    packagesByTask(task) {
        task = task.trim();
        var packages = this.state.data.searchPackages(task);

        //sort
        packages = packages.sort(Package.sort);

        return packages;
    }
}

module.exports = NCQ;
