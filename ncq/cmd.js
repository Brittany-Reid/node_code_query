const readline = require("readline");

/**
 * Adapted from python Cmd. Extend to add or overwrite functions.
 */
class Cmd {
  constructor(input) {
    this.input = input;
    this.lastcmd = "";
    this.doc_leader = "";
    this.doc_header = "Documented commands (type help(<topic>)):";
    this.misc_header = "Miscellaneous help topics:";
    this.undoc_header = "Undocumented commands:";
    this.nohelp = "*** No help on ";
    this.ruler = "=";
  }

  /**
   * Main run function. Starts up the cmd.
   */
  async run() {
    await this.cmdLoop();
  }

  async acceptInput() {
    return await this.input.run();
  }

  async cmdLoop() {
    await this.acceptInput()
      .then(async (response) => {
        var stop = this.oncmd(response);
        if(stop!=true){
          await this.cmdLoop()
        };
      })
      // .catch((e) => {
      //   this.print(e);
      // });
  }

  /**
   * https://github.com/SBoudrias/Inquirer.js/issues/792
   * We need to 'reset' the stdin before running a child_process.
   */
  resetStdin() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.close();
  }

  /**
   * Preform some action on command.
   * Looks for functions starting with do_
   */
  oncmd(line) {
    var parsed = this.parseline(line);
    var cmd = parsed[0];
    var args = parsed[1];

    if (!line) {
      return this.emptyline();
    }
    if (!cmd) {
      return this.default(line);
    }
    else{
      this.lastcmd = line;
      var fn = "do_" + cmd;
      var func = this[fn];
      if (!(typeof func === "function")) {
        return this.default(line);
      }
      return func.call(this, args);
    }
  }

  parseline(line) {
    line = line.trim();
    if (line == "") {
      return [null, null, line];
    }
    var c = line.indexOf("(");
    var cmd = line.substring(0, c);
    //if no bracket accept argumentless
    if(c == -1){
      cmd = line;
      return [cmd, "", line];
    }
    var args = line.substring(c+1);

    var a = args.lastIndexOf(")");
    args = args.substring(0, a);

    if(args[0] == "\""){
      args = args.substring(1);
    }
    if(args[args.length-1] == "\""){
      args = args.substring(0, args.length-1);
    }

    args = args.trim();
    return [cmd, args, line];
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

  help_exit(arg) {
    this.print("Exits the application. Shorthand: Ctrl-D.");
  }

  do_exit(arg) {
    return true;
  }

  help_help(arg) {
    this.print(
      'List available commands with "help()" or detailed help with "help(<cmd>)".'
    );
  }

  do_help(arg) {
    if (arg) {
      var fn = "help_" + arg;
      var func = this[fn];
      if (!(typeof func === "function")) {
        this.print(this.nohelp + arg);
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
            cmds_doc.push(cmd+"()");
            delete help[cmd];
          } else {
            cmds_undoc.push(cmd+ "()");
          }
        }
      });
    }
    this.print(this.doc_leader);
    this.print_topics(this.doc_header, cmds_doc, 15, 80);
    this.print_topics(this.misc_header, Object.keys(help), 15, 80);
    this.print_topics(this.undoc_header, cmds_undoc, 15, 80);
  }

  print_topics(header, cmds, cmdlen, maxcol) {
    if (cmds && cmds.length != 0) {
      this.print(header);
      if (this.ruler && this.ruler != "") {
        this.print(this.ruler.repeat(header.length));
      }
      this.columnize(cmds, maxcol - 1);
      this.print("");
    }
  }

  columnize(list = [], displaywidth = 80) {
    var size = list.length;
    if (size === 1) {
      this.print(list[0]);
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
      this.print(texts.join("  "));
    }
  }

  default(line) {
    this.print("*** Unknown syntax: " + line);
  }

  emptyline() {
    if (this.lastcmd) {
      this.oncmd(this.lastcmd);
    }
  }

  /**
   * Print output. Overwrite for different output handling.
   */
  print(string) {
    console.log(string);
  }
}

module.exports = Cmd;
