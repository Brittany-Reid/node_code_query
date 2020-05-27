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
    this.initial = this.options.initial;
    this.cursor = this.input.length;
    //set initial
    if(this.snippets && this.snippets.length > 0){
      this.input = this.snippets[0].trim();
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
    this.input = this.snippets[this.snippetIndex].trim();

    //must render before moving cursor
    this.render();

    //move cursor
    this.cursor = this.input.length;
    
  }

  getIndent() {
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
    return indent;
  }

  /**
   * Intercept placeholder to make sure cursor can invert newline chars.
   */
  placeholder(prompt, options){
    this.cursorHide();
    let { input = '', initial = '', pos, showCursor = true, color } = options;
    let style = color || prompt.styles.placeholder;
    let inverse = utils.inverse(prompt.styles.primary);
    let blinker = str => inverse(prompt.styles.black(str));
    let output = input;

    if (pos !== input.length && showCursor === true) {
      var c = blinker(input[pos]);
      if(input[pos] == "\n"){
        c = blinker(" ")+"\n";
      }
      output = input.slice(0, pos) + c + input.slice(pos + 1);
      let cursor = '';
      return output + cursor;
    }

    return placeholder(this, { input, initial, pos: this.cursor });
  }

  async format(input = this.value) {
    input = super.format(input);
    // if (!this.isSuggesting) {
      let initial = await this.resolve(this.initial, this.state);
      if (!this.state.submitted || !this.state.cancelled) {
        return this.placeholder(this, { input, initial, pos: this.cursor });
      }
    // }
    return super.format(input);
  }
  

  async keypress(input, key = {}) {
    //no choices being displayed
    if (!this.isSuggesting) {
      //if we have snippets
      if(this.snippets && this.snippets.length > 0){
        //snippet cycle with alt+1
        if (key.meta && key.name == "1") {
          return this.cycle();
        }
      }

      //newline, alt enter
      if(key.sequence == "\u001b\r"){
        return this.append("\n", key);
      }

      //ctrl+down and ctrl+up
      if(key.ctrl && key.name == "up"){
        return this.lineUp();
      }
      if(key.ctrl && key.name == "down"){
        return this.lineDown();
      }
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

  lineUp() {
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

  lineDown() {

    //allow make new line
    if(this.cursor >= this.input.length){
      return this.append("\n");
    }

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
