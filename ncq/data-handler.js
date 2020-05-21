const fs = require("fs");
const readline = require("readline");

class DataHandler {
  constructor() {
    this.tasks = {};
  }

  getTasks() {
    return this.tasks;
  }

  async loadTasks(path) {
    var file = await fs.promises.readFile(path, "utf-8");
    const lines = file.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      var parts = line.split(", ");
      var task = parts[0].replace(/(<(\/?)tt>)/g, "");
      var packages = parts.slice(1);
      this.tasks[task] = packages;
      console.log(this.tasks);
    }
  }
}

// async function main() {
//   var dh = new DataHandler();
//   await dh.loadTasks("data/tasks.txt");
//   console.log(dh.getTasks());
// }

// main();

module.exports = DataHandler;
