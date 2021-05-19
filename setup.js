const fs = require("fs");
const path = require("path");
const parse = require('csv-parse')
const FlexSearch = require("flexsearch");
const DataHandler = require("./ncq/core/data-handler");
const utils = require("./ncq/utils");

const BASE_DIR = utils.getBaseDirectory();
const DATA_DIR = "data/dataset.csv";
var SNIPPET_DB_DIR = path.join(BASE_DIR, "data/snippetDB2.txt");
var PACKAGE_DB_DIR = path.join(BASE_DIR, "data/packageDB2.txt");

/**
 * Encode a string into an array of words. Use DataHandler keyword impl.
 * @returns 
 */
function encode(str) {
    var words = DataHandler.keywords(str);
    return words.join(" ");
}

/**
 * Read a file as stream. Returns a promise.
 */
function readFileStream(file, onData = (data, pipeline)=>{}, onEnd = (data)=>{}){
    const parser = parse({
        delimiter: '\t',
        relax: true,
        escape: false,
        columns:true,
    });

    var pipeline = fs.createReadStream(file, {encoding: "utf-8"}).pipe(parser);

    return new Promise((resolve, reject) => {
        pipeline.on("data", (data) => {
            onData(data, pipeline);
        })
        pipeline.on("end", (data) => {
            onEnd(data);
            resolve();
        })
    });
}

async function setupPackageDatabase(packages){

    console.log("Package Info Database does not exist. Creating...");

    var index = new FlexSearch("memory", {
        tokenize: "strict", //opposed to splitting a word into f/fi/fil/file our search is non specific enough as is
        doc: {
            id: "id", //index by name for fast look up
            field: ["description", "keywords"],
        },
        encode: encode,
    });
    
    var id = 0;
    for(var p of packages){
        var packageObject = {};
        packageObject["id"] = id;
        packageObject["description"] = p["description"];
        packageObject["keywords"] = p["keywords"];
        index.add(packageObject);
        id++;
    }

    var database = index.export();

    fs.writeFileSync(PACKAGE_DB_DIR, database, { encoding: "utf-8" });

    console.log("DONE!");

    console.log("Package info database was saved to " + PACKAGE_DB_DIR);
    
}

async function setupSnippetDatabase(packages){
    console.log("Snippet Database does not exist. Creating...");

    // //create index
    // var index = new FlexSearch("memory", {
    //     tokenize: "strict",
    //     doc: {
    //         id: "id",
    //         field: ["description"],
    //     },
    //     encode: encode,
    // });

    // for(var p of packages){
    //     var snippets = p["snippets"];

    // }
}

async function setupDatabase(){
    var packageExists = fs.existsSync(PACKAGE_DB_DIR);
    var snippetExists = fs.existsSync(SNIPPET_DB_DIR);

    if(packageExists && snippetExists) return;


    var packages = [];
    const onData = (data, pipeline)=>{
        if(data.keywords) data.keywords = JSON.parse(data.keywords);
        else{
            data.keywords = [];
        }
        data.snippets =JSON.parse(data.snippets);
        packages.push(data);
    }
    await readFileStream(DATA_DIR, onData);
    if(!packageExists) setupPackageDatabase(packages);
    if(!snippetExists) setupSnippetDatabase(packages);
}


async function main(){
    setupDatabase();
}

main();