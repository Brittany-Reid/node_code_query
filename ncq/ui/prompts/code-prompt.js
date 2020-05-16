const SuggestionPrompt = require("./suggestion-prompt");
const placeholder = require("enquirer/lib/placeholder");
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
    this.initial = this.options.initial;
    this.cursor = this.input.length;
    //set initial
    if(this.snippets && this.snippets.length > 0){
      this.input = this.snippets[0];
      this.snippetIndex = 0;
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
    this.input = this.snippets[this.snippetIndex].trim();

    //must render before moving cursor
    this.render();

    //move cursor
    this.cursor = this.input.length;
    
  }

  /**
   * Extend add indent to calculate for multiline.
   */
  addIndent(msg) {
    var before = "";
    var lines = this.input.split("\n");
    //not multiline
    if (lines.length < 2 || this.suggestionStart <= lines[0].length) {
      before =
        this.state.prompt + this.input.substring(0, this.suggestionStart);
    }
    //has multiline
    else {
      //for each line, subtract from total
      var lineStart = this.suggestionStart;
      for (let i = 0; i < lines.length; i++) {
        var current = lineStart - lines[i].length - 1;
        if (current < 0) {
          break;
        }
        lineStart = current;
      }
      before = this.input.substring(0, lineStart);
    }

    if (before.length < 2) return msg;

    var indent = width_of(before);
    msg = to_width(" ", indent) + msg;
    return msg;
  }

  async format(input = this.value) {
    if (!this.isSuggesting) {
      let initial = await this.resolve(this.initial, this.state);
      if (!this.state.submitted) {
        return placeholder(this, { input, initial, pos: this.cursor });
      }
      return this.styles.submitted(input || initial);
    }
    return super.format(input);
  }
  

  async keypress(input, key = {}) {
    //no choices being displayed
    if (!this.isSuggesting) {
      //if we have snippets
      if(this.snippets && this.snippets.length > 0){
        //snippet cycle
        if (key.raw === "`") {
          return this.cycle();
        }
      }
      let prev = this.state.prevKeypress;
      this.state.prevKeypress = key;
      if (this.options.multiline === true && key.name === "return") {
        if (!prev || prev.name !== "return") {
          return this.append("\n", key);
        }
      }
      return super.keypress(input, key);
    }
    return super.keypress(input, key);
  }

  /**
   * Returns the current line and position on that line.
   */
  getCurrentLine(){
    var lines = this.input.split("\n");
    if(lines.length < 2) return [0, this.cursor];

    var current = this.cursor;
    var index = 0;
    for (let i = 0; i < lines.length; i++) {
      var l = lines[i].length + 1;
      current = current - l;
      if(current < 0){
        //set current back
        current = current + l;
        break;
      }
      index++;
    }

    return [index, current];
  }

  scrollUp(i = 0) {
    if(this.isSuggesting){
      return super.scrollUp(i);
    }
    if(this.cursor < 1) return;

    //get line and pos on line
    var currentLine = this.getCurrentLine();
    var index = currentLine[0];
    var current = currentLine[1];
    if(index < 1) return;

    //calculate new cursor, one above
    var lines = this.input.split("\n");
    var ncursor = 0;
    for (let i = 0; i < index; i++) {
      var l = lines[i].length + 1;
      if(i != index-1){
        ncursor = ncursor + l;
      }
      else{
        ncursor += Math.min(current, l-1);
      }
    }

    this.cursor = ncursor;
    this.render();
  }

  scrollDown(i = 0) {
    if(this.isSuggesting){
      return super.scrollDown(i);
    }

    if(this.cursor >= this.input.length) return;

    //get line and pos on line
    var lines = this.input.split("\n");
    var currentLine = this.getCurrentLine();
    var index = currentLine[0];
    var current = currentLine[1];
    if(index >= lines.length-1) return;

    //calculate new cursor, line below
    var ncursor = 0;
    for (let i = 0; i < index+2; i++) {
      var l = lines[i].length + 1;
      if(i == index+1){
        ncursor += Math.min(current, l-1);
      }
      else{
        ncursor += l;
      }
    }

    this.cursor = ncursor;
    this.render();
  }
}

module.exports = CodePrompt;
