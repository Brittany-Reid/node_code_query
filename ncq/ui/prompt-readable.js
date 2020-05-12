const stream = require("stream");
//const PromptHandler = require("./prompthandlers/prompthandler");
const CodePromptHandler = require("./prompthandlers/codeprompthandler");

/**
 * Custom extended Readable that prompts a user for input on read().
 */
class PromptReadable extends stream.Readable {
  constructor(suggestions = [], prefix="NCQ", message ="", options) {
    super(options);
    this.suggestions = suggestions;
    this.prefix = prefix;
    this.message = message;
  }

  /**
   * Function that creates a new prompt. A new prompt will be made on each read.
   * Overwrite this to use a custom prompt.
   */
  async prompt() {
    this.p = new CodePromptHandler([], this.prefix, this.message);
    //this.p = new Prompt(this.suggestions, this.prefix, this.message);
  }

  /**
   * Overwrite the read function to prompt for input.
   */
  _read(size) {
    //get prompt
    this.prompt().then((response) => {
      //run prompt
      this.p.run().then((answer) => {
        //if below limit, just push
        if (answer.length < size) {
          this.push(answer + "\n");
        }
        //otherwise, split pushes
        else {
          var ok = true;
          var readIndex = 0;
          while (ok) {
            this.push(answer.substr(readIndex, size));
            readIndex += size;

            if (this.readIndex > text.length) {
              ok = false;
            }
          }
        }
      })      
      //catch ctrl + c
      //this will catch other things :( be sure to remove when debugging so you don't miss errors.
      .catch(console.error);
    });
  }
}

module.exports = PromptReadable;
