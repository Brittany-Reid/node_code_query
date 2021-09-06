const { getBaseDirectory } = require("./common");
const path = require("path");
const fs = require("fs");
const { version } = require('../package.json');

var defaultConfig = {
    version: version,
    files: {
        packageDB: "data/packageDB.txt",
        data: "data/dataset.csv",
        cliHistory: "history.json",
        replHistory: "history-repl.json",
        replDir: "repls",
    },
    lastSession:undefined,
    accentColor: "cyan",
};

class Config{

    constructor(){
        this.configPath = path.join(getBaseDirectory(), "config.json");
        this.config = null;
    }

    /**
     * Create a config file when none exists.
     */
    createConfig(){
        fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, undefined, 4));
    }

    /**
     * Update existing config files when versions mismatch.
     */
    updateConfig(){
        if(this.config.version === version) return;
    }

    /**
     * Load the config file into memory.
     */
    loadConfig(){
        if(!fs.existsSync(this.configPath)){
            this.createConfig();
            this.config = JSON.parse(fs.readFileSync(this.configPath, {encoding:"utf-8"}));
        }
        else{
            this.config = JSON.parse(fs.readFileSync(this.configPath, {encoding:"utf-8"}));
            this.updateConfig();
        }
    }

    getConfig(){
        if(!this.config){
            this.loadConfig();
        }
        return this.config;
    }


    /**
     * Save last session data.
     */
    saveLastSession(lastProject){
        this.config.lastSession = {
            lastProject: lastProject
        };
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, undefined, 4));
    }
}

var configInst = new Config();

module.exports = configInst;