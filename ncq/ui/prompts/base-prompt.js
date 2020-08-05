const { AutoComplete, Select, Prompt } = require("enquirer");
const { to_width, width_of } = require("to-width");
const chalkPipe = require("chalk-pipe");
const ansi = require("enquirer/lib/ansi");
const stripAnsi = require("strip-ansi");
const wrapAnsi = require("wrap-ansi");
const colors = require("ansi-colors");
const { getConfig } = require("../../config");
const { width } = require("enquirer/lib/utils");
const keypress = require("enquirer/lib/keypress");
const utils = require("enquirer/lib/utils");
const { getLogger } = require("../../logger");
const clipboardy = require('clipboardy');

var logger = getLogger();

/**
 * Extended Enquirer AutoComplete.
 *
 * This is the base class for any major under the hood tweaks, like rendering.
 * The idea is to keep the other two prompt files simple.
 *
 * Changes:
 * - Can enter custom input.
 * - Can toggle autocomplete
 * - Can enter empty
 * - Fix bugs
 * - Can pass no choice array
 * - Can insert at toggle point and multiple times
 * - Enable Multiline
 */

class BasePrompt extends AutoComplete {
  /**
   * Constructor.
   * Sets up AutoComplete options, then our options.
   */
  constructor(options = {}) {
    super(options);

    //keybindings from config
    this.keys = getConfig().get("keybindings");
    this.colors = getConfig().get("colors");

    //state
    this.isSuggesting = false;
    this.suggestionStart = -1;
    this.filtered = [];
    this.lineBuffer = [];
    this.topLine = 0;

    this.scroll = this.options.scroll;
    this.scrollPos = 0;
    this.keybuffer = [];


    //initial support, as a prefilled input
    if(this.initial){
      this.input = this.initial;
      //reset initial otherwise default behaviour is to use this if no input
      this.initial = undefined;
    }

    //logger.debug("New prompt init");
  }

  /** Extend dispatch to fix this bug https://github.com/enquirer/enquirer/issues/285.
   *  Dispatch is called by super.keypress(), to add characters to the input.
   */
  async dispatch(s, key) {
    //don't print box on ctrl+c
    if (key.raw === "\u0003") {
      return;
    }
    if (s) {
      //await super.dispatch(s, key);
      await this.append(s);
    }
  }

  moveCursor(n) {
    logger.debug("move cursor: " + n);
    this.state.cursor += n;
  }

  async append(ch) {
    logger.debug("append: " + ch);
    let { cursor, input } = this.state;
    this.input = input.slice(0, cursor) + ch + input.slice(cursor);
    this.moveCursor(1);
    await this.complete();
  }

  /**
   * Complete function is called when typing.
   */
  async complete() {
    logger.debug("completing");
    this.completing = true;
    if (this.isSuggesting) {
      this.choices = this.suggest(this.input, this.state._choices);
      this.state.limit = void 0; // allow getter/setter to reset limit
      this.index = Math.min(Math.max(this.visible.length - 1, 0), this.index);
    }
    await this.render();
    this.completing = false;
  }

  scrollDown(i = this.visible.length - 1) {
    if (!this.isSuggesting) return;

    //shift this.choices order, this way is faster than spread and slice in enquirer utils
    var first = this.choices.shift();
    this.choices.push(first);

    this.index = i;
    if (this.isDisabled()) {
      return this.down();
    }
    return this.render();
  }

  scrollUp(i = 0) {
    if (!this.isSuggesting) return;

    //again, don't make a new array using [pop(), ...choices]
    var last = this.choices.pop();
    this.choices.unshift(last);

    this.index = i;
    if (this.isDisabled()) {
      return this.up();
    }
    return this.render();
  }

  /**
   * Reset that allows empty suggestion list.
   */
  reset() {
    if (this.selectable.length === 0) {
      return;
    }
    return super.reset();
  }

  /**
   * Returns true if check is the same as key.
   * Check can now be an array of bindings!
   */
  isKey(key, check) {
    if (!check) return false;
    //check can be an array lets add handling, always treat as array of potential bindings
    if (!Array.isArray(check)) {
      check = [check];
    }
    for (var binding of check) {
      var fields = Object.keys(binding);
      var is = true;
      for (var i = 0; i < fields.length; i++) {
        if (binding[fields[i]] != key[fields[i]]) {
          is = false;
        }
      }
      if (is) break;
    }

    return is;
  }

