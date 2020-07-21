const utils = require("../utils");

const path = require("path");

/**
 * Maintains state of the application.
 */
class State {
  constructor() {
    this.BASE_DIR = utils.getBaseDirectory();
    this.SNIPPET_DIR = path.join(this.BASE_DIR, "data/snippets.json");
    this.INFO_DIR = path.join(this.BASE_DIR, "data/packageStats.json");
    this.TASK_DIR = path.join(this.BASE_DIR, "data/id,tasks.txt");
    this.HISTORY_DIR = path.join(this.BASE_DIR, "history-repl.json");

    //array of installed packages by name
    this.installedPackageNames = [];
    //data handler object
    this.data = undefined;
  }
}

module.exports = State;
