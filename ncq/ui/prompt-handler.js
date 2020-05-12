const Store = require('data-store');
const actions = require('enquirer/lib/combos');
const custom = {tab: 'tab'};
actions.keys = { ...actions.keys, ...custom };

/**
 * Handles constructing a new prompt every run. Pass the class variable.
 */
class PromptHandler{
    constructor(promptClass, options = {}){
        this.promptClass = promptClass;
        this.handleOptions(options);
    }

    handleOptions(options){
        //set defaults
        this.options = {
            name : "",
            prefix : "NCQ",
            message : "",
            separator : "> ",
            limit: 4,
            choices: [],
            inputNoChoice: true,
            history: {
                store : new Store({ path: `${process.cwd()}/history.json` }),
                autosave: true,
            }
        }

        //overwrite with given options
        for (let key of Object.keys(options)) {
            this.options[key] = options[key];
        }
    }

    async run(){
        this.prompt = new this.promptClass(this.options);
        return await this.prompt.run();
    }
}

module.exports = PromptHandler;