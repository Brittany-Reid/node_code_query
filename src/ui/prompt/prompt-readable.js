const stream = require("stream");
const { getLogger } = require("../../core/logger");
const state = require("../../core/state");
const PromptHandler = require("./prompt-handler");

const logger = getLogger();

class PromptReadable  extends stream.Readable {
    constructor(component, promptOptions, promptWritable, options) {
        super(options);
        promptOptions.promptWritable = promptWritable;
        this.promptOptions = promptOptions;
        this.promptHandler = new PromptHandler(component, this.promptOptions);
        this.paused = false;
    }

    /**
     * Function that creates a new prompt, runs and returns the result.
     */
    async prompt() {
        var installed = state.repl.installedPackages;
        var message = "[]";
        if(installed.length > 0) message = "[" + installed[installed.length-1] + "]";
        this.promptOptions.message = message;
        this.promptHandler.properties = this.promptOptions;
        var response = await this.promptHandler.run();
        this.promptOptions.snippets = undefined;

        return response;
    }

    /**
     * Overwrite the read function to prompt for input.
     */
    _read(size) {
        state.previousCode = undefined;
        state.lastCodeSnippet = undefined;
        if (this.paused) {
            this.push("");
            return;
        }
        //run prompt
        this.prompt().then(async (response) => {

            logger.info("Submitted: " + JSON.stringify(response));

            if(state.repl){
                try{
                    if(await state.repl.intercept(response)){
                        this.push("");
                        return;
                    }
                }catch(e){
                    //if an error thrown from intercept, catch it here so we dont get an save an exit prompt!
                    //it should probably be handled by the actual function, however
                    //this happened bc i forgot to catch the cancel state for package search... just in case it happens again
                    state.write("Oops, something went wrong! (this error should be caught elsewhere!)");
                    this.push("");
                    return;
                }
            }

            //if below limit, just push
            if (response.length < size) {
                this.push(response + "\n");
            }
            //otherwise, split pushes
            else {
                var ok = true;
                var readIndex = 0;
                while (ok) {
                    this.push(response.substr(readIndex, size));
                    readIndex += size;

                    if (readIndex > response.length) {
                        ok = false;
                    }
                }
            }
        }).catch(async e =>{
            // //console.log(this)
            // this.emit("keypress", undefined, {ctrl:true, name: "c"})
            await state.repl.exit(false);
            this.push("");
        });
    }

}

module.exports = PromptReadable;
