const state = require("./core/state");
state.mode = "REPL";

const REPL = require("./repl/repl");
const Service = require("./core/service");
const { getLogger } = require("./core/logger");

/**
 * Run an instance of an NCQ REPL.
 */
async function main(){
    state.options();
    //init logger
    var logger = getLogger();
    logger.debug("Logger initialized at: " + logger.directory);
    logger.info("Logger initialized at: " + logger.directory);
    logger.info("REPL started at: " + process.cwd());
    
    await Service.initialize({recordLimit: 100});

    //initialize REPL
    var repl = new REPL();

    //run the REPL
    repl.run();
}

main();