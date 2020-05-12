const { Input } = require("enquirer");

/**
 * Extension of the Input prompt that allows snippets to be previewed
 * and cycled.
 */
class CodePrompt extends Input {
  constructor(options) {
    super(options);
    this.snippetIndex = -1;
    this.snippets = this.options.snippets;
    if (this.snippets.length > 0) {
      this.input = this.snippets[0].trim();
      this.snippetIndex = 0;
      this.cursor = this.input.length;
    }
  }

  up(){
    if(this.snippetIndex >= this.snippets.length-1){
      return;
    }
    this.snippetIndex++;
    this.input = this.snippets[this.snippetIndex].trim();
    this.render();
    this.cursor = this.input.length;
  }

  down(){
    if(this.snippetIndex <= 0){
      return;
    }
    this.snippetIndex--;
    this.input = this.snippets[this.snippetIndex].trim();
    this.render();
    this.cursor = this.input.length;
  }
}

module.exports = CodePrompt;
