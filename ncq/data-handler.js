const Snippet = require("./snippet");
const Package = require("./package");

const fs = require("fs");
const path = require("path");
const natural = require("natural");
const stopword = require("stopword");

class DataHandler {
  constructor() {
    //max number of snippets to load, default value
    this.MAX = -1;
    //stopword language
    this.language = stopword.en;
    //regex for removing all non-alpha numeric characters
    this.NONALPHANUMREGX = /[^a-z0-9 ]+/g;
    this.tasks = new Map();
    //map of ids to code snippets
    this.idTosnippets = new Map();
    //map of package name to array of snippet ids
    this.packageToSnippet = new Map();
    //map of keywords to array of snippet ids
    this.keyWordMap = new Map();
    //map of package keywords to package name
    this.packageKeywords = new Map();
    //map of package name to packageInfo
    this.packageToInfo = new Map();
  }

  /**
   * Returns list of package names based on a task.
   */
  getPackages(task){
    var names = [];

    //get keywords
    var words = this.getKeywords(task);

    //for each word
    for (var word of words) {
      var currentNames = this.packageKeywords.get(word);
      if(currentNames){
        if(names.length < 1){
          names = currentNames;
        }
        else{
          //match all words
          names = names.filter(function (e){
            if(currentNames.includes(e)){
              return true;
            }
          })
        }
      }
    }

    return names;

  }

  /**
   * Return the set of snippets for a package.
   */
  getPackageSnippets(packageName) {
    //get ids from name to id map
    var ids = this.packageToSnippet.get(packageName);

    //get snippets
    var snippets = [];
    for(var id of ids){
      var current = this.idTosnippets.get(id);
      snippets.push(current);
    }

    return snippets;
  }

  /**
   * Returns a set of matching code snippets, given a task.
   */
  getSnippetsFor(task) {
    var ids = [];

    var words = this.getKeywords(task);

    //for each word
    for (var word of words) {
      //get associated ids
      var wordIds = this.keyWordMap.get(word);
      if (wordIds) {
        //if first
        if (ids.length < 1) {
          ids = wordIds;
        } else {
          //if not, flter ids to those that match all words
          ids = ids.filter(function (e) {
            if (wordIds.includes(e)) {
              return true;
            }
          });
        }
      }
    }

    //if we got no ids
    if (ids.length < 1) {
      return [];
    }

    var snippets = [];
    for (var id of ids) {
      var snippet = this.idTosnippets.get(id);
      snippets.push(snippet);
    }

    return snippets;
  }

  /**
   * Formats a task for us. Can return null *in the future, if we want to filter out some tasks.
   */
  processTask(task) {
    //remove extra whitespace on ends
    task = task.trim();
    //find any blocks of whitespace and make sure they are only spaces
    task = task.replace(/\s+/g, " ");
    //normalize to lowercase
    task = task.toLowerCase();
    return task;
  }

  /**
   * Loads in tasks from task file, returns task map.
   */
  loadTasks(file_path) {
    //read file into memory
    var file = fs.readFileSync(file_path, { encoding: "utf-8" });
    //get lines
    var lines = file.split("\n");

    //for each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      var split = line.indexOf(", ");
      var id = line.substring(0, split);
      var task = line.substring(split + 2);
      task = this.processTask(task);
      //if the task was valid
      if (task) {
        var ids = this.tasks.get(task);
        if (!ids) {
          ids = [];
        }
        ids.push(id);
        this.tasks.set(task, ids);
      }
    }

