
const fs = require("fs");
const path = require("path");
const natural = require("natural");
const stopword = require("stopword");
const FlexSearch = require("flexsearch");
const ProgressMonitor = require("progress-monitor");
const { getConfig } = require("../config");
const { getBaseDirectory, readCSVStream } = require("../utils");
const Package = require("./package");
const Snippet = require("./snippet");

const config = getConfig();
const BASE_DIR = getBaseDirectory();

const DATA_PATH = path.join(BASE_DIR, config.get("files.data"));
const PACKAGE_DB_PATH = path.join(BASE_DIR, config.get("files.packageDB"));

function encode(str) {
    var words = DataHandler.keywords(str);
    return words.join(" ");
}

/**
 * Class that handles loading and accessing data.
 */
class DataHandler{

    /**
     * @param {Object} options Options object for setting non-default options, usually for testing.
     * @param {string} options.dataPath Directory of the dataset.
     * @param {string} options.packageDbPath Directory of the package database, generated once by setup.
     * @param {number} options.recordLimit Number of records to load, default `false` loads all in file.
     * @param {number} options.resultLimit Global number of results to return, passed to flexsearch. Default `0` disables limit.
     */
    constructor({
        dataPath = DATA_PATH,
        packageDbPath = PACKAGE_DB_PATH,
        recordLimit = false,
        resultLimit = 0,
    } = {}){
        this.recordLimit = recordLimit;
        this.resultLimit = resultLimit;

        this.dataPath = dataPath;
        this.packageDbPath = packageDbPath;

        /*
        * Objects are indexed by ID for flexsearch, even snippets (remnant of when snippets had a unique search.)
        * It's easier to keep in case we want to reimplement.
        */

        /**
        * Flexsearch package index object.
        */
        this.packageIndex = undefined;

        /**
         * Map of id number to package object. The id is used by flexsearch to minimize file size.
         */
        this.idToPackage = new Map();
        /**
         * Map of package names to id numbers.
         */
        this.packageNameToId = new Map();
        /**
         * Map of id numbers to code snippet objects.
         */
        this.idToSnippet = new Map();
        /**
         * Map of package id number to an array of code snippet ids.
         */
        this.packageIdToSnippetIdArray = new Map();
    }

    /**
     * Load database into memory
     * @param {ProgressMonitor} monitor 
     */
    async loadDatabase(monitor){
        var subMonitor1, subMonitor2;
        if (monitor) {
            monitor = ProgressMonitor.adjustTotal(monitor, 100);
            monitor.emit("start");
            subMonitor1 = monitor.split(5);
            subMonitor2 = monitor.split(95);
        }
       
        await this._loadPackageDB(subMonitor1);
        await this._loadData(subMonitor2);


        if (monitor) monitor.emit("end");
    }

    /**
    * Returns an array of `Package` objects that match a given query string.
    * @param {String} query - Query string to search with.
    */
    searchPackages(query) {
        var result = this.packageIndex.search({ query: query, limit: this.resultLimit });
        var packages = [];
        for (var r of result) {
            var id = r.id;
            var object = this.idToPackage.get(id);
            

            if(object) {
                packages.push(object);
            }
        }

        return packages;
    }

    /**
    * Return array of `Snippet` objects that match a given package name.
    * @param {String} packageName - The package to return snippets for.
    */
    getSnippetsForPackage(packageName) {
        var id = this.packageNameToId.get(packageName);
        var snippetIds = this.packageIdToSnippetIdArray.get(id);

        var snippets = [];
        for(var s of snippetIds){
            var snippet = this.idToSnippet.get(s);
            snippets.push(snippet);
        }

        return snippets;
    }

    /**
     * Return array of packages in database.
     */
    get packages(){
        var packages = [];
        this.idToPackage.forEach((value)=>{
            packages.push(value);
        });
        return packages;
    }
    /**
     * Return array of snippets in database.s
     */
    get snippets(){
        var snippets = [];
        this.idToSnippet.forEach((value) => {
            snippets.push(value);
        })
        return snippets;
    }

