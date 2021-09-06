/** 
 * @fileoverview Common functionality between repl, cli etc.
 */

const path = require("path");

const root = "node_code_query";
const cliHistoryPath = "history.json";
const replHistoryPath = "replHistory.json";


/**
 * 
 * @returns 
 */
function getBaseDirectory() {
    var base = __dirname;
    //fall back if we run from node_code_query/ncq
    if (
        path.dirname(base) != root &&
    path.dirname(base) != root + "/"
    ) {
        base = path.join(base, "../");
    }
    base = path.resolve(base);
    return base;
}

module.exports = {
    getBaseDirectory,
    cliHistoryPath,
    replHistoryPath
};