  /**
   * Extend keypress to handle our keypresses.
   */
  async keypress(input, key = {}) {
    logger.debug("Pressed key: " + JSON.stringify(key) + "\n");

    //intercept for escape, if suggesting
    if(key.name == "escape"){
      if(this.isSuggesting){
        return this.toggle();
      }
    }

    await this.handleKey(input, key);

    //await super.keypress(input, key);
    logger.debug("Done key: " + JSON.stringify(key) + "\n");
  }

  /**
   * The built in key handling is annoying, just do this instead.
   */
  async handleKey(input, key) {
    //autocomplete
    var check = this.keys["autocomplete"];
    if (this.isKey(key, check)) {
      return this.toggle();
    }

    //paste
    var check = this.keys["paste"];
    if (this.isKey(key, check)) {
      return this.paste();
    }

    //copy
    var check = this.keys["copy"];
    if (this.isKey(key, check)) {
      return this.copy();
    }

    if (!this.isSuggesting) {
      //cursor up and cursor down
      var check = this.keys["cursorUp"];
      if (this.isKey(key, check)) {
        return await this.lineUp();
      }

      var check = this.keys["cursorDown"];
      if (this.isKey(key, check)) {
        return await this.lineDown();
      }
    }

    //line end
    var check = this.keys["lineEnd"];
    if (this.isKey(key, check)) {
      return await this.lineEnd();
    }

    //line start
    var check = this.keys["lineStart"];
    if (this.isKey(key, check)) {
      return await this.lineStart();
    }

    //clear
    var check = this.keys["clear"];
    if (this.isKey(key, check)) {
      return this.clearInput();
    }

    //exit
    var check = this.keys["exit"];
    if (this.isKey(key, check)) {
      return this.cancel();
    }

    //deleteline
    if(this.options.multiline){
      var check = this.keys["deleteLine"];
      if (this.isKey(key, check)) {
        return this.deleteLine();
      }
    }

      //delete word
    var check = this.keys["deleteWord"];
    if (this.isKey(key, check)) {
      return this.deleteWord();
    }

    //otherwise,
    this.skeypress(input, key);
  }

  async skeypress(input, event) {
    this.keypressed = true;
    let key = keypress.action(
      input,
      keypress(input, event),
      this.options.actions
    );
    this.state.keypress = key;
    this.emit("keypress", input, key);
    this.emit("state", this.state.clone());
    let fn = this.options[key.action] || this[key.action] || this.dispatch;
    if (typeof fn === "function") {
      return await fn.call(this, input, key);
    }
  }

  deleteLine(){
    //get lines
    var lines = this.input.split("\n");

    //get coords
    var coords = this.getCoords(lines, this.cursor);
    var y = coords[0];
    var x = coords[1];

    var i = this.cursor - x;

    this.cursor = Math.max(this.cursor - (x+1), 0);

    logger.debug([this.input.substring(0, i), this.input.substring(i+lines[y].length)]);

    var start = this.input.substring(0, i);
    var end =  this.input.substring(i+lines[y].length);
    //for lines with a newline cut off the newline
    if(end.startsWith("\n")){
      end = end.substring(1);
    }

    this.input = start + end;

    this.render();
  }

  deleteWord(){
    var before = this.input.substring(0, this.cursor);
    var after = this.input.substring(this.cursor);

    //go through chars
    var type;
    for(var i = before.length-1; i>=0; i--){
      var char = before[i];
      //match type, like vscode! so you can delete function() as [function, ()]
      if(!type){
        if(!char.match(/\s/g)){
          if(char.match(/\w/g)){
            type = "alphanum";
          }
          else{
            type = "other"
          }
        }
      }
      //if we have a type, end on non type
      else{
        
        //whitespace, end
        if(char.match(/\s/g)){
          break;
        }

        //find non alphanum after deleteing alphanum
        if(type === "alphanum" && !char.match(/\w/g)){
          break;
        }

        //find alphanum after deleting non alpha
        if(type === "other" && char.match(/\w/g)){
          break;    
        }

      }

      before = before.substring(0, i);
    }
    this.cursor = before.length;
    this.input = before + after;

    this.render();
  }

