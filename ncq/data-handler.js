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
  }


  /**
   * Returns stemmed keywords.
   */
  stem(words){
    var stemmedWords = [];

    for (var word of words){
      var stem = natural.PorterStemmer.stem(word);
      stemmedWords.push(stem);
    }

    return stemmedWords;
  }

  /**
   * Returns a set of matching code snippets, given a task.
   */
  getSnippetsFor(task) {
    var ids = [];

    var words = this.getKeywords(task);
    words = this.stem(words);

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
    if (ids.length < 1){
      return [];
    }

    var snippets = [];
    for (var id of ids) {
      var snippet = this.idTosnippets.get(id);
      snippets.push(snippet);
    }

    return snippets;
  }

  getTasks() {
    return this.tasks;
  }

  /**
   * Formats a task for us. Can return null *in the future, if we want to filter out some tasks.
   */
  processTask(task){
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
    var file = fs.readFileSync(file_path, {encoding: "utf-8"});
    //get lines
    var lines = file.split("\n");

    //for each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      var split = line.indexOf(", ");
      var id = line.substring(0, split);
      var task = line.substring(split+2);
      task = this.processTask(task);
      //if the task was valid
      if(task){
        var ids = this.tasks.get(task);
        if(!ids){
          ids  = [];
        }
        ids.push(id);
        this.tasks.set(task, ids);
      }
    }

    return this.tasks;
  }

  async loadPackges(dir) {
    this.packages = [];

    var files = await fs.promises.readdir(dir);

    files.forEach((file) => {
      var fPath = path.join(dir, file);
      var ext = path.extname(fPath);
      if (ext === ".desc") {
        this.packages.push(path.basename(file, ext));
      }
    });
    return this.packages;
  }

  /**
   * Process string for keywords.
   */
  process(string){
    //all lowercase
    var processed= string.toLowerCase();

    //should remove markdown tables here TODO

    //replace newlines with spaces
    processed = processed.replace(/\n/g, " ");

    //remove any non alphanum chars
    processed = processed.replace(this.NONALPHANUMREGX, "");

    return processed;
  }

  /**
   * Gets array of keywords from a given string.
   */
  getKeywords(string) {
    //process string
    var text = this.process(string);
    var words = text.split(" ");
    //remove stopwords
    words = stopword.removeStopwords(words, this.language);
    words = words.filter(function (e) {
      if (e != "") return true;
    });
    return words;
  }

  /**
   * Loads snippets, if an event emitter, will send events 10 times then at end.
   * The event emitter is optional, and handled elsewhere. DataHandler should not care about
   * UI, and be usable within different contexts (if we wanted to do a webapp).
   */
  loadSnippets(dir, eventEmiter){
    var count = 0;
    var packageNum = 0;

    //read in file
    var data = fs.readFileSync(dir, {encoding: "utf-8"});

    //parse
    data = JSON.parse(data);
    
    //we do the progress interval here, it wont be exact but it should average out
    var interval = Math.round(data.length/9);

    //for each package
    for(var packData of data){

      //emit progress, accept 0 interval progress to report for the original file read as well
      if(packageNum % interval == 0){
        if(eventEmiter){
          eventEmiter.emit("progress");
        }
      }


      //get package name
      var name = packData["package"];

      var snippets = packData["snippets"];
      for(var snippet of snippets){
        //exit if we hit max
        if(count > this.MAX && this.MAX != -1){
          break;
        }

        //get snippet info
        var code = snippet["snippet"];
        var id = snippet["id"];
        var order = snippet["num"];
        var description = snippet["description"];

        //snippet map
        this.idTosnippets.set(id, code);

        //package to ids
        var packSnippets = this.packageToSnippet.get(name);
        //if doesnt already exist, init array
        if(!packSnippets){
          packSnippets = [];
        }
        packSnippets.push(id);
        this.packageToSnippet.set(name, packSnippets);        

        //get keywords
        var keywords = this.getKeywords(description);
        keywords = this.stem(keywords);

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

    if(eventEmiter){
      eventEmiter.emit("end");
    }
  }

  //old load snippets

  // /**
  //  * Loads snippets from directory.
  //  */
  // async loadSnippets(dir) {
  //   var files = fs.readdirSync(dir);

  //   for (var i = 0; i < files.length; i++) {
  //     var file = files[i];
  //     const filepath = path.join(dir, file);
  //     const text = fs.readFileSync(filepath, "utf8");
  //     var extension = path.extname(file);
  //     if (extension != ".ignore" && extension != ".desc") {
  //       var name = path.basename(file).split(".")[0];
  //       var description = "";
  //       var snippet = "";
  //       await text.split("\n").forEach(function (line) {
  //         //comments
  //         if (line.trim().startsWith("#")) {
  //           description += line.substring(1).trim() + "\n";
  //           line = "//" + line.substring(1);
  //         }

  //         snippet += line + "\n";
          
  //         // //snippet
  //         // else if (line.trim()) {
  //         //   snippet += line + "\n";
  //         // }
  //       });
  //       var id = this.snippets.size;
  //       if (snippet) {
  //         this.snippets.set(id, snippet);
  //         if (this.packageToSnippet.has(name)) {
  //           var snippets = this.packageToSnippet.get(name);
  //           snippets.push(id);
  //           this.packageToSnippet.set(name, snippets);
  //         } else {
  //           var snippets = [id];
  //           this.packageToSnippet.set(name, snippets);
  //         }
  //       }

  //       if (description) {
  //         var keywords = await this.getKeywords(description);
  //         keywords = this.stem(keywords);
  //         for await (var word of keywords) {
  //           if (!this.keyWordMap.has(word)) {
  //             this.keyWordMap.set(word, [id]);
  //           } else {
  //             var ids = this.keyWordMap.get(word);
  //             ids.push(id);
  //             this.keyWordMap.set(word, ids);
  //           }
  //         }
  //       }
  //     }
  //   }
  // }
}

// var data = new DataHandler();
// data.loadTasks("data/id,tasks.txt");
// console.log(data.tasks.size);
//data.MAX = 10;
// data.loadSnippets("data/snippets.json");
// console.log(data.getSnippetsFor("read a file").length);

module.exports = DataHandler;
