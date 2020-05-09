const repl = require("repl");
const PromptReadable = require("./ui/prompt-readable");
const path = require("path");
const natural = require("natural");
const en = require("stopwords").english;
const fs = require("fs");

/*Constants*/
var BASE = __dirname;
parts = BASE.split("/");
if (parts[parts.length - 1] != "node_code_query") {
  BASE = path.join(BASE, "..");
}
const version = "1.0.0";
const snippets_dir = path.join(BASE, "data/snippets");
const threshold_sim = 0.25;
const tname = "NCQ";
const NUM_KEYWORDS = 20;

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

//get arguments
ARG_PACKS = process.argv
  .slice(2)
  .reduce((acc, y) => {
    acc = acc + y + " ";
    return acc;
  }, "")
  .trim();

/* read description of snippets from snippets dir and update variable
 * library_desc and snippets */
fs.readdir(snippets_dir, (err, files) => {
  files.forEach(file => {
      const filepath = path.join(snippets_dir, file);
      const text = fs.readFileSync(filepath, 'utf8');
      // update dictionaries with library and snippet descriptions
      extension = path.extname(file)
      if (extension == ".desc") {
          name = path.basename(file, ".desc")
          library_desc[name] = text;
          tfidf.addDocument(name);
          tfidf.addDocument(removeStopWords(text));
      } else if (extension != ".ignore") {
          // associate snippets to packages
          name = path.basename(file).split(".")[0];
          set = snippets[name]
          if (set === undefined) {
              set = new Set()
              snippets[name] = set
          }
          set.add(text)
      }
  });
});

/* remove stopwords from text */
function removeStopWords(text) {
  textClean = "" 
  text.split(" ").forEach(s => { if (!en.includes(s.trim())) textClean = textClean+" "+s })
  return textClean;
}

//get a readable that uses prompts for input
var pReadable = new PromptReadable(["This is a suggestion."], tname, "["+ARG_PACKS+"]");

//set up repl with this as input and stdout as output
var myRepl = repl.start({
  prompt: "",
  ignoreUndefined: true,
  input: pReadable,
  output: process.stdout,
});

/*
REPL functions:
*/

/**
 * REPL exit command.
 */
Object.assign(myRepl.context, {
  exit(string) {
    process.exit(0);
  },
});

/**
 * REPL help command.
 */
Object.assign(myRepl.context, {
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
});

/**
 * REPL version command.
 */
Object.assign(myRepl.context, {
  version() {
    console.log(`Node Query Library (NQL) version ${version}`);
  },
});

/**
 *  list_snippets
 */
Object.assign(myRepl.context, {
  samples(string) {
    set = snippets[string.trim()];
    if (set == undefined) {
      console.log("could not find any sample for this package");
    } else {
      set.forEach((s) => {
        console.log(s.trim());
        console.log("-----");
      });
    }
  },
});
