const ink = require("@gnd/ink/");
const configInst = require("../config");
const { Console } = require("console");
const stream = require("stream");
const DataHandler = require("./data-handler");
const packageJSON = require('../../package.json');
const commander = require('commander');
const Evaluator = require("./evaluator/evaluator");
const {Command} = commander;

class EmptyStdout extends stream.Writable{}

function myParseInt(value, dummyPrevious) {
    // parseInt takes a string and a radix
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new commander.InvalidArgumentError('Not a number.');
    }
    return parsedValue;
}

/**
 * Common State Module
 */
class State {

    constructor(){
        this.version = packageJSON.version;
        //are in cli or repl mode
        this.mode = undefined;
        this.logger = undefined;
        this.debug = false;
        this.usage = false;
        this.recordLimit = false;
        this.name = "NCQ";
        this.repl = null;
        this.lastSession = configInst.getConfig().lastSession;
        this.cliHistory =  configInst.getConfig().files.cliHistory;
        this.replHistory = configInst.getConfig().files.replHistory;
        this.replDir = configInst.getConfig().files.replDir;
        this.app = undefined;
        this.render = ink.render;
        this._silent = false;
        this._stdout = process.stdout;
        this._stderr = process.stderr;
        this._stdin = process.stdin; 
        /**@type {DataHandler} */
        this.dataHandler = undefined;
        /**@type {Evaluator} */
        this.evaluator = undefined;
        this.previousCode = undefined;
        this.lastCodeSnippet = undefined;

        this.console = new Console(this.stdout, this.stderr);
    }

    set silent(value){
        if(this._silent !== value){
            this._silent = value;
            if(!this._silent) this.console = new Console(this.stdout, this.stderr);
            else{
                this.console = new Console(new EmptyStdout(), new EmptyStdout());
            }
        }
    }

    get silent(){
        return this._silent;
    }

    get stdout(){
        if(!this.silent) return this._stdout;
        return undefined;
    }

    get stdin(){
        return this._stdin;
    }

    get stderr(){
        if(!this.silent) return this._stderr;
        return undefined;
    }

    write(message){
        if(!this.silent) this.console.log(message);
    }

    saveLastSession(lastProject){
        this.lastSession = {
            lastProject: lastProject
        };
        configInst.saveLastSession(lastProject);
    }

    options(){
        const program = new Command();
        program.version(state.version);
        program.option('-d, --debug', 'output extra debugging')
            .option('-u, --usage', 'output usage information for user study purposes')
            .option('-r, --recordLimit <num>', 'limit the number of records loaded', myParseInt);
        program.parse(process.argv);
        var options = program.opts();
        if(options.debug) state.debug = true;
        if(options.usage) state.usage = true;
        if(options.recordLimit !== undefined) state.recordLimit = options.recordLimit;
    }
}

const state = new State();

module.exports = state;