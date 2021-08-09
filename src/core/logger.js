const fs = require("fs-extra");
const path = require("path");
const winston = require("winston");
const { getBaseDirectory } = require("../common");
const state = require("./state");

const LOG_DIR = path.join(getBaseDirectory(), "logs");
const CLI_LOG_DIR = path.join(LOG_DIR, "cli");
const REPL_LOG_DIR = path.join(LOG_DIR, "repl");

class Logger{
    constructor({
        directory = CLI_LOG_DIR
    } = {}){
        this.directory = directory;
        this.debugFile = undefined;
        this.infoFile = undefined;
        //if need to be inited
        this.debugged = false;
        this.infoed = false;

        this.internalLogger = winston.createLogger();
        this.debugTransport;
        this.infoTransport;
    }

    debug(message){
        if(!state.debug) return;
        if(!this.debugged) this.initializeDebug();
        this.internalLogger.debug(message);
    }

    info(message){
        if(!state.usage) return;
        if(!this.infoed) this.initializeInfo();
        this.internalLogger.info(message);
    }
    
    initializeDebug(){
        //make sure directory exists
        this.createDirectory();
        this.debugFile = "/debug" + Date.now() + ".log";
        this.debugTransport = new winston.transports.File({
            filename: path.join(
                this.directory,
                this.debugFile
            ),
            level: "debug",
        });
        this.internalLogger.add(this.debugTransport);
        this.debugged = true;
    }

    initializeInfo(){
        //make sure directory exists
        this.createDirectory();
        this.infoFile = "/usage" + Math.floor(Date.now() / 1000) + ".log";
        this.infoTransport = new winston.transports.File({
            filename: path.join(
                this.directory,
                this.infoFile
            ),
            level: "info",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.simple(),
            ),
        });
        this.internalLogger.add(
            this.infoTransport
        );

        this.infoed = true;
    }

    createDirectory(){
        if(!fs.existsSync(this.directory)) fs.mkdirSync(this.directory, {recursive: true});
    }

}

var globalLogger;

function setupLogger(){
    var directory = CLI_LOG_DIR;
    if(state.mode === "REPL")  directory = REPL_LOG_DIR;
    globalLogger = new Logger({directory:directory});
    return globalLogger;
}

function getLogger(reset = false){
    if(globalLogger && !reset) return globalLogger;
    return setupLogger();
}

module.exports = {
    getLogger,
    Logger,
};