    /**
    * Process string for keywords.
    */
    static process(string) {
    //all lowercase
        var processed = string.toLowerCase();

        //remove extra whitespace on ends
        processed = processed.trim();

        //replace newlines with spaces
        processed = processed.replace(/\n/g, " ");

        //remove any non alphanum chars
        processed = processed.replace(this.NONALPHANUMREGX, "");

        //find any blocks of whitespace and make sure they are only spaces
        processed = processed.replace(/\s+/g, " ");

        return processed;
    }

    static keywords(string) {
        string = this.process(string);

        var words = string.split(" ");
        //remove stop words
        words = stopword.removeStopwords(words, this.language);
        //stem
        words = words.map((word) => {
            // const cleanWord = word.replace(/[^a-zA-Z ]/g, "");
            return natural.PorterStemmer.stem(word);
        });
        return words;
    }

    async _loadPackageDB(monitor){
        if(monitor){
            monitor = ProgressMonitor.adjustTotal(monitor, 100);
            monitor.emit("start");
        }

        var database = fs.readFileSync(this.packageDbPath, { encoding: "utf-8" });

        this.packageIndex = new FlexSearch("memory", {
            tokenize: "strict", //opposed to splitting a word into f/fi/fil/file our search is non specific enough as is
            doc: {
                id: "id", //index by name for fast look up
                field: ["description", "keywords"],
            },
            encode: encode,
        });

        this.packageIndex.import(database);

        if(monitor) monitor.emit("end");
    }

    /**
     * 
     * @param {ProgressMonitor} monitor 
     */
    async _loadData(monitor){

        if(monitor){
            monitor = ProgressMonitor.adjustTotal(monitor, 100);
            monitor.emit("start");
        }

        this.idToPackage = new Map();
        this.packageNameToId = new Map();
        var id = 0;
        var sid = 0;
        var interval = Math.round(620221/100);
        if(this.recordLimit){
            interval = Math.round(this.recordLimit/100);
        }
        const onData = (data, pipeline) => {
            if(id % interval === 0 && monitor) monitor.emit("work", 1)
            if(this.recordLimit && id > this.recordLimit){
                pipeline.destroy();
                return;
            }
            if(data.keywords) data.keywords = JSON.parse(data.keywords);
            else{ data.keywords = [];}
            data.snippets =JSON.parse(data.snippets);

            var packageObject = new Package(data, id);
            var name = data["name"];

            this.packageNameToId.set(name, id);
            this.idToPackage.set(id, packageObject);

            var snippets = data.snippets;
            var i = 0;
            var snippetIds = [];
            for(var s of snippets){
                var snippetObject = new Snippet(s, sid, name, i);
                this.idToSnippet.set(sid, snippetObject);
                snippetIds.push(sid);
                sid++;
                i++;
            }
            this.packageIdToSnippetIdArray.set(id, snippetIds);
            id++;
        }

        await readCSVStream(this.dataPath, onData);

        if(monitor) monitor.emit("end");
    }

}

// async function main(){
//     var data = new DataHandler({limit:100});
//     await data.loadDatabase();
//     data.taskToPackages("puzzles")[0].rank();
// }

// main();



// class DataHandler {
//     constructor({
//       data_dir = config,
//       packagedb_dir,
//     }) {
//     //limit on snippets
//         this.limit = 0;
//         //stopword language
//         this.language = stopword.en;
//         //regex for removing all non-alpha numeric characters
//         this.NONALPHANUMREGX = /[^a-zA-Z0-9 ]+/g;
//         //regex for task chars
//         this.TASKPUNCT = /[,-]+/g;

//         this.idToPackage = new Map(); //id to package object. ids are generated, not part of the dataset
//         this.nameToId = new Map();
//         this.snippets = []; //id to snippet object, ids are associated in the dataset

//         this.packageIndex;
//         this.snippetIndex;

//         this.tasks = new Map();
//     }




//     /**
//    * Formats a task for us. Can return null *in the future, if we want to filter out some tasks.
//    */
//     processTask(task) {
//     //normalize to lowercase
//         task = task.toLowerCase();
//         //remove extra whitespace on ends
//         task = task.trim();

//         //replace punctuation with space
//         task = task.replace(this.TASKPUNCT, " ");
//         //find any blocks of whitespace and make sure they are only spaces
//         task = task.replace(/\s+/g, " ");

//         //alphanum only
//         if (task.match(this.NONALPHANUMREGX)) {
//             return;
//         }

//         return task;
//     }
// }

module.exports = DataHandler;