  clearInput() {
    this.input = "";
    this.cursor = 0;
    return this.render();
  }

  /**
   * Toggle suggestions.
   */
  async toggle() {
    //if we have no choices, return
    //for some reason this.choices doesnt match this.options right away
    if (!this.options.choices || this.options.choices.length < 1) return;
    //toggle on and record start point
    if (!this.isSuggesting) {
      this.isSuggesting = true;
      this.suggestionStart = this.cursor;
      await this.complete(); //call complete, trigger suggestions
    } else {
      this.isSuggesting = false;
      this.index = -1;
      await this.render();
    }
  }

  /**
   * On Ctrl+left, move to the start of the current line.
   */
  lineStart() {
    if (this.cursor <= 0) return;
    var current = this.cursor;
    var i = current - 1;
    while (i >= 0) {
      var ch = this.input[i];
      if (ch == "\n") {
        break;
      }
      i--;
    }
    this.cursor = i + 1;
    return this.render();
  }

  /**
   * Multiline paste.
   */
  paste() {
    //get from clipboard
    var toPaste;
    try{
      toPaste = clipboardy.readSync();
    } catch(err){
      //you will error if you try to paste a file or image
      return;
    }

    //in case the package ever supports that, just make sure what is being pasted is a string, otherwise cancel
    if(typeof toPaste !== "string") return;

    //format
    toPaste = this.formatForInsert(toPaste);

    //get before and after
    var before = this.input.slice(0, this.cursor);
    var after = this.input.slice(this.cursor);

    //construct new input
    var input = before + toPaste + after;

    //set
    this.setInput(input);

    //get cursor
    this.cursor = (before + toPaste).length;

    this.render();
  }

  //trying to debug why delete sometimes messes up
  delete() {
    let { cursor, input } = this.state;
    logger.debug("DELETE, cursor: " + cursor);
    if (cursor <= 0) return this.alert();
    this.input = `${input}`.slice(0, cursor - 1) + `${input}`.slice(cursor);
    this.moveCursor(-1);
    this.render();
  }

  /**
   * Format a string for insertion, making sure all characters are safe.
   * @param {String} string - String to format
   */
  formatForInsert(string){
    //remove carriage returns
    string = string.replace(/\r\n/g, "\n");

    //remove tabs
    string = string.replace(/\t/g, "  ");
  
    return string;
  }

  /**
   * Set some input within the prompt, formatting it before hand.
   */
  setInput(input) {

    input = this.formatForInsert(input);

    //remove tabs
    this.input = input;
  }

  /**
   * Copy entire input to clipboard.
   */
  copy() {
    logger.debug("copied");
    clipboardy.writeSync(this.input);
  }

  /**
   * On Ctrl+right, move to line end.
   */
  lineEnd() {
    if (this.cursor >= this.input.length) return;
    var i = this.cursor;
    while (i < this.input.length) {
      var ch = this.input[i];
      if (ch == "\n") {
        break;
      }
      i++;
    }
    this.cursor = i;
    return this.render();
  }

  async lineUp() {
    //do nothing if at 0
    if (this.cursor <= 0) return;

    //get lines
    var lines = this.input.split("\n");

    //on first line, cant go up
    if (this.cursor <= lines[0].length) return;

    //get coords
    var coords = this.getCoords(lines, this.cursor);
    var y = coords[0];
    var x = coords[1];

    //go to end of previous line
    this.cursor -= x + 1;
    //go to pos x
    this.cursor -= Math.max(0, lines[y - 1].length - x);

    await this.render();
  }

  async lineDown() {
    //allow make new line
    if (this.cursor >= this.input.length && this.options.multiline)
      return await this.append("\n");

    //get lines
    var lines = this.input.split("\n");

    //on last line, cant go down
    if (this.cursor >= this.input.length - lines[lines.length - 1].length)
      return;

    //get coords
    var coords = this.getCoords(lines, this.cursor);
    var y = coords[0];
    var x = coords[1];

    //go to start of next line
    this.cursor += lines[y].length - x + 1;
    //go to x or nearest on next line
    this.cursor += Math.min(x, lines[y + 1].length);

    await this.render();
  }

