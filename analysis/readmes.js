const fs = require("fs");
const path = require("path");
const htmlparser = require("htmlparser2");

/**
 * Analyse the contents of the 100 most depended upon packages.
 */

var dir = __dirname;
//fall back if we run from node_code_query/dir
if (
  path.dirname(dir) != "node_code_query" &&
  path.dirname(dir) != "node_code_query/"
) {
  dir = path.join(dir, "../");
}
const BASE = dir;
const README_DIR = path.join(BASE, "data/100MostDependedUpon.json");
const FENCE = /^\`\`\`([\w_-]+)?\s*$/;
const HEADER = /^#+\s+\S+/;

var snippetSet = {};

var allSnippets = [];

function removeHTML(readme) {
  var result = [];
  var parser = new htmlparser.Parser(
    {
      ontext: function (text) {
        result.push(text);
      },
    },
    { decodeEntities: true }
  );

  parser.write(readme);

  return result;
}

/**
 * Look upwards from start point for a description of the code snippet.
 */
function getDescription(lines, start){
  var description = "";
  for (let i = start-1; i > 0; i--) {
    var line = lines[i];
    //stop at header
    if(line.trim().match(HEADER)){
      //include header
      description = line + "\n" + description;
      break;
    }
    //stop at another snippet
    if(line.trim().match(FENCE)){
      break;
    }
    description = line + "\n" + description;
  }

  return description;
}

/**
 * Extract snippets from readme file.
 * Ignore code blocks marked with non-js
 */
function getSnippets(readme, package) {
  var snippets = [];
  var snippetObject = {};

  var lines = readme.split("\n");
  var block = false;
  var opening;
  var start = -1;
  lines.forEach((line, index) => {
    var match = line.match(FENCE);
    if (match) {
      if (block == false) {
        //start new code block
        block = "";
        opening = match;
        start = index;
      } else {
        //finish block
        //ignore anything explicitly marked as non js
        if (opening[0] == "```js" || opening[0] == "```") {
          snippetObject["package"] = package;
          snippetObject["description"] = getDescription(lines, start);
          snippetObject["snippet "] = block;
          snippets.push(snippetObject);
          snippetObject = {};
        }
        block = false;
      }
    } else if (block !== false) {
      block += line + "\n";
    }
  });

  return snippets;
}

async function main() {
  var data = JSON.parse(fs.readFileSync(README_DIR));
  var packages = Object.keys(data);

  for (let i = 0; i < packages.length; i++) {
    var name = packages[i];
    var readme = data[name];

    //get snippets
    var snippets = getSnippets(readme, name);

    console.log(snippets);


    //remove html elements
    //readme = removeHTML(readme);

    allSnippets = allSnippets.concat(snippets);
  }

  
}

main();
