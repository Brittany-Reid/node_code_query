const fs = require("fs");
const natural = require("natural");
const path = require("path");
const stopword = require("stopword");
const { getBaseDirectory } = require("../common");
const config = require("../config").getConfig();
const FlexSearch = require("flexsearch");
const ProgressMonitor = require("progress-monitor");
const { readCSVStream } = require("../utils");
const Snippet = require("./snippet");
const Package = require("./package");

const BASE_DIR = getBaseDirectory();
const DATA_PATH = path.join(BASE_DIR, config.files.data);
const PACKAGE_DB_PATH = path.join(BASE_DIR, config.files.packageDB);

const NONALPHANUMREGX = /[^a-zA-Z0-9 ]+/g;

function encode(str) {
    var words = DataHandler.keywords(str);
    return words.join(" ");
}

class DataHandler{
    /**
     * @param {Object} options
     * @param {string} [options.dataPath]
     * @param {string} [options.packageDbPath]
     * @param {number | false} [options.resultLimit]
     * @param {number | false} [options.recordLimit]
     */
    constructor({
        dataPath = DATA_PATH,
        packageDbPath = PACKAGE_DB_PATH,
        resultLimit = false,
        recordLimit = false,
    } = {}){
        this.dataPath = dataPath;
        this.packageDbPath = packageDbPath;
        this.resultLimit = resultLimit;
        this.recordLimit = recordLimit;

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
     * @param {ProgressMonitor} [monitor] 
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
        });
        return snippets;
    }

    /**
    * Returns an array of `Package` objects that match a given query string.
    * @param {String} query Query string to search with.
    * @return {Array<Package>} Array of Package objects.
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
        if(typeof snippetIds === "undefined") return snippets;
        for(var s of snippetIds){
            var snippet = this.idToSnippet.get(s);
            snippets.push(snippet);
        }
        return snippets;
    }


    /**
     * Generate keywords from a string.
     * @param {string} string String to create keywords from.
     * @return {Array<string>} Array of keyword strings.
     */
    static keywords(string){
        string = DataHandler.process(string);
        
        var words = string.split(" ");
        //remove stop words
        words = stopword.removeStopwords(words, DataHandler.language);
        //stem
        words = words.map((word) => {
            return natural.PorterStemmer.stem(word);
        });
        return words;
    }

    /**
    * Process string for keywords.
    * Handles case, whitespace, newlines etc.
    * @param {string} string String to process.
    * @return {string} The processed string.
    */
    static process(string) {
        //all lowercase
        var processed = string.toLowerCase();
        
        //remove extra whitespace on ends
        processed = processed.trim();
        
        //replace newlines with spaces
        processed = processed.replace(/\n/g, " ");
        
        //remove any non alphanum chars
        processed = processed.replace(NONALPHANUMREGX, "");
        
        //find any blocks of whitespace and make sure they are only spaces
        processed = processed.replace(/\s+/g, " ");
        
        return processed;
    }

    /**
     * Internal, load the package DB
     * @param {ProgressMonitor} monitor 
     */
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
     * Internal, load the dataset.
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
        if(typeof this.recordLimit === "number"){
            interval = Math.round(this.recordLimit/100);
        }
        const onData = (data, pipeline) => {
            if(id % interval === 0 && monitor) monitor.emit("work", 1);
            if(typeof this.recordLimit === "number" && id > this.recordLimit){
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
                var snippetObject = new Snippet(s, sid, i, data);
                this.idToSnippet.set(sid, snippetObject);
                snippetIds.push(sid);
                sid++;
                i++;
            }
            this.packageIdToSnippetIdArray.set(id, snippetIds);
            id++;
        };

        await readCSVStream(this.dataPath, onData);

        if(monitor) monitor.emit("end");
    }
}

DataHandler.language = stopword.en;

module.exports = DataHandler;