  /**
   * Generates filtered list of choices based on input.
   */
  suggest(input, choices) {
    if (!this.isSuggesting) {
      this.filtered = [];
      return this.filtered;
    }

    //no input, just return choices
    if (this.input == "") return choices;

    //if the input hasn't changed since the last call, don't refilter
    if (this.previousInput == this.input) {
      return this.filtered;
    }
    //otherwise store new for checking
    this.previousInput = this.input;

    //get string to use as a substring from when we pressed tab and what we have written now
    let str = input.toLowerCase().substring(this.suggestionStart, this.cursor);

    //actual filtering
    this.filtered = [];
    for (var i = 0; i < choices.length; i++) {
      var ch = choices[i];
      if (ch.message.toLowerCase().startsWith(str)) {
        this.filtered.push(ch);
      }
    }

    // //filter
    // this.filtered = choices
    //   .filter((ch) => !ch._userInput)
    //   .filter((ch) => ch.message.toLowerCase().includes(str));

    //if none, return empty
    if (!this.filtered.length) {
      this.filtered = [];
      return this.filtered;
    }

    return this.filtered;
  }

  /**
   * Custom highlight function
   */
  highlight(input, color) {
    let val = input.toLowerCase().substring(this.suggestionStart, this.cursor);
    return (str) => {
      let s = str.toLowerCase();
      let i = s.indexOf(val);
      let colored = color(str.slice(i, i + val.length));
      return i >= 0
        ? str.slice(0, i) + colored + str.slice(i + val.length)
        : str;
    };
  }

  renderChoice(choice, i) {
    logger.debug("renderChoice");

    let focused = this.index === i;
    let pointer = this.pointer(choice, i);
    let check = this.indicator(choice, i) + (choice.pad || "");
    let hint = this.resolve(choice.hint, this.state, choice, i);

    if (hint && !utils.hasColor(hint)) {
      hint = this.styles.muted(hint);
    }

    let ind = this.indent(choice);
    let msg = this.choiceMessage(choice, i);
    let line = () =>
      [this.margin[3], ind + pointer + check, msg, this.margin[1], hint]
        .filter(Boolean)
        .join(" ");

    if (choice.role === "heading") {
      return line();
    }

    if (choice.disabled) {
      if (!utils.hasColor(msg)) {
        msg = this.styles.disabled(msg);
      }
      return line();
    }

    if (focused) {
      msg = this.styles.em(msg);
    }

    //get style
    let style = this.options.highlight
      ? this.options.highlight.bind(this)
      : this.styles.placeholder;
    let color = this.highlight(this.input, style);

    msg = color(msg);

    return line();
  }

  /**
   * Renders the list of choices.
   */
  renderChoices() {
    logger.debug("renderChoices");

    //if not suggesting, render nothing
    if (!this.isSuggesting) {
      this.visible.push("");
      return "";
    }
    //no matching, render nothing
    if (!this.visible.length) {
      return "";
    }

    if (this.state.loading === "choices") {
      return this.styles.warning("Loading choices");
    }

    if (this.state.submitted) return "";
    let choices = this.visible.map((ch, i) => this.renderChoice(ch, i));
    let visible = choices;
    if (!visible.length)
      visible.push(this.styles.danger("No matching choices"));
    let result = this.margin[0] + visible.join("\n");
    let header;

    if (this.options.choicesHeader) {
      header = this.resolve(this.options.choicesHeader, this.state);
    }
    logger.debug("renderChoicesEnd");
    return [header, result].filter(Boolean).join("\n");
  }

  /**
   * On cancel, format input to be greyed out.
   * On submit, don't print focused suggestion.
   */
  format() {
    logger.debug("format");
    if (this.state.cancelled) return colors.grey(this.value);
    if (this.state.submitted) {
      let value = (this.value = this.input);
      return value;
    }
    return super.format();
  }

