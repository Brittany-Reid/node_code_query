const repl = require("repl");
const PromptReadable = require("./ui/prompt-readable");
const path = require("path");
const natural = require("natural");
const en = require("stopwords").english;
const fs = require("fs");
const cprocess = require("child_process");
const winston = require("winston");
const fse = require("fs-extra");

var BASE = __dirname;
parts = BASE.split("/");
if (parts[parts.length - 1] != "node_code_query") {
  BASE = path.join(BASE, "..");
}

/* library description */
const library_desc = {};
/* snippet description */
const snippets = {};
// keywords extracted from package description and snippet description (needs to clean up)
const tfidf = new natural.TfIdf();
// my stop words
const our_stopwords = [
  "package",
  "js",
  "based",
  "zero",
  "providing",
  "massive",
  "amounts",
];

const LOGDIR = path.join(BASE, "logs/repl");
const SNIPPETDIR = path.join(BASE, "data/snippets");
const VERSION = "1.0.0";
const NAME = "NCQ";
const threshold_sim = 0.25;
const NUM_KEYWORDS = 20;
const ARG_PACKS = process.argv
  .slice(2)
  .reduce((acc, y) => {
    acc = acc + y + " ";
    return acc;
  }, "")
  .trim();
var installedPackages = ARG_PACKS.split(" ");

//set up the repl logger
if (!fs.existsSync(LOGDIR)) {
  //make dir if it doesnt exist
  fse.mkdirSync(LOGDIR, { recursive: true });
}
const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  defaultMeta: { service: "user-service" },
  transports: [
    //debug for debugging
    new winston.transports.File({
      filename: path.join(
        LOGDIR,
        "/debug" + Math.floor(Date.now() / 1000) + ".log"
      ),
      level: "debug",
    }),
    //info for results
    new winston.transports.File({
      filename: path.join(
        LOGDIR,
        "/run" + Math.floor(Date.now() / 1000) + ".log"
      ),
      level: "info",
    }),
  ],
});

var options = {};
var myRepl;

/* remove stopwords from text */
function removeStopWords(text) {
  textClean = "";
  text.split(" ").forEach((s) => {
    if (!en.includes(s.trim())) textClean = textClean + " " + s;
  });
  return textClean;
}
/*
 * Read description of snippets from snippets dir and update variable
 * library_desc and snippets.
 */
function loadSnippets() {
  fs.readdir(SNIPPETDIR, (err, files) => {
    files.forEach((file) => {
      const filepath = path.join(SNIPPETDIR, file);
      const text = fs.readFileSync(filepath, "utf8");
      // update dictionaries with library and snippet descriptions
      extension = path.extname(file);
      if (extension == ".desc") {
        name = path.basename(file, ".desc");
        library_desc[name] = text;
        tfidf.addDocument(name);
        tfidf.addDocument(removeStopWords(text));
      } else if (extension != ".ignore") {
        // associate snippets to packages
        name = path.basename(file).split(".")[0];
        set = snippets[name];
        if (set === undefined) {
          set = new Set();
          snippets[name] = set;
        }
        set.add(text);
      }
    });
  });
}

/**
 * REPL functions.
 */
const state = {
  /**
   * Install passed package.
   * TODO: Handle fail.
   */
  install(string) {
    //get packages
    var packages = string.split(" ");
    //commandline install
    cprocess.execSync("npm install " + packages.join(" ") + " --save", {
      stdio: "inherit",
    });
    installedPackages = installedPackages.concat(packages);
    if(myRepl){
      myRepl.inputStream.setMessage("[" + installedPackages.join(" ") + "]");
    }
  },

  /**
   * Uninstall passed package.
   */
  uninstall(string) {
    //get packages
    var packages = string.split(" ");
    //commandline uninstall
    cprocess.execSync("npm uninstall " + packages.join(" ") + " --save", {
      stdio: "inherit",
    });
    for (let i = 0; i < packages.length; i++) {
      if(installedPackages.includes(packages[i])){
        var index = installedPackages.indexOf(packages[i]);
        installedPackages.splice(index);
      }
    }
    if(myRepl){
      myRepl.inputStream.setMessage("[" + installedPackages.join(" ").trim() + "]");
    }
  },

  samples(string) {
    set = snippets[string.trim()];
    if (set == undefined) {
      console.log("could not find any sample for this package");
    } else {
      //convert set to array
      var array = Array.from(set);
      //set snippets to be cyclable
      myRepl.inputStream.setSnippets(array);
    }
  },

  /**
   * Exit REPL.
   */
  exit(string) {
    process.exit(0);
  },

  /**
   * Print version.
   */
  version(string) {
    console.log(`Node Query Library (NQL) version ${VERSION}`);
  },

  /**
   * Print help.
   */
  help() {
    console.log("<tab>                    shows functions");
    console.log(
      `package(str)             shows description of a given package`
    );
    console.log(
      `samples(str)             lists samples catalogued for that package`
    );
    console.log(
      `tasks(<str>)             lists tasks related to keywords (may involve multiple packages)`
    );
  },
};

function defineReplFunctions() {
  Object.assign(myRepl.context, state);
}

function main() {
  logger.log("debug", "Base directory: " + BASE);
  logger.log("debug", "Logger initialized at: " + LOGDIR);

  loadSnippets();

  //create input readable
  var pReadable = new PromptReadable(
    ARG_PACKS.split(" "),
    NAME,
    "[" + installedPackages.join(" ") + "]",
    []
  );

  //set options
  options = {
    prompt: "",
    ignoreUndefined: true,
    input: pReadable,
    output: process.stdout,
  };

  myRepl = repl.start(options);
  defineReplFunctions();
}

//run if called as main, not if required
if (require.main == module) {
  main();
}

exports.state = state;
exports.loadSnippets = loadSnippets;
