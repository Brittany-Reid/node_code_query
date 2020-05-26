const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const winston = require("winston");
const SuggestionPrompt = require("./ui/prompts/suggestion-prompt");
const PromptHandler = require("./ui/prompt-handler");
const NcqCmd = require("./ncq-cmd");
const DataHandler = require("./data-handler");
const utils = require("./utils");

const OPTIONS = utils.options(process.argv);
const BASE = utils.getBaseDirectory();
const SNIPPETDIR = path.join(BASE, "data/snippets");
const LOGDIR = path.join(BASE, "logs/main");
var data = new DataHandler();
var packages = [];
var logger;

/**
 * Main file. Main function will only run if we run this as main.
 */
if (require.main == module) {
  main();
}

/**
 * Setup logger.
 */
async function setupLogger() {
  logger = winston.createLogger();

  //create default silent logger
  logger.add(
    new winston.transports.Console({
      name: "console.info",
      format: winston.format.simple(),
      silent: true,
    })
  );

  //if --log is set as arg
  if (OPTIONS.log == true) {
    if (fs.existsSync(LOGDIR)) {
      //make dir if it doesnt exist
      fse.mkdirSync(LOGDIR, { recursive: true });
    }

    //debug for debugging
    logger.add(
      new winston.transports.File({
        filename: path.join(
          LOGDIR,
          "/debug" + Math.floor(Date.now() / 1000) + ".log"
        ),
        level: "debug",
      })
    );

    //info for results
    logger.add(
      new winston.transports.File({
        filename: path.join(
          LOGDIR,
          "/run" + Math.floor(Date.now() / 1000) + ".log"
        ),
        level: "info",
      })
    );
  }

  logger.log("debug", "Base directory: " + BASE);
  logger.log("debug", "Logger initialized at: " + LOGDIR);
}

/**
 * Main function.
 */
async function main() {
  await setupLogger();
  packages = await data.loadPackges(SNIPPETDIR);

  var myPrompt = new PromptHandler(SuggestionPrompt);

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

  commands = utils.generateChoices(commands, "command");
  var packagesChoices = utils.generateChoices(packages, "package");

  var choices = commands.concat(packagesChoices).sort(function (a, b) {
    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    // names must be equal
    return 0;
  });

  myPrompt.options.choiceFilter = function(input, choices){
    //filter by context, what command
    if(input.substring(0, this.cursor).endsWith("repl(\"")){
      choices = choices.filter(function(choice){
        if(choice.type === "package"){
          return true;
        }
      })
    }
    //no command
    else{
      choices = choices.filter(function(choice){
        if(choice.type === "command"){
          return true;
        }
      })
    }
    return choices;
  }

  myPrompt.options.choices = choices.slice();
  cmd.run();
}

//export logger and BASE directory
exports.logger = logger;
exports.BASE = BASE;
