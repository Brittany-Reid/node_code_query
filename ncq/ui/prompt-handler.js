const Store = require("data-store");
const actions = require("enquirer/lib/combos");
const custom = { tab: "tab" };
const { to_width, width_of } = require("to-width");
const chalk = require("chalk");
actions.keys = { ...actions.keys, ...custom };

/**
 * Handles constructing a new prompt.
 */
class PromptHandler {
  /**
   * Construct PromptHandler object that creates prompt of type promptClass, using defined options.
   * Optional function for input that will be called on run.
   * @param {*} promptClass Class object to construct on run.
   * @param {*} options Object with options passed to prompt.
   * @param {*} input Optional function for input that will be called on run.
   */
  constructor(promptClass, options = {}) {
    this.promptClass = promptClass;
    this.input = function () {};
    this.terminalWidth = process.stdout.columns || defaultColumns;
    process.stdout.on("resize", () => {
        this.terminalWidth = process.stdout.columns || defaultColumns;
    });
    this.handleOptions(options);
  }

  async run() {
    this.prompt = new this.promptClass(this.options);
    this.prompt.once("run", async () => {
      this.input();
    });
    return await this.prompt.run();
  }

  handleOptions(options) {
    //set defaults
    this.options = {
      name: "",
      prefix: "NCQ",
      message: "",
      separator: "> ",
      limit: 4,
      initial: "",
      choices: [],
      inputNoChoice: true,
      history: {
        store: new Store({ path: `${process.cwd()}/history.json` }),
        autosave: true,
      },
    };

    //overwrite with given options
    for (let key of Object.keys(options)) {
      this.options[key] = options[key];
    }
  }
}

module.exports = PromptHandler;
