const {getConfig} = require("../config");
const utils = require("../utils");
const LinterHandler = require("./linter-handler");

const path = require("path");
const Parser = require("./parser");

var config = getConfig();

/**
 * Maintains state of the application.
 */
class State {
    constructor() {
        this.BASE_DIR = utils.getBaseDirectory();
        this.TASK_DIR = path.join(this.BASE_DIR, config.get("files.tasks"));
        this.HISTORY_DIR = path.join(this.BASE_DIR, config.get("files.replHistory"));

        //maintain global parsers and linters for code analysis
        this.parser = new Parser();
        this.linter = new LinterHandler();

        //array of installed packages by name
        this.installedPackageNames = new Set();
        //data handler object
        this.data = undefined;
    }
}

module.exports = State;