    return this.tasks;
  }

  /**
   * Process string for keywords.
   */
  process(string) {
    //all lowercase
    var processed = string.toLowerCase();

    //should remove markdown tables here TODO

    //replace newlines with spaces
    processed = processed.replace(/\n/g, " ");

    //remove any non alphanum chars
    processed = processed.replace(this.NONALPHANUMREGX, "");

    return processed;
  }

  
  /**
   * Returns stemmed keywords.
   */
  stem(words) {
    var stemmedWords = [];

    for (var word of words) {
      var stem = natural.PorterStemmer.stem(word);
      stemmedWords.push(stem);
    }

    return stemmedWords;
  }

  /**
   * Gets array of keywords from a given string.
   */
  getKeywords(string, npmKeywords) {
    //process string
    var text = this.process(string);
    var words = text.split(" ");
    //remove stopwords
    words = stopword.removeStopwords(words, this.language);
    words = words.filter(function (e) {
      if (e != "") return true;
    });

    //if we already have some keyword array, join here
    if(npmKeywords){
      words = words.concat(npmKeywords);
    }

    //stem
    words = this.stem(words);

    //remove duplicates
    words = words.filter(function(e, i){
      //will be true only on first occurance
      return words.indexOf(e) == i;
    })

    return words;
  }

  /**
   * Loads snippets, if an event emitter, will send events 10 times then at end.
   * The event emitter is optional, and handled elsewhere. DataHandler should not care about
   * UI, and be usable within different contexts (if we wanted to do a webapp).
   */
  loadSnippets(dir, eventEmiter) {
    var count = 0;
    var packageNum = 0;

    //read in file
    var data = fs.readFileSync(dir, { encoding: "utf-8" });

    //parse
    data = JSON.parse(data);

    //we do the progress interval here, it wont be exact but it should average out
    var interval = Math.round(data.length / 9);

    //for each package
    for (var packData of data) {
      //emit progress, accept 0 interval progress to report for the original file read as well
      if (packageNum % interval == 0) {
        if (eventEmiter) {
          eventEmiter.emit("progress");
        }
      }

      //get package name
      var name = packData["package"];

      var snippets = packData["snippets"];
      for (var snippet of snippets) {
        //exit if we hit max
        if (count > this.MAX && this.MAX != -1) {
          break;
        }

        //get snippet info
        var code = snippet["snippet"];
        var id = snippet["id"];
        var order = snippet["num"];
        var description = snippet["description"];

        var snippetObject = new Snippet(code, id, name, order);

        //snippet map
        this.idTosnippets.set(id, snippetObject);

        //package to ids
        var packSnippets = this.packageToSnippet.get(name);
        //if doesnt already exist, init array
        if (!packSnippets) {
          packSnippets = [];
        }
        packSnippets.push(id);
        this.packageToSnippet.set(name, packSnippets);

        //get keywords
        var keywords = this.getKeywords(description);

        //index keywords with ids
        for (var word of keywords) {
          var wordIds = this.keyWordMap.get(word);

          //init if it doesnt exist
          if (!wordIds) {
            wordIds = [];
          }

          //add and set
          wordIds.push(id);
          this.keyWordMap.set(word, wordIds);
        }

        count++;
      }

      packageNum++;
    }

    if (eventEmiter) {
      eventEmiter.emit("end");
    }
  }

  loadInfo(dir) {
    var id = 0;

    //read in file
    var data = fs.readFileSync(dir, { encoding: "utf-8" });

    data = JSON.parse(data);

    //for each package entry
    for (var pk of data) {
      //create object from JSON
      var packageObject = new Package(pk, id);

      //get name
      var name = packageObject.name;

      //add to map
      this.packageToInfo.set(name, packageObject);

      //get description
      var description = packageObject.description;
      //get npm keywords
      var npmKeywords = packageObject.keywords;

      //get keywords
      var keywords = this.getKeywords(description, npmKeywords);

      for(var word of keywords){
        var names = this.packageKeywords.get(word);
        if(!names){
          names = [];
        }
        names.push(name);
        this.packageKeywords.set(word, names);
      }

      //increment id
      id++;
    }

    return this.packageToInfo;
  }
}

// var data = new DataHandler();
// data.loadInfo("data/packageStats.json");
// var packages = data.getPackages("read files");
// console.log(packages);
// console.log(data.packageToInfo.size);
// data.loadSnippets("data/snippets.json");
// console.log(data.getSnippetsFor("read a file").length);
// var data = new DataHandler();
// data.loadTasks("data/id,tasks.txt");

//data.MAX = 10;
// data.loadSnippets("data/snippets.json");
// console.log(data.getSnippetsFor("read a file").length);

module.exports = DataHandler;
