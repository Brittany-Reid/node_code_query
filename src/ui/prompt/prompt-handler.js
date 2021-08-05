const React = require("react");
const configInst = require("../../config");
const state = require("../../core/state");

const e = React.createElement;

/**
 * Handles constructing a new prompt.
 * @param {React.ComponentType<any>} component
 * @param {Object} properties
 * @param {Object} options
 */
class PromptHandler {
    constructor(component, properties = {}, options = {}){
        this.component = component;
        this.properties = properties;

        this.exitOnCancel = options.exitOnCancel;
        if(typeof this.exitOnCancel === "undefined") this.exitOnCancel = true;

        //for testing, render and app are exposed
        /**@type {any} */
        this.render = state.render;
        /**@type {any} */
        this.app;
    }

    async run() {
        return new Promise((resolve, reject) => {
            this.properties.onSubmit = async (input) => {
                resolve(input);
            };

            this.properties.onCancel = async (input) => {
                await this.app.waitUntilExit();
                reject("cancel");
            };

            const element = e(this.component, this.properties);

            this.app = this.render(element, {exitOnCtrlC: false});
            state.app = this.app;
        });
    }
}

module.exports = PromptHandler;