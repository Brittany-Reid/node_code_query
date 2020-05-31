const { AutoComplete, Select, Prompt } = require("enquirer");
const { keypress } = require("enquirer");
const unique = (arr) => arr.filter((v, i) => arr.lastIndexOf(v) === i);
const compact = (arr) => unique(arr).filter(Boolean);
const { to_width, width_of } = require("to-width");
const actions = require("enquirer/lib/combos");
const colors = require("ansi-colors");
const stripAnsi = require("strip-ansi");
const {ansiRows} = require("../../ui/ansi-rows");

/**
 * Extend Enquirer AutoComplete.
 * - Can enter custom input.
 * - Can toggle suggestions.
 * - Suggestions start from when a user presses tab, and follow the user.
 * - Suggestions are formatted to have background colour.
 * - Should have same behaviour as REPL.
 */
class SuggestionPrompt extends AutoComplete {
  /**
   * Constructor. Sets up AutoComplete options, then our options.
   */
  constructor(options) {
    super(options);

    //set up history
    let history = this.options.history;
    if (history && history.store) {
      this.autosave = !!history.autosave;
      this.store = history.store;
      this.data = this.store.get("values") || { past: [], present: [] };
    }

    //when our suggestions start
    this.suggestionStart = -1;
    //to display suggestions
    this.isSuggesting = false;
    this.hIndex = -1;
    //formatting
    this.maxwitdh = 0;
    this.filtered = [];
    actions.keys = { ...actions.keys, ...{ tab: "tab" } };
    actions.ctrl = {
      ...actions.ctrl,
      ...{ left: "ctrlLeft", right: "ctrlRight" },
    };

    //scroll box - which line is at top
    this.top = 0;
  }

  // async toChoice(ele, i, parent) {
  //   console.log(parent);
  //   return super.toChoice(ele, i, parent);
  // }

