const ProgressMonitor = require("progress-monitor");
const PackageSearch = require("../ui/prompt/package-search");
const Select = require("../ui/prompt/select");
const DataHandler = require("./data-handler");
const Snippet = require("./snippet");
const state = require("./state");
const ProgressBar = require("../ui/components/progress-bar");
const React = require("react");
const Package = require("./package");
const chalk = require("chalk");

const e = React.createElement;

class Service {

    /**
   * Setup code search. Loads in files.
   */
    static async initialize(options){
        var monitor = new ProgressMonitor(100);
        state.app = state.render(e(ProgressBar, {monitor:monitor}));
        state.dataHandler = new DataHandler(options);
        await state.dataHandler.loadDatabase(monitor);
        state.app.unmount();
    }

    /**
     * Search for packages
     * @param {string} query 
     * @returns {Promise<{toInstall, packageName} | void>}
     */
    static async packageSearch(query){
        //get packages
        var packages = state.dataHandler.searchPackages(query);
        packages = packages.sort(Package.sort);

        //if no results 
        if(!packages || packages.length < 1){
            state.write("No results for query " + chalk.green("'" + query + "'"));
            return;
        }

        packages = packages.slice(0, 100);

        var items = [];
        var id = 1;
        for(var p of packages){
            items.push({
                label: p.name,
                stars: p.stars,
                keywords: p.keywords,
                description: p.description,
                id: id
            });
            id++;
        }
        var packageName = undefined;
        var toInstall = false;
        try{
            packageName = await new PackageSearch().run(items);
        }catch(e){
            //if cancel package select
            return;
        }

        var result;
        try{
            result = await new Select().run("Install?", ["Yes", "No"]);
        }
        catch(e){
            //do nothing
        }
        if(result === "Yes") toInstall = true;

        return {packageName, toInstall};
    }

    /**
     * Get snippets for an array of packages.
     * @param {Array<string>} packages 
     * @return {Array<Snippet>}
     */
    static packageSnippets(packages){
        var snippets = [];
        for(var p of packages){
            var current = state.dataHandler.getSnippetsForPackage(p);
            if(current) snippets = snippets.concat(current);
        }

        //snippets = this.evaluator.fix(snippets);
        snippets = snippets.sort(Snippet.sort);

        return snippets;
    }
}

module.exports = Service;