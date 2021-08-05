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
        this.properties.message = message;
        this.properties.items = items;
        this.properties.itemComponent = itemComponent;
        return await super.run();
    }
}

// var files = fs.readdirSync(path.join(getBaseDirectory(), "repls"));
// var items = [];
// items.push({label: "Create New"});
// items.push({label: "Load Previous"});
// for(var f of files) items.push({
//     date: fs.statSync(path.join(getBaseDirectory(), "repls", f)).mtime.toDateString(),
//     label: f
// });
// new ListSelect().run(items, "Select a REPL to load?", FolderEntry);

module.exports = ListSelect;