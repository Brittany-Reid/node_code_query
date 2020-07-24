const BasePrompt = require("./base-prompt");

/**
 * Editor style prompt. Extends BasePrompt
 * - We don't need the autocomplete here but it's easy to just not send any choices to the prompt.
 * - Enter does not submit, but instead adds newlines. Instead there will be a dedicated save button.
 * - We can use the header field to display filename etc, and remove the prompt >.
 */
class EditorPrompt extends BasePrompt {
  constructor(options = {}) {
    super(options);

    //by default, no prompt, but you can specify one if you want
    //had to change some enquirer code for this in element() and prefix() (in BasePrompt)
    this.state.prefix = this.options.prefix || "";
    this.state.message = this.options.message || "";
    this.state.separator = this.options.separator || "";
  }

  handleKey(input, key) {

    //same newline check from enquirer string type
    if (this.options.multiline === true && key.name === "return") {
      return this.append("\n", key);
    }

    //help key is now the save key :)
    var check = this.keys["help"];
    if (this.isKey(key, check)) {
      this.submit();
      return;
    }

    super.handleKey(input, key);
  }


  /**
   * Line down does not allow newline.
   */
  async lineDown() {
    //allow make new line
    if (this.cursor >= this.input.length && this.options.multiline)
      return;

    await super.lineDown();
  }
}

module.exports = EditorPrompt;