  /**
   * Set wrapped = true to handle wrapped lines. This is for compatibility reasons for now.
   */
  getCoords(lines, cursor, wrapped = false) {
    //logger.debug(lines);
    var length = 0;
    var wrapoffset = 0;
    var l = lines.length - 1;
    var x = 0;
    for (let i = 0; i < lines.length; i++) {
      var line = stripAnsi(lines[i]) + "\n";

      x = cursor - length;
      length += line.length;
      if (cursor < length) {
        l = i;
        break;
      }

      // if(wrapped){
      //   if(line.length > this.columns){
      //     length -= 1;
      //   }
      // }
    }
    if (wrapped) {
      x += this.newLineOffset;
    }

    //x += wrapoffset;
    //x = length - cursor;
    logger.debug([l, x]);
    return [l, x];
  }

  scrollBar(lines, visible, top, rows) {
    var scrollArray = [];

    //get shown percentage
    var shown = rows / lines.length;
    //apply to number of rows
    var bar = Math.round(rows * shown);
    //make sure bar is at least visible
    if (bar == 0) bar = 1;
    //get rows from top
    var scrollTop = Math.round(top * shown);

    for (let i = 0; i < rows; i++) {
      if (i >= scrollTop && i < scrollTop + bar) {
        scrollArray.push(colors.inverse(" "));
      } else {
        if (i == 0) {
          scrollArray.push("▲");
        } else if (i == rows - 1) {
          scrollArray.push("▼");
        } else {
          scrollArray.push(" ");
        }
      }
    }

    return scrollArray;
  }

  /**
   * Render lines that fit on the terminal.
   */
  renderLines(header, prompt, body, footer) {
    logger.debug("renderLines");

    //get prompt
    var string = [prompt, body].filter(Boolean).join("\n");

    if (this.state.submitted || this.state.cancelled) {
      return [header, prompt, body, footer].filter(Boolean).join("\n");
    }
    var rows = this.height;
    //leave space for footer
    if (footer) {
      rows = rows - 1;
    }
    if (header) {
      rows = rows - 1;
    }

    this.columns = this.width;
    //space for scroll bar
    if (this.scroll) {
      this.columns -= 1;
    }
    var cursor = this.cursor + width_of(this.state.prompt);

    //get lines
    var wrapped = wrapAnsi(string, this.columns, {
      trim: false,
      wordWrap: false,
      hard: true,
    });

    //number of additional newlines from wrapping before cursor to account for when getting coords
    this.newLineOffset =
      stripAnsi(wrapped).substring(0, cursor).split("\n").length -
      1 -
      (stripAnsi(string).substring(0, cursor).split("\n").length - 1);

    this.lineBuffer = wrapped.split("\n");

    var l = this.getCoords(this.lineBuffer, cursor, true)[0];

    if (l < this.topLine) {
      this.topLine = Math.max(Math.min(l, this.lineBuffer.length - rows), 0);
    } else if (l > this.topLine + rows - 1) {
      this.topLine = Math.min(l, this.lineBuffer.length - rows);
    } else if (this.lineBuffer.length <= rows) {
      this.topLine = 0;
    }

    this.renderedLines = this.lineBuffer.slice(
      this.topLine,
      this.topLine + rows
    );

    if (this.scroll && this.lineBuffer.length > rows) {
      var scrollArray = this.scrollBar(
        this.lineBuffer,
        this.renderedLines,
        this.topLine,
        rows
      );
      for (var i = 0; i < rows; i++) {
        var line = this.renderedLines[i];
        if (line == undefined) {
          line = "";
        }
        line = to_width(line, this.columns, { align: "left" });
        line += " " + scrollArray[i];
        this.renderedLines[i] = line;
      }
    }

    if (header) {
      var firstLine = header;
      if (width_of(header) > this.width) {
        firstLine = wrapAnsi(header, this.width, {
          trim: false,
          wordWrap: false,
          hard: true,
        }).split("\n")[0];
      }

      this.renderedLines.unshift(firstLine);
    }

    //if we have a footer
    if (footer) {
      //get footer line
      var lastLine = footer;
      if (width_of(footer) > this.width) {
        lastLine = wrapAnsi(footer, this.width, {
          trim: false,
          wordWrap: false,
          hard: true,
        }).split("\n")[0];
      }

      //add a single space between if available
      if (this.renderedLines.length < rows) {
        this.renderedLines.push("");

        //if not suggesting, add space for suggestions so footer doesnt jump around
        if (!this.isSuggesting) {
          var space = rows - this.renderedLines.length;
          space = Math.min(this.limit, space);
          for (var i = 0; i < space; i++) {
            this.renderedLines.push("");
          }
        }
      }

      //add to renderedlines
      this.renderedLines.push(lastLine);
    }

    this.line = l;

    var final = this.renderedLines.join("\n");

    return final;
  }

