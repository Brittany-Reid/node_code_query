const CLI = require("./cli/cli");
const {getLogger} = require("./logger");

var logger;

/**
 * Main function.
 */
async function main() {
    //get and initialize logger
    logger = getLogger();

    //initialize cli
    var app = new CLI();

    //run cli
    app.run();
}

// Do not run on require
if (require.main == module) {
    main();
  }