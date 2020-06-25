const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const winston = require("winston");
const SuggestionPrompt = require("./ui/prompts/suggestion-prompt");
const PromptHandler = require("./ui/prompt-handler");
const NcqCmd = require("./ncq-cmd");
const DataHandler = require("./data-handler");
const utils = require("./utils");
const {getLogger} = require("./logger");
const {footer} = require("./ui/footer");

const OPTIONS = utils.options(process.argv);
const BASE = utils.getBaseDirectory();
const SNIPPETDIR = path.join(BASE, "data/snippets");
var data = new DataHandler();
var packages = [];
var logger;


/**
 * Main function.
 */
async function main() {
  logger = getLogger();
  packages = await data.loadPackges(SNIPPETDIR);

  var myPrompt = new PromptHandler(SuggestionPrompt, {footer: footer});

  var cmd = new NcqCmd(myPrompt, packages);
  var commands = Array.from(cmd.getnames());
  commands = commands.filter(function (value) {
    if (value.startsWith("do_")) {
      return true;
    }
  });

  commands.forEach((element, index) => {
    if (element.startsWith("do_")) {
      element = element.replace("do_", "");
    }

    commands[index] = element;
  });

  var choices = commands;

  myPrompt.options.choices = choices.slice();
  cmd.run();
}

/**
 * Main file. Main function will only run if we run this as main.
 */
if (require.main == module) {
  main();
}