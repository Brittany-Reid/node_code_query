const Snippet = require("./snippet");
const Package = require("./package");

const FlexSearch = require("flexsearch");
const fs = require("fs");
const path = require("path");
const natural = require("natural");
const stopword = require("stopword");
const ProgressMonitor = require("progress-monitor");

function encode(str) {
  var words = DataHandler.keywords(str);
  return words.join(" ");
}

class DataHandler {
  constructor() {
    //limit on snippets
    this.limit = 0;
    //stopword language
    this.language = stopword.en;
    //regex for removing all non-alpha numeric characters
    this.NONALPHANUMREGX = /[^a-zA-Z0-9 ]+/g;
    //regex for task chars
    this.TASKPUNCT = /[,-]+/g;

    this.idToPackage = new Map(); //id to package object. ids are generated, not part of the dataset
    this.nameToId = new Map();
    this.snippets = []; //id to snippet object, ids are associated in the dataset

    this.packageIndex;
    this.snippetIndex;

    this.tasks = new Map();
  }

  /**
   * Returns set of tasks as an array.
   */
  getTaskArray() {
    return Array.from(this.tasks.keys());
  }
  /**
   * Return array of `Snippet` objects that match a given package name.
   * @param {String} packageName - The package to look for associated snippets.
   */
  packageToSnippets(packageName) {
    var result = this.snippetIndex.where({ package: packageName });

    var snippets = [];
    for (var r of result) {
      var id = r.id;
      var object = this.snippets[id];

      snippets.push(object);
    }

    return snippets;
  }

  /**
   * Returns an array of `Package` objects that match a given task.
   * @param {String} task - Task to search with.
   */
  taskToPackages(task) {
    var result = this.packageIndex.search({ query: task, limit: this.limit });

    var packages = [];
    for (var r of result) {
      var id = r.id;
      var object = this.idToPackage.get(id);

      packages.push(object);
    }

    return packages;
  }

  taskToSnippets(task) {
    var result = this.snippetIndex.search({ query: task, limit: this.limit });

    var snippets = [];
    for (var r of result) {
      var id = r.id;
      var object = this.snippets[id];

      snippets.push(object);
    }

    return snippets;
  }

  loadPackages(info_dir, db_dir, monitor) {
    if (monitor) {
      monitor = ProgressMonitor.adjustTotal(monitor, 100);
      monitor.emit("start");
    }
    var data = fs.readFileSync(info_dir, { encoding: "utf-8" });

    //parse
    data = JSON.parse(data);

    var interval = Math.round(data.length / 91);
    var i = 0;
    for (var packData of data) {
      if (i != 0 && i % Math.floor(interval) == 0) {
        if (monitor) monitor.emit("work", 1);
      }
      var packageObject = new Package(packData, i);

      var name = packData["Name"];
      this.nameToId.set(name, i);

      //add to map
      this.idToPackage.set(i, packageObject);
      i++;
    }

    var database = fs.readFileSync(db_dir, { encoding: "utf-8" });

    this.packageIndex = new FlexSearch("memory", {
      tokenize: "strict", //opposed to splitting a word into f/fi/fil/file our search is non specific enough as is
      doc: {
        id: "id", //index by name for fast look up
        field: ["Description", "Keywords"],
      },
      encode: encode,
    });

    this.packageIndex.import(database);

    if (monitor) monitor.emit("end");
  }

  loadSnippets(snippet_dir, db_dir, monitor) {
    if (monitor) {
      monitor = ProgressMonitor.adjustTotal(monitor, 100);
      monitor.emit("start");
    }

    var data = fs.readFileSync(snippet_dir, { encoding: "utf-8" });

    //parse
    data = JSON.parse(data);

    var interval = Math.round(data.length / 91);

    //for each package
    var i = 0;
    for (var packData of data) {
      if (i != 0 && i % Math.floor(interval) == 0) {
        if (monitor) monitor.emit("work", 1);
      }

      //get package name
      var name = packData["package"];

      var snippets = packData["snippets"];
      for (var snippet of snippets) {
        //get snippet info
        var code = snippet["snippet"];
        var id = snippet["id"];

        var order = snippet["num"];

        var packageInfo = this.idToPackage.get(this.nameToId.get(name));

        var snippetObject = new Snippet(code, id, name, order, packageInfo);

        this.snippets[id] = snippetObject;
      }

      i++;
    }

    var database = fs.readFileSync(db_dir, { encoding: "utf-8" });

    this.snippetIndex = new FlexSearch("memory", {
      tokenize: "strict",
      doc: {
        id: "id",
        field: ["description"],
      },
      encode: encode,
    });

    this.snippetIndex.import(database);

    if (monitor) monitor.emit("end");
  }

  /**
   *
   * @param {String} dir
   * @param {ProgressMonitor} monitor
   */
  loadTasks(dir, monitor) {
    if (monitor) {
      monitor = ProgressMonitor.adjustTotal(monitor, 100);
      monitor.emit("start");
    }

    var file = fs.readFileSync(dir, { encoding: "utf-8" });

    //get lines
    var lines = file.split("\n");

    var interval = lines.length / 91;

    //for each line
    for (let i = 0; i < lines.length; i++) {
      if (i != 0 && i % Math.floor(interval) == 0) {
        if (monitor) monitor.emit("work", 1);
      }

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

    if (monitor) monitor.emit("end");
  }

  /**
   * Process string for keywords.
   */
  static process(string) {
    //all lowercase
    var processed = string.toLowerCase();

    //remove extra whitespace on ends
    processed = processed.trim();

    //replace newlines with spaces
    processed = processed.replace(/\n/g, " ");

    //remove any non alphanum chars
    processed = processed.replace(this.NONALPHANUMREGX, "");

    //find any blocks of whitespace and make sure they are only spaces
    processed = processed.replace(/\s+/g, " ");

    return processed;
  }

  static keywords(string) {
    string = this.process(string);

    var words = string.split(" ");
    //remove stop words
    words = stopword.removeStopwords(words, this.language);
    //stem
    words = words.map((word) => {
      const cleanWord = word.replace(/[^a-zA-Z ]/g, "");
      return natural.PorterStemmer.stem(word);
    });
    return words;
  }

  /**
   * Formats a task for us. Can return null *in the future, if we want to filter out some tasks.
   */
  processTask(task) {
    //normalize to lowercase
    task = task.toLowerCase();
    //remove extra whitespace on ends
    task = task.trim();

    //replace punctuation with space
    task = task.replace(this.TASKPUNCT, " ");
    //find any blocks of whitespace and make sure they are only spaces
    task = task.replace(/\s+/g, " ");

    //alphanum only
    if (task.match(this.NONALPHANUMREGX)) {
      return;
    }

    return task;
  }
}

// var data = new DataHandler();
// data.loadPackages("data/packageStats.json", "data/packageDB.txt");
// data.loadSnippets("data/snippets.json", "data/snippetDB.txt");
// data.loadTasks("data/id,tasks.txt");

// data.taskToPackages("read");
// console.log(data.taskToSnippets("read").length);
// data.packageToSnippets("3box-react-hooks");

module.exports = DataHandler;
