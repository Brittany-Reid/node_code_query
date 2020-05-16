const stream = require("stream");
const PromptHandler = require("./prompt-handler");
const CodePrompt = require("./prompts/code-prompt");

/**
 * Custom extended Readable that prompts a user for input on read().
 * This is how we send input to the REPL.
 */
class PromptReadable extends stream.Readable {
  constructor(suggestions = [], prefix="NCQ", message ="", snippets = [], options) {
    super(options);
    this.suggestions = suggestions;
    this.prefix = prefix;
    this.message = message;
    this.snippets = snippets;
  }

  setMessage(message = ""){
    this.message = message;
  }

  setSnippets(snippets = []){
    this.snippets = snippets;
  }

  setSuggestions(suggestions = []){
    this.suggestions = suggestions;
  }

  /**
   * Function that creates a new prompt. A new prompt will be made on each read.
   * Overwrite this to use a custom prompt.
   */
  async prompt() {
    this.p = new PromptHandler(CodePrompt, {
      prefix : this.prefix,
      message : this.message,
      snippets : this.snippets,
      multiline : true,
      choices : this.suggestions,
      initial : "",
    });
    //reset snippets for next prompt
    this.snippets = [];
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
