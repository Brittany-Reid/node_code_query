const React = require("react");
const SelectPrompt = require("../components/prompts/select/select-prompt");
const state = require("../../core/state");
const Prompt = require("./prompt");

const e = React.createElement;

class Select extends Prompt{
    constructor(){
        super();
        this.component = SelectPrompt;
    }

    async run(message, items){
        this.properties.message = message;
        this.properties.items = items;
        return await super.run();
    }
}

module.exports = Select;