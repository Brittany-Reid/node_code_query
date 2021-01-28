const SuggestionPrompt = require("../ui/prompts/suggestion-prompt");
const PromptHandler = require("../ui/prompt-handler");
const NcqCmd = require("./ncq-cmd");
const utils = require("../utils");
const { footer } = require("../ui/footer");

/**
 * NCQ Command Line Interface.
 */
class CLI {
  /**
   * Initialize Command Line Interface.
   */
  constructor() {
    //set up enquirer prompt handler
    this.prompt = new PromptHandler(SuggestionPrompt, { footer: footer });

    //set up command service
    this.cmd = new NcqCmd(this.prompt);

    //get commands for suggestions
    var commands = Array.from(this.cmd.getnames());

    //functions starting with do only
    
    const doPrefix = "do_";
    const emptyStr = "";

    commands = commands.filter(function (value) {
      if (value.startsWith(doPrefix)) {
        return true;
      }
    });

    //get actual commands from function names
    commands.forEach((element, index) => {
      element = element.replace(doPrefix, emptyStr);
      commands[index] = element;
    });

    this.prompt.options.choices = commands.slice();
  }

  run() {
      this.cmd.run();
  }
}

module.exports = CLI;
