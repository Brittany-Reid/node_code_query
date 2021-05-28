const fs = require("fs");
const path = require("path");
const FlexSearch = require("flexsearch");
const DataHandler = require("./ncq/core/data-handler");
const utils = require("./ncq/utils");
const axios = require("axios");
const Zip = require("adm-zip");

const DATA_URL = "https://zenodo.org/record/4835694/files/dataset.zip";
const DATA_PATH = "data/dataset.csv";
const DATA_ZIP_PATH = "data/dataset.zip";
const PACKAGE_DB_PATH = "data/packageDB.txt";

async function setupPackageDB(){
    var packages = [];
    const onData = (data) => {
        if(data.keywords) data.keywords = JSON.parse(data.keywords);
        else{
            data.keywords = [];
        }
        data.snippets = JSON.parse(data.snippets);
        packages.push(data);
    }

    await utils.readCSVStream(DATA_PATH, onData);

    const encode = (str)  => {
        var words = DataHandler.keywords(str);
        return words.join(" ");
    }

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
        
    fs.writeFileSync(PACKAGE_DB_PATH, database, { encoding: "utf-8" });

    console.log("Done");
}

async function download(url, path) {
    return new Promise((resolve, reject) => {
        var fileStream = fs.createWriteStream(path);

        fileStream
            .on("error", (err) => {
                console.log(err.message);
                reject(err);
            })
            .on("finish", () => {
                resolve();
            });

        axios
            .get(url, {
                responseType: "stream",
            })
            .then(function (response) {
                var total = parseInt(response.data.headers["content-length"]);
                var current = 0;
                var nextPercent = 10;

                response.data
                    .on("data", function (data) {
                        current += data.length;

                        var fraction = Math.round((current / total) * 100);
                        if (fraction >= nextPercent) {
                            console.log(nextPercent + "%");
                            nextPercent += 10;
                        }
                    })
                    .pipe(fileStream);

                //pass end to filestream
                response.data.on("end", function () {
                    fileStream.emit("end");
                });
            });
    });
}

async function setupDatabase(){
    var newDataset = false;
    if(!fs.existsSync(DATA_PATH)){
        newDataset = true;
        console.log("Dataset missing. Dataset will be downloaded from https://zenodo.org/record/4835694/files/dataset.zip")
        await download(DATA_URL, DATA_ZIP_PATH);

        //extract to data
        console.log("Extracting from " + DATA_ZIP_PATH + " to " + path.dirname(DATA_PATH));
        var zip = new Zip(DATA_ZIP_PATH);
        zip.extractAllTo(path.dirname(DATA_PATH), true);

        //delete
        console.log("Deleting " + DATA_ZIP_PATH);
        fs.unlinkSync(DATA_ZIP_PATH);
    }

    if(newDataset || !fs.existsSync(PACKAGE_DB_PATH)){
        if(newDataset){
            console.log("Updating package database.")
        }
        else{
            console.log("No package database exists, creating.")
        }
        setupPackageDB();
    }
}

async function main(){
    setupDatabase();
}

main();
