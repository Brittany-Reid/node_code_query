const SuggestionPrompt = require("./suggestion-prompt");
const placeholder = require("enquirer/lib/placeholder");
const utils = require('enquirer/lib/utils');
const { to_width, width_of } = require("to-width");

/**
 * Extension of Suggestion Prompt for use in the REPL.
 * Allows code snippets to be cycled.
 */
class CodePrompt extends SuggestionPrompt {
  constructor(options) {
    super(options);
    this.snippets = this.options.snippets;
    this.snippetIndex = -1;
    // this.initial = this.options.initial;
    this.cursor = this.input.length;
    //set initial
    if(this.snippets && this.snippets.length > 0){
      this.setInput(this.snippets[0].trim());
      this.snippetIndex = 0;
      this.cursor = this.input.length;
    }
  }

  cycle() {
    //must have snippets
    if (!this.snippets || this.snippets.length < 1) return;

    //cycle array
    this.snippetIndex++;
    if (this.snippetIndex > this.snippets.length-1) {
      this.snippetIndex = 0;
    }
    //insert
    this.setInput(this.snippets[this.snippetIndex].trim());

    //move cursor
    this.cursor = this.input.length;
    
    //must render before moving cursor
    this.render();
  }

  setInput(input){
    this.input = input.replace(/\r\n/g, "\n");
  }

  keypress(input, key = {}) {
    // no choices being displayed
    if (!this.isSuggesting) {
      //if we have snippets
      if(this.snippets && this.snippets.length > 0){
        //snippet cycle
        var check = this.keys["cycle"];
        if (this.isKey(key, check)) {
          return this.cycle();
        }
      }
    }
    return super.keypress(input, key);
  }

}

module.exports = CodePrompt;
