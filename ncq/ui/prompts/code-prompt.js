const SuggestionPrompt = require("./suggestion-prompt");
const placeholder = require("enquirer/lib/placeholder");
const utils = require("enquirer/lib/utils");
const { to_width, width_of } = require("to-width");
const colors = require("ansi-colors");

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
    if (this.snippets && this.snippets.length > 0) {
      this.doSnippet(0);
      this.snippetIndex = 0;
      this.cursor = this.input.length;
    }
  }

  doSnippet(index){
    var snippet = this.snippets[index];
    var code = snippet.code;
    this.setInput(code.trim());

    this.snippetInfoBar(snippet.packageName);
  }

  /**
   * Format a header with package info. ATM must be 1 line.
   */
  snippetInfoBar(packageName){
    var packageLabel = "package: ";
    //packageLabel = colors.bold(packageLabel);

    var headerString = packageLabel + packageName;

    //make full length
    headerString = to_width(headerString, this.width);
    //colour
    headerString = colors.cyan(headerString);
    //headerString  = colors.bgBlackBright(headerString);

    this.state.header = headerString;
  }

  cycle() {
    //must have snippets
    if (!this.snippets || this.snippets.length < 1) return;

    //cycle array
    this.snippetIndex++;
    if (this.snippetIndex > this.snippets.length - 1) {
      this.snippetIndex = 0;
    }
    //insert
    this.doSnippet(this.snippetIndex);

    //move cursor
    this.cursor = this.input.length;

    //must render before moving cursor
    this.render();
  }

  setInput(input) {
    this.input = input.replace(/\r\n/g, "\n");
  }

  /**
   * Extend handleKeys for cycle.
   */
  async handleKey(input, key) {

    // no choices being displayed
    if (!this.isSuggesting) {
      //if we have snippets
      if (this.snippets && this.snippets.length > 0) {
        //snippet cycle
        var check = this.keys["cycle"];
        if (this.isKey(key, check)) {
          return this.cycle();
        }
      }
    }

    super.handleKey(input, key);
  }
}

module.exports = CodePrompt;
