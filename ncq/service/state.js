const {getConfig} = require("../config");
const utils = require("../utils");

const path = require("path");

var config = getConfig();

/**
 * Maintains state of the application.
 */
class State {
  constructor() {
    this.BASE_DIR = utils.getBaseDirectory();
    this.SNIPPET_DIR = path.join(this.BASE_DIR, config.get("files.snippets"));
    this.SNIPPET_DB = path.join(this.BASE_DIR, config.get("files.snippetDB"));
    this.INFO_DIR = path.join(this.BASE_DIR, config.get("files.info"));
    this.INFO_DB = path.join(this.BASE_DIR, config.get("files.packageDB"));
    this.TASK_DIR = path.join(this.BASE_DIR, config.get("files.tasks"));
    this.HISTORY_DIR = path.join(this.BASE_DIR, config.get("files.replHistory"));

    //array of installed packages by name
    this.installedPackageNames = new Set();
    //data handler object
    this.data = undefined;
  }
}

module.exports = State;
