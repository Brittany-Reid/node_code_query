const fs = require("fs");
const path = require("path");
const { getBaseDirectory } = require("../../common");
const Prompt = require("./prompt");
const ScrollSelect = require("../components/scroll-select/scroll-select");
const PackageEntry = require("../components/package-menu/package-entry");
const FolderEntry = require("../components/scroll-select/folder-entry");

class ListSelect extends Prompt{
    constructor(){
        super();
        this.component = ScrollSelect;
    }

    async run(items, message, itemComponent){
        //items need accent colour set individually
        //i did have this working in the actual component but it causes weird bugs in windows :(
        for(var i of items){
            i.accentColor = this.properties.accentColor;
        }
        this.properties.message = message;
        this.properties.items = items;
        this.properties.itemComponent = itemComponent;
        return await super.run();
    }
}

module.exports = ListSelect;