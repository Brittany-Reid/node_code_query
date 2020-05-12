const Cmd = require("./cmd");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const fse = require("fs-extra");
const cprocess = require("child_process");
//const PromptHandler = require("./ui/prompthandlers/prompthandler");
const {Input} = require("enquirer");
const SuggestionPrompt = require("./ui/prompts/suggestion-prompt");
const PromptHandler = require("./ui/prompt-handler");

/*
Our main program. From here we can start a repl with specified packages.
*/

var ROOT = __dirname;
//fall back if we run from node_code_query/ncq
if (
  path.dirname(ROOT) != "node_code_query" &&
  path.dirname(ROOT) != "node_code_query/"
) {
  ROOT = path.join(ROOT, "../");
}
var SNIPPETDIR = path.join(ROOT, "data/snippets");
var packages = [];
var counter = 0;

/**
 * Loads the list of packages.
 */
function loadPackages() {
  packages = [];

  var files = fs.readdirSync(SNIPPETDIR);

  files.forEach((file) => {
    var fPath = path.join(SNIPPETDIR, file);
    var ext = path.extname(fPath);
    if (ext === ".desc") {
      packages.push(path.basename(file, ext));
    }
  });
}

class ncqCmd extends Cmd {
  constructor(input) {
    super(input);
  }

  /**
   * The default command, when the command matches no other commands.
   */
  default(inp) {
    if (inp == "x" || inp == "q") {
      return this.do_exit(inp);
    }
    console.log(
      "Did not understand command: " +
        inp +
        "\nWrite help to show the list of commands."
    );
  }

  /**
   * Help for list_packages command.
   */
  help_list_packages(inp) {
    console.log("Lists available packages.");
  }

  /**
   * Lists packages in the snippet directory for repl.
   */
  do_list_packages(inp) {
    if (!packages || packages.length == 0) {
      loadPackages();
    }
    packages.forEach((element) => {
      console.log(element);
    });
  }

  /**
   * Help for repl command.
   */
  help_repl(inp) {
    console.log("Runs a node.js repl.");
  }

  do_repl(inp) {
    //print packages
    console.log(inp);

    //check packages
    var required = inp.split(" ");
    for (let i = 0; i < required.length; i++) {
      if (!packages.includes(required[i])) {
        console.log("could not find package " + required[i] + " cannot create repl");
        return false;
      }
    }

    //make temp
    counter++;
    var tmpDir = path.join(ROOT, "tmp" + counter);
    if (fs.existsSync(tmpDir)) {
      rimraf.sync(tmpDir);
    }
    fs.mkdirSync(tmpDir);

    //copy repl
    fs.copyFileSync(
      path.join(ROOT, "ncq/repl.js"),
      path.join(tmpDir, "repl.js")
    );
    //copy dependant files
    fse.copySync(path.join(ROOT, "ncq/ui"), path.join(tmpDir, "ui"));
    fs.copyFileSync(
      path.join(ROOT, "package.json"),
      path.join(tmpDir, "package.json")
    );
    fs.copyFileSync(
      path.join(ROOT, "package-lock.json"),
      path.join(tmpDir, "package-lock.json")
    );

    //change directory
    process.chdir(tmpDir);
    // install packages within that directory
    cprocess.execSync("npm install " + required.join(" ") + " --save", {
      stdio: [process.stdin, process.stdout, process.stdout],
    });
    this.resetStdin();

    //do repl
    var args = ["repl.js"];
    args.push(required);
    args.push("--save");
    cprocess.execSync("node repl.js " + required.join(" "), {
      stdio: "inherit",
    });

    //return to our directory
    process.chdir(ROOT);
    //delete the temporary folder
    rimraf.sync(tmpDir);
  }
}

loadPackages();

var myPrompt = new PromptHandler(SuggestionPrompt, {
  choices : packages.slice(),
});
//myPrompt.run();


// var myPrompt = new PromptHandler(packages.slice());

new ncqCmd(myPrompt).run();
