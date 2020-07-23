const CodePrompt = require("./prompts/code-prompt");
const PromptHandler = require("./prompt-handler");

const fs = require("fs");

async function main() {
  var args = process.argv;

  //path of file
  var filePath = args[2];

  var contents = fs.readFileSync(filePath, {encoding: 'utf-8'});

  var prompt = new PromptHandler(CodePrompt, {multiline: true, initial: contents});

  var response = await prompt.run();

  var response = "a";

  console.log("// Exiting editor and saving...");

  //write to file
  fs.writeFileSync(filePath, response);

  //when you close the repl you will get a repl failed error and things will close! why?

  //for now if a user doesnt want to save, they can just ctrl+c
}

//run if called as main, not if required
if (require.main == module) {
  main();
}
