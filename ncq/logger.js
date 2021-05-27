const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const winston = require("winston");
const utils = require("./utils");

/*
 * This file contains a logger accessible through getLogger that will work program-wide.
 * Not used in the REPL process yet.
 */

const BASE = utils.getBaseDirectory();
const LOGDIR = path.join(BASE, "logs/main");
const REPLLOGDIR = path.join(BASE, "logs/repl");
const OPTIONS = utils.options(process.argv);
var log = OPTIONS.log;
var usage = OPTIONS.usage;
var logger;
var isRepl = false;

/**
 * Return logger, initializing if neccessary.
 */
function getLogger(repl = false) {
    if (!logger) {
        isRepl = repl;
        setupLogger(repl);
    }
    return logger;
}

/**
 * Setup logger.
 */
function setupLogger(repl = false) {
    logger = winston.createLogger();

    var dir = LOGDIR;
    if (isRepl) {
        dir = REPLLOGDIR;
    }

    //create default silent logger
    logger.add(
        new winston.transports.Console({
            name: "console.info",
            format: winston.format.simple(),
            silent: true,
        })
    );

    //if --log is set as arg
    if (log == true) {
        if (!fs.existsSync(dir)) {
            //make dir if it doesnt exist
            fse.mkdirSync(dir, { recursive: true });
        }

        //debug for debugging
        logger.add(
            new winston.transports.File({
                filename: path.join(
                    dir,
                    "/debug" + Math.floor(Date.now() / 1000) + ".log"
                ),
                level: "debug",
            })
        );

        //info for results
        logger.add(
            new winston.transports.File({
                filename: path.join(
                    dir,
                    "/run" + Math.floor(Date.now() / 1000) + ".log"
                ),
                level: "info",
            })
        );
    }
    if (usage == true) {
        if (!fs.existsSync(dir)) {
            //make dir if it doesnt exist
            fse.mkdirSync(dir, { recursive: true });
        }

        //usage for analysing, use warning so it wont interfere
        logger.add(
            new winston.transports.File({
                filename: path.join(
                    dir,
                    "/usage" + Math.floor(Date.now() / 1000) + ".log"
                ),
                level: "warn",
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.simple(),
                ),
            })
        );
    }

    logger.log("debug", "Base directory: " + BASE);
    logger.log("debug", "Logger initialized at: " + LOGDIR);
}

exports.getLogger = getLogger;
