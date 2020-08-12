const PromptHandler = require("./prompt-handler");
const CodePrompt = require("./prompts/code-prompt");

const stream = require("stream");

/**
 * Custom extended Readable that prompts a user for input on read().
 * This is how we send input to the REPL.
 * Can be paused - doesn't hold back flow in a buffer
 * But allows us to do async things without a prompt interrupting until we're done.
 */
class PromptReadable extends stream.Readable {
  constructor(pOptions = {}, options) {
    super(options);
    this.pOptions = pOptions;
    this.p = new PromptHandler(CodePrompt, this.pOptions);
    this.paused = false;
  }

  setMessage(message = "") {
    this.pOptions.message = message;
  }

  setSnippets(snippets = []) {
    this.pOptions.snippets = snippets;
  }

  setSuggestions(suggestions = []) {
    this.pOptions.choices = suggestions;
  }

  pause() {
    super.pause();
    this.paused = true;
  }

  resume() {
    super.resume();
    this.paused = false;
  }

  /**
   * Function that creates a new prompt, runs and returns the result.
   */
  async prompt() {
    //update options
    this.p.handleOptions(this.pOptions);

    //do prompt
    var response = await this.p.run();

    //reset single prompt options
    this.pOptions.snippets = [];

    return response;
  }

  /**
   * Overwrite the read function to prompt for input.
   */
  _read(size) {
    if (this.paused) {
      this.push("");
      return;
    }
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
