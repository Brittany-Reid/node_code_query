const { to_width, width_of } = require("to-width");
const utils = require("enquirer/lib/utils");
const colors = require("ansi-colors");
const Store = require("data-store");
const BasePrompt = require("./base-prompt");
const chalkPipe = require("chalk-pipe");

const unique = (arr) => arr.filter((v, i) => arr.lastIndexOf(v) === i);
const compact = (arr) => unique(arr).filter(Boolean);

/**
 * Suggestion Prompt
 * Formats suggestions in a box.
 * Suggestions follow as type
 * Allow history
 */
class SuggestionPrompt extends BasePrompt {
  constructor(options) {
    super(options);

    //state
    this.maxChoiceLength = 0;
    this.hIndex = -1;
    //set up history
    let history = this.options.history;
    if (history && history.store) {
      this.autosave = !!history.autosave;
      this.store = history.store;
      this.data = this.store.get("values") || { past: [], present: [] };
    }

    this.styles.cancelled = this.styles.dark;
    this.styles.muted = this.styles.dark;
    this.styles.submitted = this.styles.primary;

    this.helpCommand = "help";
  }

  /**
   * Extend handleKey for history.
   */
  async handleKey(input, key) {
    //history up
    var check = this.keys["historyUp"];
    if (this.isKey(key, check)) {
      return this.historyUp();
    }

    //history down
    var check = this.keys["historyDown"];
    if (this.isKey(key, check)) {
      return this.historyDown();
    }

    //help
    var check = this.keys["help"];
    if (this.isKey(key, check)) {
      this.input = this.helpCommand;
      this.submit();
      return;
    }

    super.handleKey(input, key);
  }

  /**
   * Overwrite suggest to calculate max width of choices.
   */
  suggest(input, choices) {
    this.filtered = super.suggest(input, choices);

    //calculate max width of suggestions
    var max = 0;
    this.filtered.forEach((element) => {
      var width = width_of(element.message);
      max = Math.max(max, width);
    });
    this.maxChoiceLength = max; //max;

    return this.filtered;
  }

  /**
   * When we press up. Adds new functionality if not suggesting: get from history.
   */
  historyUp() {
    if (!this.isSuggesting) {
      this.getHistory("prev");
      return;
    }
  }

  /**
   * When we press down and aren't suggesting, get from history.
   */
  historyDown() {
    if (!this.isSuggesting) {
      this.getHistory("next");
      return;
    }
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
   * Get indent
   */
  indent() {
    var before =
      this.state.prompt + this.input.substring(0, this.suggestionStart);
    var lines = before.split("\n");
    var length = width_of(before);

    //fits on a single line
    if (length < this.width && lines.length < 2) {
      return " ".repeat(length);
    } else {
      var coords = this.getCoords(
        lines,
        width_of(this.state.prompt) + this.cursor
      );
      return " ".repeat(Math.max(coords[1] - 1, 0));
    }
  }

  /**
   * Overwrite choice rendering to add background colour.
   */
  renderChoice(choice, i) {
    let focused = this.index === i;

    let ind = this.indent(choice);
    let msg = this.choiceMessage(choice, i);
    let line = () =>
      [this.margin[3], ind, msg, this.margin[1]].filter(Boolean).join(" ");

    //heading choice
    if (choice.role === "heading") {
      return line();
    }

    //disabled choice
    if (choice.disabled) {
      if (!utils.hasColor(msg)) {
        msg = this.styles.disabled(msg);
      }
      return line();
    }

    var leftPadding = 1;
    var rightPadding = 2;
    //calculate available space
    var availableWidth =
      this.width - (ind.length + leftPadding + rightPadding + 2);
    //scale width but constain by terminal width
    var width = Math.min(this.maxChoiceLength, availableWidth);
    //if cannot fit, return nothing
    if (width < 2) return "";
    //resize msg
    msg = to_width(msg, width, { align: "left" });

    //add arrows if there are hidden
    if (this.filtered.length > this.limit) {
      if (i == 0) {
        msg = msg + "▲";
      } else if (i == this.limit - 1) {
        msg = msg + "▼";
      }
    }

    //add padding
    msg = to_width(msg, width + rightPadding, { align: "left" });
    msg = to_width(msg, width + rightPadding + leftPadding, { align: "right" });

    //colours
    if (focused) {
      //msg = colors.bold(colors.bgBlackBright(msg));
      //get style
      let style = chalkPipe(this.colors.secondary);
      let color = this.highlight(this.input, style);
      msg = color(msg);
      msg = chalkPipe("bg" + this.colors.contrast + ".bold")(msg);
    } else {
      //inversing, so colour background
      let style = chalkPipe("bg" + this.colors.secondary);
      let color = this.highlight(this.input, style);
      msg = color(msg);
      msg = chalkPipe("inverse")(msg);
    }

    return line();
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
   * Save on submit
   */
  submit() {
    //save if not suggesting
    if (!this.isSuggesting) {
      //otherwise, we submit input from the prompt
      if (this.store && this.autosave === true) {
        this.save();
      }
    }

    super.submit();
  }

  async message() {
    let message = await this.element("message");
    if (!utils.hasColor(message)) {
      if (this.state.cancelled)
        message = this.styles[this.state.status](message);
      return this.styles.strong(message);
    }
    return message;
  }
}

module.exports = SuggestionPrompt;