  /**
   * Overwrite render
   * Use our highlight function-- moved to actual choice rendering
   * Render using lines
   * Move cursor
   * Clear asap, this avoids an extra line staying on cancel (why?)
   */
  render() {
    logger.debug("render");

    // moved highlighting to choice rendering so it only occurs for visible!

    //get state
    let { submitted, size } = this.state;

    //get top parts
    let prompt = "";
    let header = this.header();
    let prefix = this.prefix();
    let separator = this.separator();
    let message = this.msg();

    if (this.options.promptLine !== false) {
      prompt = [prefix, message, separator, ""].filter(Boolean).join(" ");
      this.state.prompt = prompt;
    }

    //get after parts
    let output = this.format();
    //let help = (await this.error()) || (await this.hint());
    let help = "";
    let body = this.renderChoices();
    //let body = "";
    let footer = this.footer();

    //add output and help to prompt
    if (output) prompt += output;
    if (help && !prompt.includes(help)) prompt += " " + help;

    var final = this.renderLines(header, prompt, body, footer);

    this.cursorHide();
    //clear previous
    this.clear(size);
    this.write(final);
    this.write(this.margin[2]);
    this.cursorShow();
    this.restore();

    this.writeCursor();

    logger.debug("render end");
  }

  // header() {
  //   var header = this.options["header"];
  //   var result;
  //   if (typeof header === 'function') {
  //     result = header.call();
  //   }
  //   return "a";
  // }

  renderNoClear() {
    let { submitted, size } = this.state;

    let prompt = "";
    let header = this.header();
    let prefix = this.prefix();
    let separator = this.separator();
    let message = this.msg();

    if (this.options.promptLine !== false) {
      prompt = [prefix, message, separator, ""].filter(Boolean).join(" ");
      this.state.prompt = prompt;
    }

    let output = this.format();
    //let help = (await this.error()) || (await this.hint());
    let help = "";
    let body = this.renderChoices();
    //let body = "";
    let footer = this.footer();

    if (output) prompt += output;
    if (help && !prompt.includes(help)) prompt += " " + help;

    var final = this.renderLines(header, prompt, body, footer);

    this.write(final);
    //this.write(this.margin[2]);
    //this.restore();

    //this.writeCursor();
  }

  write(str) {
    logger.debug("write");
    return super.write(str);
  }

  footer() {
    logger.debug("footer");
    return super.footer();
  }

  /**
   * Fix timing issues by making this sync.
   * Allow empty string values, now checks explcitly for undefined.
   */
  element(name, choice, i) {
    let { options, state, symbols, timers } = this;
    //let value = options[name] || state[name] || symbols[name];
    //allow empty strings!
    let value = options[name];
    if(value === undefined){
      value = state[name];
    }
    if(value === undefined){
      value = symbols[name];
    }
    let val = choice && choice[name] != null ? choice[name] : value;
    if (val === "") return val;
    let res = this.resolve(val, state, choice, i);
    if (!res && choice && choice[name]) {
      return this.resolve(value, state, choice, i);
    }
    return res;
  }

  /**
   * Allows empty prefix, without falling back to symbols.
   */
  prefix() {
    logger.debug("prefix");
    let element = this.element("prefix") //|| this.symbols; //element() already falls back to symbols
    let timer = this.timers && this.timers.prefix;
    let state = this.state;
    state.timer = timer;
    if (utils.isObject(element))
      element = element[state.status] || element.pending;
    if (!utils.hasColor(element)) {
      let style;
      if (state.status == "submitted" || state.status == "cancelled") {
        style = this.styles[state.status];
      } else {
        style = chalkPipe(this.colors.contrast);
      }
      return style(element);
    }
    return element;
  }

