const Suggestion = require("./suggestion");
const Store = require('data-store');
const actions = require('enquirer/lib/combos');
const colors = require('ansi-colors');
const custom = {tab: 'tab'};
actions.keys = { ...actions.keys, ...custom };

/**
 * Spawns a new prompt for us.
 */
class Prompt{
    constructor(suggestions = [], prefix = "NCQ", message = ""){
        this.suggestions = suggestions;
        this.prefix = prefix;
        this.message = message;
    }

    async run(){
        this.prompt = new Suggestion({
            name: "",
            message: this.message,
            separator: "> ",
            prefix: this.prefix,
            limit: 4,
            inputNoChoice: true,
            initial: 2,
            choices: this.suggestions,
            history: {
                store : new Store({ path: `${process.cwd()}/history.json` }),
                autosave: true,
            }
        });
        return await this.prompt.run();
    }
}

module.exports = Prompt;