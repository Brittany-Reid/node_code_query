const Store = require("data-store");
const { to_width, width_of } = require("to-width");
const chalk = require("chalk");

/**
 * Handles constructing a new prompt.
 * Stores initialized choices between prompt objects in memory for us.
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
    this.handleOptions(options);
  }

  async run() {

    //load with no choices if we have them in memory
    if(this.choices){
      this.options.choices = [];
    }

    this.prompt = new this.promptClass(this.options);

    //on run
    this.prompt.once("run", async () => {
      //store formatted choices in memory
      if(!this.choices){
        this.choices = this.prompt.choices;
      }
      //if we have them already, set all values to loaded
      else{
        this.prompt.options.choices = this.choices;
        this.prompt.state._choices = this.choices;
        this.prompt.choices = this.choices;
        this.prompt.state.choices = this.choices;
      }

      //allow us to send input for testing
      this.input();
    });
    //handle cancelling the prompt using ctrl+c
    this.prompt.on('cancel', () => {
      process.exit();
    });

    //run and return result
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
