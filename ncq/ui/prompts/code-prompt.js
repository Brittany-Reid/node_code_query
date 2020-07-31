const SuggestionPrompt = require("./suggestion-prompt");
const placeholder = require("enquirer/lib/placeholder");
const utils = require("enquirer/lib/utils");
const { to_width, width_of } = require("to-width");
const colors = require("ansi-colors");
const chalkPipe = require("chalk-pipe");

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
      this.snippetIndex = 0;
      this.doSnippet(0);
      this.cursor = this.input.length;
    }
  }

  doSnippet(index) {
    var snippet = this.snippets[index];
    var code = snippet.code;
    this.setInput(code.trim());

    this.snippetInfoBar(snippet.packageName, snippet.rank());
  }

  /**
   * Format a header with package info. ATM must be 1 line.
   */
  snippetInfoBar(packageName, rank) {
    var packageLabel = "package: ";

    var headerString = packageLabel + packageName;

    headerString += ", " + "rank: " + rank;

    headerString += ", " + (this.snippetIndex+1) + "/" + this.snippets.length;

    //make full length
    headerString = to_width(headerString, this.width);
    //colour
    headerString = chalkPipe(this.colors.contrast)(headerString);

    this.state.header = headerString;
  }

  /**
   * Extend clear input to clear header too.
   */
  clearInput() {
    this.state.header = "";
    super.clearInput();
  }

  cycle(i = 1) {
    //must have snippets
    if (!this.snippets || this.snippets.length < 1) return;

    //cycle array
    this.snippetIndex += i;
    if (this.snippetIndex > (this.snippets.length - 1)) {
      this.snippetIndex = 0;
    }
    if(this.snippetIndex < 0){
      this.snippetIndex = this.snippets.length-1;
    }
    //insert
    this.doSnippet(this.snippetIndex);

    //move cursor
    this.cursor = this.input.length;

    //must render before moving cursor
    this.render();
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
          return this.cycle(1);
        }

        var check = this.keys["cyclePrev"];
        if (this.isKey(key, check)) {
          return this.cycle(-1);
        }
      }

      //open editor
      var check = this.keys["editor"];
      if (this.isKey(key, check)) {
        this.input = ".editor";
        return this.submit();
      }

      //newline
      if (this.multiline) {
        var check = this.keys["newLine"];
        if (this.isKey(key, check)) {
          return this.append("\n");
        }
      }
    }

    super.handleKey(input, key);
  }
}

module.exports = CodePrompt;
