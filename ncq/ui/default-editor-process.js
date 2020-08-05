const EditorPrompt = require("./prompts/editor-prompt");
const PromptHandler = require("./prompt-handler");
const { footer } = require("./footer");
const { getConfig } = require("../config");

const fs = require("fs");
const path = require("path");
const { to_width, width_of } = require("to-width");
const chalkPipe = require("chalk-pipe");

var config;
var colors;

var filename;

//run if called as main, not if required
if (require.main == module) {
  main();
}

async function main() {
  //get arguments
  var args = process.argv;

  //path of file
  var filePath = args[2];
  filename = path.basename(filePath);

  var contents = fs.readFileSync(filePath, { encoding: "utf-8" });

  //var prompt = new PromptHandler(CodePrompt, {multiline: true, initial: contents});
  prompt = new PromptHandler(EditorPrompt, {
    //using prompt handler these need to be explictly set to nothing
    prefix: "",
    message: "",
    separator: "",
    header: header, //header
    footer: footer, //footer can change so use function
    multiline: true, //of course, multiline true
    limit: 4, //autocomplete already allows some padding between header/footer so just use this for now vs a min prompt size
    initial: contents, //prefill with file contents
    scroll: true,
  });

  var response = await prompt.run();

  console.log("// Exiting editor and saving...");

  //write to file
  fs.writeFileSync(filePath, response);
}

/**
 * Returns header
 */
function header() {
  if (!config) {
    config = getConfig();
    colors = config.get("colors");
  }

  var width = process.stdout.columns - 1;
  var header = "NCQ - " + filename;

  //to_width must be >= 2
  if (width < 2) width = 2;

  header = to_width(header, width, { align: "center" });

  header = chalkPipe(
    "bg" + colors.contrast + "." + colors.contrastText + ".bold"
  )(header);

  return header;
}
