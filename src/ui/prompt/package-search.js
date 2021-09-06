const PackageEntry = require("../components/package-menu/package-entry");
const ListSelect = require("./list-select");


class PackageSearch extends ListSelect{

    onCancel(){
        this.app.clear();
        this.app.unmount();
    }

    async run(items, message){
        return await super.run(items, message, PackageEntry);
    }
}

module.exports = PackageSearch;