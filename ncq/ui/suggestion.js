const { AutoComplete } = require("enquirer");
const { keypress } = require("enquirer");
const unique = arr => arr.filter((v, i) => arr.lastIndexOf(v) === i);
const compact = arr => unique(arr).filter(Boolean);

class Suggestion extends AutoComplete {
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
  }

  /**
   * Sometimes we get a crash because of the enable function. If we have no selected, skip.
   */
  enable(choice) {
    if(!this.selected) return;
    super.enable(choice);
  }

  /**
   * Reset that allows empty suggestion list.
   */
  reset(){
    if(this.selectable.length === 0){
      return;
    }
    super.reset();
  }

  getHistory(action = "prev") {
    if (!this.store) return this.alert();
    var prev = this.data.past;

    if (this.hIndex == -1) {
      this.hIndex = prev.length;
    }

    if (action == "prev") {
      if (this.hIndex == 0) {
        return this.alert();
      }
      this.hIndex = this.hIndex - 1;
    }
    else if(action = "next"){
      this.hIndex = this.hIndex + 1;
    }

    if(this.hIndex > prev.length-1){
      this.input = this.data.present;
    }
    else{
      this.input = prev[this.hIndex];
    }

    this.cursor = this.input.length;
    return this.render();
  }

  /**
   * When we press up. Adds new functionality if not suggesting: get from history.
   */
  up() {
    if (!this.isSuggesting) {
      this.getHistory("prev");
      return;
    }
    super.up();
  }

  /**
   * When we press down and aren't suggesting, get from history.
   */
  down() {
    if (!this.isSuggesting) {
      this.getHistory("next");
      return;
    }
    super.down();
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
   * Close suggestions. Done = true if we have finished by placing the suggestion (this resets the suggestion start position).
   */
  closeSuggestions(done = false) {
    this.isSuggesting = false;
    this.index = -1;
    if (done) {
      this.suggestionStart = -1;
    }
    this.render();
  }

  close(){
    //how to hide the prompt:
    // this.clear();
    // this.stdout.write("> ");
    super.close();
  }

  /**
   * When we press tab.
   */
  tab() {
    //toggle on and record start point
    if (!this.isSuggesting) {
      this.isSuggesting = true;
      this.suggestionStart = this.cursor;
      this.complete(); //call complete, trigger suggestions
    } else {
      this.closeSuggestions(false);
    }
  }

  suggest(input = this.input, choices = this.state._choices) {
    //if we are not suggesting, return no suggestions
    if (!this.isSuggesting) {
      return [];
    }

    //get string to use as a substring from when we pressed tab and what we have written now
    let str = input.toLowerCase().substring(this.suggestionStart, this.cursor);

    const filtered = choices
      .filter((ch) => !ch._userInput)
      .filter((ch) => ch.message.toLowerCase().includes(str));
    if (!filtered.length && this.options.inputNoChoice) {
      return [];
    }
    return filtered;
  }

  /**
   * Inserts the selected choice, replacing the search substring.
   */
  insert(str) {
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
   * Submits prompt from prompt line, not a choice.
   * Copied from Enquirer prompt.js
   */
  async submitPrompt() {
    this.state.validating = false;
    await this.render();
    await this.close();

    this.value = await this.result(this.value);
    this.emit("submit", this.value);

    return;
  }

  /**
   * What happens on enter command.
   */
  async submit() {
    //if we are suggesting
    if (this.isSuggesting) {
      //and we have a focused choice
      let choice = this.focused;
      if (choice) {
        //enter just inserts this choice
        this.insert(this.selected.name);
        this.closeSuggestions(true);
        return;
      }
    }

    //otherwise, we submit input from the prompt
    if (this.store && this.autosave === true) {
      this.save();
    }
    return this.submitPrompt();
  }
}

module.exports = Suggestion;
