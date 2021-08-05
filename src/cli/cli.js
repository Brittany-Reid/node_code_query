const { HandledInputPrompt } = require("ink-scroll-prompts");
const readline = require("readline");
const state = require("../core/state");
const PromptHandler = require("../ui/prompt/prompt-handler");

/**
 * Command line interface.
 * Adapted from python Cmd. Extend to add or overwrite functions.
 * It takes a promptHandler, and then handles the input on submit.
 * @param {PromptHandler} input The promptHandler to use for input.
 */
class CLI {
    constructor(input) {
        this.input = input;
        this.opening = null;
        this.lastcmd = "";
        this.nohelp = "*** No help on ";
        this.ruler = "=";
    }

    /**
   * Main run function. Starts up the cmd.
   */
    async run() {
        if(this.opening) this.print(this.opening);
        await this.cmdLoop();
    }

    /**
   * Accept input, returns promise of output.
   */
    async acceptInput() {
        return await this.input.run();
    }

    /**
   * Recurisve command loop.
   */
    async cmdLoop() {
        await this.acceptInput()
            .then(async (response) => {
                var stop = await this.oncmd(response);
                if(stop!=true){
                    await this.cmdLoop()
                }
            }).catch(e => {
                return;
            });
    }

    /**
     * https://github.com/SBoudrias/Inquirer.js/issues/792
     * We need to 'reset' the stdin before running a child_process.
     */
    // resetStdin() {
        // const rl = readline.createInterface({
        //     input: process.stdin,
        //     output: process.stdout,
        // });
        // rl.close();
    // }

    /**
     * Preform some action on command.
     * Looks for functions starting with do_
     */
    async oncmd(line) {
        var parsed = this.parseline(line);
        var cmd = parsed[0];
        var args = parsed[1];

        if (!line) {
            return await this.emptyline();
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
            return await func.call(this, args);
        }
    }

    parseline(line) {
        line = line.trim();
        if (line == "") {
            return [null, null, line];
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

    /**
   * Returns a Set of method names for the class.
   */
    getnames() {
        let methods = new Set();
        var obj = this;
        while ((obj = Reflect.getPrototypeOf(obj))) {
            let keys = Reflect.ownKeys(obj);
            keys.forEach((k) => methods.add(k));
        }
        return methods;
    }

    sum_exit = "Exits the application";

    help_exit(arg) {
        this.print("Exits the application. Shorthand: Ctrl-D.");
    }

    do_exit(arg) {
        return true;
    }

    sum_help = 'List available commands with "help"';

    help_help(arg) {
        this.print('List available commands with "help" or detailed help with "help <cmd>".');
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
        } 
        var names = this.getnames();
        var commands = [];
        names.forEach((name) => {
            if (name.substring(0, 3) === "do_") {
                commands.push(name.substring(3));
            }
        });
        commands = commands.sort();
        var lengths = commands.map((command) => {
            return command.length;
        });
        var longestLength = Math.max(...lengths);
        commands.forEach((command) => {
            var summary = this["sum_"+command];
            if (typeof summary !== "string") {
                summary = "";
            }
            var spaces = " ".repeat(longestLength - command.length + 3);
            var line = command + spaces + summary;
            this.print(line);
        });
    }

    default(line) {
        this.print("*** Unknown syntax: " + line);
    }

    async emptyline() {
        if (this.lastcmd) {
            await this.oncmd(this.lastcmd);
        }
    }

    /**
   * Print output. Overwrite for different output handling.
   */
    print(string) {
        state.write(string);
    }
}

module.exports = CLI;
