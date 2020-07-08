const stream = require("stream");
const PromptHandler = require("./prompt-handler");
const CodePrompt = require("./prompts/code-prompt");

/**
 * Custom extended Readable that prompts a user for input on read().
 * This is how we send input to the REPL.
 */
class PromptReadable extends stream.Readable {
  constructor(pOptions = {}, options) {
    super(options);
    this.pOptions = pOptions;
    this.p = new PromptHandler(CodePrompt, this.pOptions);
  }

  setMessage(message = ""){
    this.pOptions.message = message;
  }

  setSnippets(snippets = []){
    this.pOptions.snippets = snippets;
  }

  setSuggestions(suggestions = []){
    this.pOptions.choices = suggestions;
  }

  /**
   * Function that creates a new prompt, runs and returns the result.
   */
  async prompt() {
    var response = await this.p.run();
    return response;
    //reset snippets for next prompt
    //this.snippets = [];
  }

  /**
   * Overwrite the read function to prompt for input.
   */
  _read(size) {
    //run prompt
    this.prompt().then((answer) => {
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
    });
  }
}

module.exports = PromptReadable;
