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
const OPTIONS = utils.options(process.argv);
var log = OPTIONS.log;
var logger;

/**
 * Return logger, initializing if neccessary.
 */
function getLogger() {
  if (!logger) {
    setupLogger();
  }
  return logger;
}

/**
 * Setup logger.
 */
function setupLogger() {
  logger = winston.createLogger();

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
    if (fs.existsSync(LOGDIR)) {
      //make dir if it doesnt exist
      fse.mkdirSync(LOGDIR, { recursive: true });
    }

    //debug for debugging
    logger.add(
      new winston.transports.File({
        filename: path.join(
          LOGDIR,
          "/debug" + Math.floor(Date.now() / 1000) + ".log"
        ),
        level: "debug",
      })
    );

    //info for results
    logger.add(
      new winston.transports.File({
        filename: path.join(
          LOGDIR,
          "/run" + Math.floor(Date.now() / 1000) + ".log"
        ),
        level: "info",
      })
    );
  }

  logger.log("debug", "Base directory: " + BASE);
  logger.log("debug", "Logger initialized at: " + LOGDIR);
}

exports.getLogger = getLogger;
