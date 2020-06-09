const fs = require("fs");
const path = require("path");
const htmlparser = require("htmlparser2");


/*
 * Analyse snippets extracted from a random sample of packages.
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
const DATABASE_DIR = path.join(BASE, "data/readmes.json");
const README_DIR = path.join(BASE, "data/SampleReadmes.json");
const SNIPPET_DIR = path.join(BASE, "analysis/results/snippets.txt")
const StreamObject = require("stream-json/streamers/StreamObject");
const FENCE = /^\`\`\`([\w_-]+)?\s*$/;
const HEADER = /^#+\s+\S+/;

/**
 * Gets 384 random readme files and saves them into README_DIR.
 */

 async function getRandomReadmes(){

  //first, get number of packages
  var counter = 0;


  function onData(){
    counter++;
  }

  function onEnd(){
    console.log(counter);
  }

  //await readFile(onData, onEnd);

  counter = 925317; //if we know the value already

  //get 384 random indexes
  var samples = 384;
  var list = [];

  //generate a list of 1-count
  for(var i=0; i<counter; i++){
    list.push(i);
  }

  list = shuffle(list);

  //get the random sample
  var sample = list.slice(0, samples);

  //sort so we can look in order
  sample.sort((a, b) => a - b);


  //add to object
  var readmes = {};
  var counter2 = 0;
  var i = 0;

  function onData(data, pipeline){
    var name = data["key"];
    var readme = data["value"];
    //add if matches in sample
    if(counter2 == sample[i]){
      //the package names are formatted for windows file names, change back
      name = name.replace(/%2A/g, "*");
      name = name.replace(/%2A/g, "/");
      name = name.replace(/%2E/g, ".");
      readmes[name] = readme;
      //increment the next to look for
      i++;
    }
    counter2++;
  }

  await readFile(onData);

  //write readmes to file
  fs.writeFileSync(README_DIR, JSON.stringify(readmes), {encoding:"utf-8"});

 }

/**
 * Uses stream-json to load the database without storing it into memory.
 * Returns a promise when the end event triggers.
 */
 async function readFile(onData = function(){}, onEnd = function(){}){
  return promise = new Promise((resolve, reject) => {
    //create pipeline
    const pipeline = fs.createReadStream("data/readmes.json").pipe(StreamObject.withParser());

    //on data, load into memory
    pipeline.on("data", async (data) => {
      onData(data, pipeline);
    });
    //when done, process
    pipeline.on("end", (data) => {
      onEnd();
      resolve();
    });
  });
 }

 /**
  * Array shuffle function using Fisher-Yates
  * Copied from: https://stackoverflow.com/a/2450976
  */
 function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


/**
 * Process for snippets.
 */
function main(){
  var data = JSON.parse(fs.readFileSync(README_DIR));
  var packages = Object.keys(data);

  var allSnippets = [];
  
  for (let i = 0; i < packages.length; i++) {
    var name = packages[i];
    var readme = data[name];
    
    //get snippets
    var snippets = getSnippets(readme, name);
    
    // console.log(snippets);
    
    
    allSnippets.push(snippets);
  }

  //console.log(JSON.stringify(allSnippets, null, 1))

  fs.writeFileSync(SNIPPET_DIR, JSON.stringify(allSnippets, null, 1), {encoding: "utf-8"});
}

/**
 * Extract snippets from readme file.
 * Ignore code blocks marked with non-js
 */
function getSnippets(readme, package) {
  var snippets = [];
  var snippetObject = {};
  var snippetList = {};
  snippetList["package"] = package;


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
          snippetObject["description"] = getDescription(lines, start);
          snippetObject["snippet"] = block;
          snippets.push(snippetObject);
          snippetObject = {};
        }
        block = false;
      }
    } else if (block !== false) {
      block += line + "\n";
    }
  });

  snippetList["snippets"] = snippets;

  return snippetList;
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

//comment out unless u need to generate a new set of readmes
//getRandomReadmes();
main();
