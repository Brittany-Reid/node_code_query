const fs = require("fs");
const path = require("path");
const natural = require("natural");
const stopword = require("stopword");

class DataHandler {
  constructor() {

    //stopword language
    this.language = stopword.en;
    //regex for removing all non-alpha numeric characters
    this.NONALPHANUMREGX = /[^a-z0-9 ]+/g;
    this.tasks = new Map();
    //map of ids to code snippets
    this.snippets = new Map();
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
    if (this.packageToSnippet.has(task)) {
      ids = this.packageToSnippet.get(task);
    } else {
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
    }

    //if we got no ids
    if (ids.length < 1){
      return [];
    }

    var snippets = [];
    for (var id of ids) {
      var snippet = this.snippets.get(id);
      snippets.push(snippet);
    }

    return snippets;
  }

  getTasks() {
    return this.tasks;
  }

  async loadTasks(file_path) {
    var file = await fs.promises.readFile(file_path, "utf-8");
    const lines = file.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      var parts = line.split(", ");
      //for now handle some bugged tasks
      var task = parts[0].replace(/(<(\/?)tt>)/g, "").replace("  ", " ");
      var packages = parts.slice(1);
      this.tasks.set(task, packages);
    }
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
   * Gets array of keywords from a given string.
   */
  getKeywords(string) {
    var text = string.toLowerCase().replace(this.NONALPHANUMREGX, "");
    var words = text.split(" ");
    //remove stopwords
    words = stopword.removeStopwords(words, this.language);
    words = words.filter(function (e) {
      if (e != "") return true;
    });
    //do some nlp stuff here
    return words;
  }

  /**
   * Loads snippets from directory.
   */
  async loadSnippets(dir) {
    var files = fs.readdirSync(dir);

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      const filepath = path.join(dir, file);
      const text = fs.readFileSync(filepath, "utf8");
      var extension = path.extname(file);
      if (extension != ".ignore" && extension != ".desc") {
        var name = path.basename(file).split(".")[0];
        var description = "";
        var snippet = "";
        await text.split("\n").forEach(function (line) {
          //comments
          if (line.trim().startsWith("#")) {
            description += line.substring(1).trim() + "\n";
            line = "//" + line.substring(1);
          }

          snippet += line + "\n";
          
          // //snippet
          // else if (line.trim()) {
          //   snippet += line + "\n";
          // }
        });
        var id = this.snippets.size;
        if (snippet) {
          this.snippets.set(id, snippet);
          if (this.packageToSnippet.has(name)) {
            var snippets = this.packageToSnippet.get(name);
            snippets.push(id);
            this.packageToSnippet.set(name, snippets);
          } else {
            var snippets = [id];
            this.packageToSnippet.set(name, snippets);
          }
        }

        if (description) {
          var keywords = await this.getKeywords(description);
          keywords = this.stem(keywords);
          for await (var word of keywords) {
            if (!this.keyWordMap.has(word)) {
              this.keyWordMap.set(word, [id]);
            } else {
              var ids = this.keyWordMap.get(word);
              ids.push(id);
              this.keyWordMap.set(word, ids);
            }
          }
        }
      }
    }
  }
}

module.exports = DataHandler;
