#!/usr/bin/env node --max-old-space-size=4096

const NcqCLI = require("./cli/ncq-cli");
const { getLogger } = require("./core/logger");
const state = require("./core/state");
const CliPrompt = require("./ui/components/prompts/input/cli-prompt");
const config = require("./config").getConfig();
const PromptHandler = require("./ui/prompt/prompt-handler");
/**
 * Run the NCQ CLI.
 */
function main(){

    state.options();

    //set mode
    state.mode = "CLI";
    
    //init logger
    var logger = getLogger();
    logger.debug("Logger initialized at: " + logger.directory);
    logger.info("Logger initialized at: " + logger.directory);

    //run cli
    var promptHandler = new PromptHandler(CliPrompt);
    var cli = new NcqCLI(promptHandler);
    cli.run();
}

main();