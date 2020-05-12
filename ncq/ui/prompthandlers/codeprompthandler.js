const PromptHandler = require("./prompthandler");
const CodePrompt = require("../prompts/code-prompt");

class CodePromptHandler extends PromptHandler {
    constructor(suggestions = [], prefix = "NCQ", message = "") {
      super(suggestions, prefix, message);
    }
  
    async run() {
      this.prompt = new CodePrompt({
        name: "",
        message: this.message,
        separator: "> ",
        prefix: this.prefix,
        snippets : ["var a=1\na+1\n", "console.log(\"string\")"],
        multiline : true
      });
      return await this.prompt.run();
    }
  }

  module.exports = CodePromptHandler;