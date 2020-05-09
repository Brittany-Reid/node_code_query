const es = require("event-stream");
var readline = require("readline");

/**
 * Adapted from python Cmd. Extend to add or overwrite functions.
 */
class Cmd {
  constructor(input=process.stdin, output=process.stdout) {
    this.input = input;
    this.output = output;
    this.lastcmd = "";
    this.doc_leader = "";
    this.doc_header = "Documented commands (type help <topic>):";
    this.misc_header = "Miscellaneous help topics:";
    this.undoc_header = "Undocumented commands:";
    this.nohelp = "*** No help on ";
    this.ruler = "=";
  }

  /**
   * Main run function. Starts up the cmd.
   */
  run() {
    //begin taking input
    this.acceptInput();
  }

  /**
   * Accepst input from stdin.
   */
  acceptInput() {
    //process.stdin.pipe(es.split()).on("data", this.oncmd.bind(this));

    var rl = readline.createInterface({
      input: this.input,
      output: this.output,
      terminal: false,
    });
    rl.on("line", this.oncmd.bind(this));
  }

  oncmd(line) {
    var parsed = this.parseline(line);
    var cmd = parsed[0];
    var args = parsed[1];

    if (line == "") {
      return this.emptyline();
    }
    if (!line) {
      return this.emptyline();
    }
    if (!cmd) {
      return this.default(line);
    }
    this.lastcmd = line;
    if (cmd === "") {
      return this.default(line);
    } else {
      var fn = "do_" + cmd;
      var func = this[fn];
      if (!(typeof func === "function")) {
        return this.default(line);
      }
      return func.call(this, args);
    }
  }

  getnames() {
    let methods = new Set();
    var obj = this;
    while ((obj = Reflect.getPrototypeOf(obj))) {
      let keys = Reflect.ownKeys(obj);
      keys.forEach((k) => methods.add(k));
    }
    return methods;
  }

  parseline(line) {
    line = line.trim();
    if (!line) {
      return [null, null, line];
    } else if (line[0] === "?") {
      line = "help " + line.substring(1);
    }
    var i = 0;
    for (let index = 0; index < line.length; index++) {
      let n = line.charCodeAt(index);
      if (
        !(n > 47 && n < 58) &&
        !(n >= 65 && n < 91) &&
        !(n >= 97 && n < 123) &&
        !(n == 95)
      ) {
        break;
      }
      i++;
    }
    var cmd = line.substring(0, i);
    var args = line.substring(i).trim();
    return [cmd, args, line];
  }

  help_exit(arg) {
    console.log("Exits the application. Shorthand: Ctrl-D.");
  }

  do_exit(arg) {
    process.exit(0);
  }

  help_help(arg) {
    console.log(
      'List available commands with "help" or detailed help with "help cmd".'
    );
  }

  do_help(arg) {
    if (arg) {
      var fn = "help_" + arg;
      var func = this[fn];
      if (!(typeof func === "function")) {
        console.log(this.nohelp + arg);
        return;
      }
      return func.call(this);
    } else {
      var names = this.getnames();
      var cmds_doc = [];
      var cmds_undoc = [];
      var help = {};
      names.forEach((name) => {
        if (name.substring(0, 5) == "help_") {
          help[name.substring(5)] = 1;
        }
        if (name.substring(0, 3) === "do_") {
          var cmd = name.substring(3);
          if (help[cmd]) {
            cmds_doc.push(cmd);
            delete help[cmd];
          } else {
            cmds_undoc.push(cmd);
          }
        }
      });
    }
    console.log(this.doc_leader);
    this.print_topics(this.doc_header, cmds_doc, 15, 80);
    this.print_topics(this.misc_header, Object.keys(help), 15, 80);
    this.print_topics(this.undoc_header, cmds_undoc, 15, 80);
  }

  print_topics(header, cmds, cmdlen, maxcol) {
    if (cmds && cmds.length != 0) {
      console.log(header);
      if (this.ruler && this.ruler != "") {
        console.log(this.ruler.repeat(header.length));
      }
      this.columnize(cmds, maxcol - 1);
      console.log();
    }
  }

  columnize(list = [], displaywidth = 80) {
    if (!list || list === []) {
      console.log("<empty>");
      return;
    }

    var size = list.length;
    if (size === 1) {
      console.log(list[0]);
      return;
    }
    var nr,
      nc,
      cwidth = 0;
    var cwidths = [];
    var b = false;
    for (nr = 1; nr < list.length; nr++) {
      nc = size + nr - 1;
      cwidths = [];
      var totwidth = -2;
      for (let c = 0; c < nc; c++) {
        var cwidth = 0;
        for (let r = 0; r < nr; r++) {
          var i = r + nr * c;
          if (i >= size) {
            break;
          }
          var x = list[i];
          cwidth = Math.max(cwidth, x.length);
        }
        cwidths.push(cwidth);
        totwidth += cwidth + 2;
        if (totwidth > displaywidth) {
          break;
        }
      }
      if (totwidth <= displaywidth) {
        b = true;
        break;
      }
    }
    if (!b) {
      nr = list.length;
      nc = 1;
      cwidths = [0];
    }
    for (let r = 0; r < nr; r++) {
      var texts = [];
      for (let c = 0; c < nc; c++) {
        var i = r + nr * c;
        var x = "";
        if (i >= size) {
          x = "";
        } else {
          x = list[i];
        }
        texts.push(x);
      }
      console.log(texts.join("  "));
    }
  }

  default(line) {
    console.log("*** Unknown syntax: " + line);
  }

  emptyline() {
    if (this.lastcmd) {
      this.oncmd(this.lastcmd);
    }
  }
}

module.exports = Cmd;
