const fs = require("fs");
const path = require("path");
const readline = require("readline");

class DataHandler {
  constructor() {
    this.tasks = new Map();
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

  async loadPackges(snippetsDir){
    this.packages = [];

    var files = await fs.promises.readdir(snippetsDir);

    files.forEach((file) => {
      var fPath = path.join(snippetsDir, file);
      var ext = path.extname(fPath);
      if (ext === ".desc") {
        this.packages.push(path.basename(file, ext));
      }
    });
    return this.packages;
  }
}

// const {Input} = require("enquirer");
// new Input({multiline:true}).run();

module.exports = DataHandler;
