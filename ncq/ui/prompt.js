const Suggestion = require("./suggestion");
const Store = require('data-store');
const actions = require('enquirer/lib/combos');
const custom = {tab: 'tab'};
actions.keys = { ...actions.keys, ...custom };

/**
 * Spawns a new prompt for us.
 */
class Prompt{
    constructor(suggestions = [], prefix = "NCQ", message = ""){
        this.prompt = new Suggestion({
            name: "",
            message: message,
            separator: "> ",
            prefix: prefix,
            limit: 4,
            inputNoChoice: true,
            initial: 2,
            choices: suggestions,
            history: {
                store : new Store({ path: `${process.cwd()}/history.json` }),
                autosave: true,
            }
        });
    }

    async run(){
        return await this.prompt.run();
    }
}

module.exports = Prompt;