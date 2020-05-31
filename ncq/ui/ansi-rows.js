
const wrapAnsi = require("wrap-ansi");
const stripAnsi = require("strip-ansi");

/**
 * Function to format a string given a number of rows and column.
 * Returns an object containing the array of all lines, formatted output and currently printing char range.
 * @param {*} string The string to format.
 * @param {*} rows Number of rows to restrict to
 * @param {*} columns Number of columns to restrict to
 * @param {*} start 0-indexed row to start at
 */
function ansiRows(string, rows, columns, start, options = {}){
    var lines = [];
    var output = "";
    var startCh = 0;
    var endCh = 0;

    lines = getLines(string, columns, options);

    output = lines.slice(start, start+rows).join("\n");
    startCh = stripAnsi(lines.slice(0, start).join("\n")).length;
    endCh = startCh+stripAnsi(output).length;


    return {lines, output, startCh, endCh};
}

/**
 * Function to get a set of lines given a max column size.
*/
function getLines(string, columns, options = {hard: true, trim: false, wordwrap : false}){
    var wrapped = wrapAnsi(string, columns, options);
    var lines = wrapped.split("\n");
    return lines;
  }

exports.getLines = getLines;
exports.ansiRows = ansiRows;