  separator() {
    logger.debug("separator");
    let element = this.element("separator") || this.symbols;
    let timer = this.timers && this.timers.separator;
    let state = this.state;
    state.timer = timer;
    let value = element[state.status] || element.pending || state.separator;
    let ele = this.resolve(value, state);
    if (utils.isObject(ele)) ele = ele[state.status] || ele.pending;
    if (!utils.hasColor(ele)) {
      return this.styles.muted(ele);
    }
    return ele;
  }

  msg() {
    logger.debug("msg");
    let message = this.element("message");
    logger.debug("message: " + message);
    if (!utils.hasColor(message)) {
      return this.styles.strong(message);
    }
    return message;
  }

  clear(lines = 0) {
    logger.debug(
      "clear lines: " + lines + "buffer length: " + this.state.buffer.length
    );
    let buffer = this.state.buffer;
    //sometimes lines has a number despite no buffer!
    if (buffer.length == 0 || lines.length == 0) return;
    this.state.buffer = "";
    if ((!buffer && !lines) || this.options.show === false) return;

    //get the currently rendered cursor line
    var current = 0;
    if (this.prevCoords) {
      current = this.prevCoords[0];
    }

    //down to end of lines then clear from bottom up
    this.stdout.write(
      ansi.cursor.down(lines - current) + ansi.clear(buffer, this.width)
    );

    //clear from bottom up
    //this.stdout.write(ansi.clear(buffer, this.width));
  }

  /**
   * Overwrite sections to not rely on prompt, because the prompt may be hidden.
   * Prompt can even be empty! Fixed this.
   * Handles header correctly.
   */
  sections() {
    let { buffer, input, prompt } = this.state;
    prompt = colors.unstyle(prompt);

    //find prompt index
    let buf = colors.unstyle(buffer);
    let idx = buf.indexOf(prompt);

    //add a check for an empty prompt, indexOf returns 0 in this case, handle as -1
    if(prompt === ""){
      idx = -1;
    }

    let header = this.state.header;
    if(typeof header === "function"){
      header = header.call(this);
    }
    header = colors.unstyle(header);
    //if there is a header and it doesnt have a newline
    if (header && !header.endsWith("\n")) {
      header += "\n";
    }

    if (idx == -1) {
      idx = buf.indexOf(header);
      if (idx == -1) {
        idx = 0;
      } else {
        idx += header.length;
      }
    }
    // let header = buf.slice(0, idx);
    let rest = buf.slice(idx);
    let lines = rest.split("\n");
    let first = lines[0];
    let last = lines[lines.length - 1];
    let promptLine = prompt + (input ? " " + input : "");
    let len = promptLine.length;
    let after = len < first.length ? first.slice(len + 1) : "";
    // logger.debug("sections: " + lines);
    return { header, prompt: first, after, rest: lines.slice(1), last };
  }

  async writeCursor() {
    var coords = this.getCoords(
      this.lineBuffer,
      this.cursor + width_of(this.state.prompt),
      true
    );

    coords[0] = coords[0] - this.topLine;

    this.prevCoords = coords;
    if (
      this.stdout &&
      this.state.show !== false &&
      !this.state.submitted &&
      !this.state.cancelled
    ) {
      this.stdout.write(
        ansi.cursor.down(coords[0]) + ansi.cursor.to(coords[1])
      );
    }
  }

  /**
   * Inserts the selected choice, replacing the search substring.
   */
  insertString(str) {
    //add pre
    var input = this.input.slice(0, this.suggestionStart);
    //add str
    input += str;

    //get cursor length at end of insert
    var cursor = input.length;

    //add remaining after cursor
    input += this.input.slice(this.cursor, this.input.length);

    //set input
    this.input = input;

    //set cursor
    this.cursor = cursor;
  }

  /**
   * What happens on submit
   */
  async submit() {
    //if we are suggesting, insert dont submit
    if (this.isSuggesting) {
      //do we have a focused choice?
      let choice = this.focused;
      if (choice) {
        //insert
        this.insertString(this.selected.value);
        this.isSuggesting = false;
        this.index = -1;
        this.suggestionStart = -1;
        await this.render();
        return;
      }
    }

    //use default from input line
    return Prompt.prototype.submit.call(this);
  }
}

//new BasePrompt({footer: function(){return "aaaa";}, multiline:true, choices: ["a"]}).run();

module.exports = BasePrompt;
