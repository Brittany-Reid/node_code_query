const React = require("react");
const SelectPrompt = require("../components/prompts/select/select-prompt");
const state = require("../../core/state");
const config = require("../../config").config;

const e = React.createElement;

class Prompt{
    constructor(){
        this.app = undefined;
        this.render = state.render;
        this.clear = false;
        this.component = undefined;
        //default props
        this.properties = {
            accentColor: config.accentColor
        };
    }

    createElement(){
        if(this.component) return e(this.component, this.properties);
    }

    onSelect(value){
        if(this.clear) this.app.clear();
        this.app.unmount();
    }

    onCancel(){
        this.app.unmount();
    }


    async run(...args){
        var result =  await new Promise((resolve, reject) => {
            this.properties.onCancel = ()=>{
                this.onCancel();
                reject();
            };

            this.properties.onSelect = (value)=>{
                this.onSelect(value);
                resolve(value);
            };
            var element = this.createElement();
            this.app = this.render(element, {exitOnCtrlC: false});
            state.app = this.app;
        });
        return result;
    }
    
}

module.exports = Prompt;