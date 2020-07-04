const { AutoComplete, Select, Prompt } = require("enquirer");
const { to_width, width_of } = require("to-width");
const ansi = require("enquirer/lib/ansi");
const stripAnsi = require("strip-ansi");
const wrapAnsi = require("wrap-ansi");
const colors = require("ansi-colors");
const { getConfig } = require("../../config");
const { width } = require("enquirer/lib/utils");
const keypress = require("enquirer/lib/keypress");
const utils = require("enquirer/lib/utils");
const { getLogger } = require("../../logger");
const ncp = require("copy-paste-win32fix");

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

    //state
    this.isSuggesting = false;
    this.suggestionStart = -1;
    this.filtered = [];
    this.lineBuffer = [];
    this.topLine = 0;

    this.scroll = this.options.scroll;
    this.scrollPos = 0;
    this.keybuffer = [];


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

  async complete() {
    logger.debug("completing");
    this.completing = true;
    this.choices = this.suggest(this.input, this.state._choices);
    this.state.limit = void 0; // allow getter/setter to reset limit
    this.index = Math.min(Math.max(this.visible.length - 1, 0), this.index);
    await this.render();
    this.completing = false;
  }

  scrollDown(i) {
    if (!this.isSuggesting) return;
    return super.scrollDown(i);
  }

  scrollUp(i) {
    if (!this.isSuggesting) return;
    return super.scrollUp(i);
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
   */
  isKey(key, check) {
    if (!check) return false;
    var fields = Object.keys(check);
    var is = true;
    for (var i = 0; i < fields.length; i++) {
      if (check[fields[i]] != key[fields[i]]) {
        is = false;
      }
    }

    return is;
  }

  /**
   * Extend keypress to handle our keypresses.
   */
  async keypress(input, key = {}) {
    logger.debug("Pressed key: " + JSON.stringify(key) + "\n");

    await this.handleKey(input, key);

    //await super.keypress(input, key);
    logger.debug("Done key: " + JSON.stringify(key) + "\n");
  }

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

  paste() {
    var cc = ncp.paste();

    // cc = "paste: " + JSON.stringify(cc);

    cc = cc.replace(/\r\n/g, "\n");

    //currentClipboard.replace(/\r\n/g, "\n");

    //console.log(currentClipboard);

    var before = this.input.slice(0, this.cursor);
    var after = this.input.slice(this.cursor);
    this.input = before + cc;

    this.cursor = this.input.length;

    this.input += after;

    this.render();
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

    //get string to use as a substring from when we pressed tab and what we have written now
    let str = input.toLowerCase().substring(this.suggestionStart, this.cursor);

    //filter
    this.filtered = choices
      .filter((ch) => !ch._userInput)
      .filter((ch) => ch.message.toLowerCase().includes(str));

    //if none, return empty
    if (!this.filtered.length) {
      this.filtered = [];
      return this.filtered;
    }

    return this.filtered;
  }

  /**
   * Custom ighlight function.
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

    return line();
  }

  /**
   * Renders the list of choices.
   */
  renderChoices() {
    logger.debug("renderChoices");

    //only when suggesting
    if (!this.isSuggesting) {
      this.visible.push("");
      return "";
    }
    //no matching, don't print
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
    if(wrapped){
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
    //ignore header and footer for now
    var string = [prompt, body].filter(Boolean).join("\n");

    if (this.state.submitted || this.state.cancelled) {
      return [header, prompt, body, footer].filter(Boolean).join("\n");
    }
    var rows = this.height;
    //leave space for footer
    if (footer) {
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
    this.newLineOffset = (stripAnsi(wrapped).substring(0, cursor).split("\n").length-1) - (stripAnsi(string).substring(0, cursor).split("\n").length-1);

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

    //if we have a footer
    if (footer) {
      //get footer line
      var lastLine = footer;
      if (width_of(footer) > this.width) {
        lastLine = wrapAnsi(footer, this.width, {
          trim: false,
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
   * Use our highlight function
   * Render using lines
   * Move cursor
   * Clear asap, this avoids an extra line staying on cancel (why?)
   */
  render() {
    logger.debug("render");
    let style = this.options.highlight
      ? this.options.highlight.bind(this)
      : this.styles.placeholder;

    let color = this.highlight(this.input, style);
    let choices = this.choices;
    this.choices = choices.map((ch) => ({ ...ch, message: color(ch.message) }));

    let { submitted, size } = this.state;

    this.clear(size);


    let prompt = "";
    let header = this.header();
    let prefix = this.prefix();
    let separator = this.separator();
    let message = this.msg();

    if (this.options.promptLine !== false) {
      prompt = [prefix, message, separator, ""].join(" ");
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

    //await new Promise(res => setTimeout(res, 2000));
    //await new Promise(res => setTimeout(res, 1000));
    var final = this.renderLines(header, prompt, body, footer);
    this.write(final);
    this.write(this.margin[2]);
    this.restore();

    this.writeCursor();

    this.choices = choices;
    logger.debug("render end");
  }

  renderNoClear(){
    let style = this.options.highlight
      ? this.options.highlight.bind(this)
      : this.styles.placeholder;

    let color = this.highlight(this.input, style);
    let choices = this.choices;
    this.choices = choices.map((ch) => ({ ...ch, message: color(ch.message) }));

    let { submitted, size } = this.state;

    let prompt = "";
    let header = this.header();
    let prefix = this.prefix();
    let separator = this.separator();
    let message = this.msg();

    if (this.options.promptLine !== false) {
      prompt = [prefix, message, separator, ""].join(" ");
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

    //await new Promise(res => setTimeout(res, 2000));
    //await new Promise(res => setTimeout(res, 1000));
    var final = this.renderLines(header, prompt, body, footer);

    this.write(final);
    //this.write(this.margin[2]);
    //this.restore();

    //this.writeCursor();

    this.choices = choices;
  }

  write(str) {
    logger.debug("write");
    return super.write(str);
  }

  footer() {
    logger.debug("footer");
    return super.footer();
  }

  element(name, choice, i) {
    let { options, state, symbols, timers } = this;
    let value = options[name] || state[name] || symbols[name];
    let val = choice && choice[name] != null ? choice[name] : value;
    if (val === "") return val;
    let res = this.resolve(val, state, choice, i);
    if (!res && choice && choice[name]) {
      return this.resolve(value, state, choice, i);
    }
    return res;
  }

  prefix() {
    logger.debug("prefix");
    let element = this.element("prefix") || this.symbols;
    let timer = this.timers && this.timers.prefix;
    let state = this.state;
    state.timer = timer;
    if (utils.isObject(element))
      element = element[state.status] || element.pending;
    if (!utils.hasColor(element)) {
      let style = this.styles[state.status] || this.styles.pending;
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
    logger.debug("clear lines: " + lines + "buffer length: " + this.state.buffer.length);
    let buffer = this.state.buffer;
    //sometimes lines has a number despite no buffer!
    if(buffer.length == 0|| lines.length == 0) return;
    this.state.buffer = "";
    if ((!buffer && !lines) || this.options.show === false) return;

    //get the currently rendered cursor line
    var current = this.prevCoords[0];

    //down to end of lines
    this.stdout.write(ansi.cursor.down(lines - current));

    //clear from bottom up
    this.stdout.write(ansi.clear(buffer, this.width));
  }

  /**
   * Overwrite sectioons to not rely on prompt, because the prompt may be hidden.
   * For now this means header must be static, but we don't print header atm.
   */
  sections() {
    let { buffer, input, prompt } = this.state;
    prompt = colors.unstyle(prompt);
    let buf = colors.unstyle(buffer);
    let idx = buf.indexOf(prompt);
    if (idx == -1) {
      idx = buf.indexOf(this.state.header);
      if (idx == -1) {
        idx = 0;
      }
    }
    let header = buf.slice(0, idx);
    let rest = buf.slice(idx);
    let lines = rest.split("\n");
    let first = lines[0];
    let last = lines[lines.length - 1];
    let promptLine = prompt + (input ? " " + input : "");
    let len = promptLine.length;
    let after = len < first.length ? first.slice(len + 1) : "";
    logger.debug("sections: " + lines.slice(1).length);
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
