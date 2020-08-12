const { getConfig, getFunctionKeys } = require("../config");
const utils = require("../utils");

const { to_width, width_of } = require("to-width");
const chalkPipe = require("chalk-pipe");
const chalk = require("chalk");

var config;
var keys;
var colors;
var functionKeys;
const OPTIONS = utils.options(process.argv);


/**
 * Generates a footer for our prompt, called from prompt so can use this. to access values.
 */
function footer() {
  //get key bindings
  if (!config) {
    config = getConfig();
    keys = config.get("keybindings");
    colors = config.get("colors");
    functionKeys = getFunctionKeys();
  }

  var content = [];

  //set commands for footer
  //i want an empty array so we can leave elements empty by default
  var commands = Array(10);
  if (
    this.constructor.name === "SuggestionPrompt" ||
    this.constructor.name === "CodePrompt"
  ) {
    if(!OPTIONS.searchless) commands[0] = "Suggest ";
    if (this.snippets && this.snippets.length > 1) {
      commands[1] = "Previous ";
      commands[2] = "Next ";
    }
    if (this.multiline) {
      commands[3] = "Newline ";
    }
    commands[4] = "Clear ";
    if (this.constructor.name === "CodePrompt") {
      if(!OPTIONS.searchless) commands[0] = "Tasks "; //for now suggest is only tasks
      commands[5] = "Editor ";
    }
    commands[6] = "Copy ";
    commands[7] = "Paste ";
    commands[8] = "Help ";
    commands[9] = "Exit ";
  } else {
    //keep copy and paste, though copy is an entire file copy
    commands[5] = "Delete Line ";
    commands[6] = "Copy All";
    commands[7] = "Paste ";
    commands[8] = "Save & Exit ";
    commands[9] = "Exit Editor ";
  }

  for (var i = 1; i <= commands.length; i++) {
    var key = "F" + i;
    var command = commands[i - 1];
    if (!command) {
      command = " ".repeat(5);
    }
    command = chalkPipe("bg" + colors.contrast + "." + colors.contrastText)(
      command
    );
    content.push(key);
    content.push(command);
  }

  //join
  content = content.join("");

  //get left over width
  var width = this.width - width_of(content);

  //bold all text
  content = chalk.bold(content);

  //add leftover width on end
  if (width >= 1) {
    content += chalkPipe("bg" + colors.contrast)(" ".repeat(width));
  }


  return content;
}

exports.footer = footer;