  /**
   * Extend keypress to ignore certain keys.
   */
  async keypress(input, key = {}) {
    //ignore both esc and ctrl+[ keys
    //this is default repl behaviour
    if (key.name === "escape") {
      return;
    }
    //otherwise,
    return super.keypress(input, key);
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
      super.dispatch(s, key);
    }
  }

  /**
   * When we press tab.
   */
  tab() {
    //if we have no choices, return
    //for some reason this.choices doesnt match this.options right away
    if (!this.options.choices || this.options.choices.length < 1) return;
    //toggle on and record start point
    if (!this.isSuggesting) {
      this.isSuggesting = true;
      this.suggestionStart = this.cursor;
      this.complete(); //call complete, trigger suggestions
    } else {
      this.isSuggesting = false;
      this.index = -1;
      this.render();
    }
  }

  /**
   * When we press up. Adds new functionality if not suggesting: get from history.
   */
  up() {
    if (!this.isSuggesting) {
      this.getHistory("prev");
      return;
    }
    return super.up();
  }

  /**
   * When we press down and aren't suggesting, get from history.
   */
  down() {
    if (!this.isSuggesting) {
      this.getHistory("next");
      return;
    }
    return super.down();
  }

  /**
   * On Ctrl+left, move to the start of the current line.
   */
  ctrlLeft() {
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
   * On Ctrl+right, move to line end.
   */
  ctrlRight() {
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

  /**
   * Sometimes we get a crash because of the enable function. If we have no selected, skip.
   */
  enable(choice) {
    if (!this.selected) return;
    super.enable(choice);
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

  getHistory(action = "prev") {
    if (!this.store) return this.alert();
    var prev = this.data.past;
    if (!prev || prev.length < 1) {
      return this.alert();
    }

    if (this.hIndex == -1) {
      this.hIndex = prev.length;
    }

    if (action == "prev") {
      if (this.hIndex == 0) {
        return this.alert();
      }
      this.hIndex = this.hIndex - 1;
    } else if ((action = "next")) {
      this.hIndex = this.hIndex + 1;
    }

    if (this.hIndex > prev.length - 1) {
      this.input = this.data.present;
    } else {
      this.input = prev[this.hIndex];
    }

    this.cursor = this.input.length;
    return this.render();
  }

  /**
   * Save input in history.
   */
  save() {
    if (!this.store) return;
    var rest = this.data.past;
    rest.push(this.value);
    this.data = {
      past: compact(rest),
      present: "",
    };
    this.store.set("values", this.data);
    this.hIndex = this.data.past.length - 1;
  }

  /**
   * Calculate max width of suggestions.
   */
  getWidth(choices) {
    var max = 0;
    choices.forEach((element) => {
      var width = width_of(element.message);
      max = Math.max(max, width);
    });
    this.maxwitdh = max;
  }

  filter(input, choices) {
    return choices;
  }

  suggest(input = this.input, choices = this.state._choices) {
    //if we are not suggesting, return no suggestions
    if (!this.isSuggesting) {
      this.filtered = [];
      return this.filtered;
    }

    choices =
      typeof this.options.choiceFilter == "function"
        ? this.options.choiceFilter.call(this, input, choices)
        : this.filter(input, choices);

    //get string to use as a substring from when we pressed tab and what we have written now
    let str = input.toLowerCase().substring(this.suggestionStart, this.cursor);

    this.filtered = choices
      .filter((ch) => !ch._userInput)
      .filter((ch) => ch.message.toLowerCase().includes(str));
    if (!this.filtered.length && this.options.inputNoChoice) {
      this.filtered = [];
      return this.filtered;
    }

    this.getWidth(this.filtered);

    return this.filtered;
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
    if (str.endsWith('("")')) {
      this.cursor = cursor - 2;
    } else {
      this.cursor = cursor;
    }
  }

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

  /**
   * Overwrite render to use our own highlight function.
   */
  async render() {
    if (this.state.status !== "pending")
      return await Select.prototype.render.call(this);
    let style = this.options.highlight
      ? this.options.highlight.bind(this)
      : this.styles.placeholder;

    let color = this.highlight(this.input, style);
    let choices = this.choices;
    this.choices = choices.map((ch) => ({ ...ch, message: color(ch.message) }));
    await Select.prototype.render.call(this);
    this.choices = choices;
  }

  /**
   * Overwrite choice rendering to add background colour.
   */
  async renderChoice(choice, i) {
    await this.onChoice(choice, i);

    let focused = this.index === i;
    let pointer = await this.pointer(choice, i);
    let check = (await this.indicator(choice, i)) + (choice.pad || "");
    let hint = await this.resolve(choice.hint, this.state, choice, i);

    if (hint && !utils.hasColor(hint)) {
      hint = this.styles.muted(hint);
    }

    let ind = this.indent(choice);
    let msg = await this.choiceMessage(choice, i);
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

    //set width of message
    var indent = this.getIndent();
    var width = Math.min(this.maxwitdh, this.state.width - (indent + 11));
    if (width < 0) return "";
    msg = to_width(msg, width + 2, { align: "left" });
    //if we're displaying more than allowed add arrows
    if (this.filtered.length > this.limit) {
      if (i == 0) {
        msg = msg + "▲";
      } else if (i == this.limit - 1) {
        msg = msg + "▼";
      }
    }
    msg = to_width(msg, width + 4, { align: "left" });
    msg = to_width(msg, width + 5, { align: "right" });

    if (focused) {
      msg = colors.bold(colors.bgBlackBright(msg));
    } else {
      msg = colors.bgWhite(colors.black(msg));
    }

    if(indent >= 2){
      msg = to_width("", indent) + msg;
    }

    return line();
  }

  getIndent() {
    var indent = width_of(
      this.state.prompt + this.input.substring(0, this.suggestionStart)
    );
    return indent;
  }

  /**
   * Renders the list of choices.
   */
  async renderChoices() {
    //do not render
    if (!this.isSuggesting) {
      this.visible.push(this.styles.danger(""));
      return "";
    }
    if (this.state.loading === "choices") {
      return this.styles.warning("Loading choices");
    }

    if (this.state.submitted) return "";
    let choices = this.visible.map(
      async (ch, i) => await this.renderChoice(ch, i)
    );
    let visible = await Promise.all(choices);
    if (!visible.length)
      visible.push(/*this.styles.danger('No matching a choices')*/);
    let result = this.margin[0] + visible.join("\n");
    let header;

    if (this.options.choicesHeader) {
      header = await this.resolve(this.options.choicesHeader, this.state);
    }

    return [header, result].filter(Boolean).join("\n");
  }

  /**
   * What happens on enter command.
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

    //otherwise, we submit input from the prompt
    if (this.store && this.autosave === true) {
      this.save();
    }

    //use default from input line
    return Prompt.prototype.submit.call(this);
  }

  /**
   * On cancel, fromat input to be greyed out.
   * On submit, don't print focused suggestion.
   */
  format() {
    if (this.state.cancelled) return colors.grey(this.value);
    if (this.state.submitted) {
      let value = (this.value = this.input);
      return value;
    }
    return super.format();
  }

  async prefix() {
    var element = await super.prefix();
    if (this.state.cancelled) {
      element = colors.grey(colors.unstyle(element));
    }
    return element;
  }

  async message() {
    var element = await super.message();
    if (this.state.cancelled) {
      element = colors.grey(colors.unstyle(element));
    }
    return element;
  }

  async separator() {
    var element = await super.separator();
    if (this.state.cancelled) {
      element = colors.grey(colors.unstyle(element));
    }
    return element;
  }


  /**
   * Overwrite write to print rows based on cursor. 
   */
  write(str){
    if (!str) return;
    if(this.state.submitted || this.state.cancelled){
      return super.write(str);
    }
    if (this.stdout && this.state.show !== false) {
      var rows = this.height;
      //get cursor position on printed
      //console.log(this.state.prompt)
      var prompt = this.state.prompt;
      var offset = stripAnsi(prompt).length;

      var cursor = this.cursor + offset;

      var rowed = ansiRows(str, rows, this.width-1, this.top, {trim: false, hard: true});

      var lines = rowed.lines;
      var toPrint = rowed.output;
      var endCh = rowed.endCh;
      var startCh = rowed.startCh;

      if(cursor < startCh){
        this.top--;
        var toPrint = lines.slice(this.top, this.top+rows).join("\n");
      }

      if(cursor > (endCh)){
        this.top++;
        var toPrint = lines.slice(this.top, this.top+rows).join("\n");
      }

      //get lines
      // var lines = this.getLines(str, this.width-1, {trim: false, hard: true});

      // //check which line cursor is in
      // var length = 0;
      // var l;
      // for(let i=0; i<lines.length; i++){
      //   var line = stripAnsi(lines[i]);
      //   length += (line.length);
      //   if(cursor < length){
      //     l = i;
      //     break;
      //   }
      //   length++;
      // }

      // if(l < this.top){
      //   this.top--;
      //   toPrint = lines.slice(this.top, this.top+rows).join("\n")
      // }


      // if(l > (this.top+(rows-1))){
      //   this.top++;
      //   toPrint = lines.slice(this.top, this.top+rows).join("\n")
      // }
      
      // var toPrint = lines.slice(this.top, this.top+rows).join("\n");
      this.stdout.write(toPrint);

    }
    this.state.buffer += toPrint;
  }
}

module.exports = SuggestionPrompt;
