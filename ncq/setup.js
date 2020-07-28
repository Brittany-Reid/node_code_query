const { getConfig } = require("./config");
const utils = require("./utils");
const Snippet = require("./service/snippet");

const Zip = require("adm-zip");
const axios = require("axios");
// const FlexSearch = require("flexsearch");
const fs = require("fs");
const natural = require("natural");
const path = require("path");
const stopword = require("stopword");

var config;
const BASE_DIR = utils.getBaseDirectory();
var SNIPPET_DIR;
var INFO_DIR;
var SNIPPET_DB_DIR = path.join(BASE_DIR, "data/snippetDB.txt");
var PACKAGE_DB_DIR = path.join(BASE_DIR, "data/packageDB.txt");
const DATA_URL = "https://zenodo.org/record/3923490/files/ncqData.zip";
const TMP_DIR = path.join(BASE_DIR, "data/ncqData.zip");
var language = stopword.en;

/**
 * Setup file. Downloads dataset, loads up database etc.
 */

if (require.main == module) {
  main();
}

async function main() {
  //get config
  config = getConfig();

  SNIPPET_DIR = path.join(BASE_DIR, config.get("files.snippets"));
  INFO_DIR = path.join(BASE_DIR, config.get("files.info"));

  //get datasets
  getData();

  //setup database
  //setupDatabase();
}

async function getData() {
  //if either is missing redownload
  if (!fs.existsSync(SNIPPET_DIR)) {
    await downloadData(SNIPPET_DIR);
  } else if (!fs.existsSync(INFO_DIR)) {
    await downloadData(INFO_DIR);
  }
}

async function downloadData(dir) {
  console.error("ERROR: Dataset missing: " + dir);

  //download
  await download(DATA_URL, TMP_DIR);

  //extract to data
  console.log(
    "Extracting from " + TMP_DIR + " to " + path.dirname(SNIPPET_DIR)
  );
  var zip = new Zip(TMP_DIR);
  zip.extractAllTo(path.dirname(SNIPPET_DIR), true);

  console.log("Deleting " + TMP_DIR);
  fs.unlinkSync(TMP_DIR);
}

/**
 *
 * @param {String} url - URL to download from
 * @param {String} dir - Directory to download to
 */
async function download(url, dir) {
  console.log("Downloading Dataset from " + url);
  return new Promise((resolve, reject) => {
    var fileStream = fs.createWriteStream(dir);

    fileStream
      .on("error", (err) => {
        console.log(err);
        reject(err);
      })
      .on("end", () => {
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

// /**
//  * Setup Database
//  */
// function setupDatabase() {
//   //snippet db
//   if (fs.existsSync(SNIPPET_DB_DIR)) {
//     setupSnippets();
//   }

//   // console.log("start read");

//   // //read file
//   // var data = fs.readFileSync(SNIPPET_DIR, { encoding: "utf-8" });

//   // console.log("start parse");

//   // //parse
//   // data = JSON.parse(data);

//   // console.log("start index");

//   // var i = 0;
//   // for (var packData of data) {
//   //   //get package name
//   //   var name = packData["package"];

//   //   if (i % 1000 == 0) {
//   //     console.log(i);
//   //   }

//   //   var snippets = packData["snippets"];
//   //   for (var snippet of snippets) {
//   //     //get snippet info
//   //     var code = snippet["snippet"];
//   //     var id = snippet["id"];
//   //     var order = snippet["num"];
//   //     var description = snippet["description"];

//   //     var snippetObject = {
//   //       id: id,
//   //       description: description,
//   //       package: name,
//   //       code: code,
//   //       order: order,
//   //     };

//   //     if(id == 208){
//   //       //index.add(snippetObject);
//   //       console.log(index.info())
//   //       // console.log(snippetObject);
//   //       // console.log(index)
//   //       index.add(snippetObject);

//   //       console.log(index.info())
//   //       // console.log(index.length)
//   //       // console.log(index)
//   //       // console.log(index.length)
//   //       return;
//   //     }else{
//   //       index.add(snippetObject);
//   //     }

//   //     //     //snippet map
//   //     //     this.idTosnippets.set(id, snippetObject);

//   //     //     //package to ids
//   //     //     var packSnippets = this.packageToSnippet.get(name);
//   //     //     //if doesnt already exist, init array
//   //     //     if (!packSnippets) {
//   //     //       packSnippets = [];
//   //     //     }
//   //     //     packSnippets.push(id);
//   //     //     this.packageToSnippet.set(name, packSnippets);
//   //   }
//   //   i++;
//   // }

//   // console.log("done " + i);
//   // console.log(index.info())

//   // var snippets = index.search({ field: "description", query: "read" });

//   // console.log(snippets.length);

//   // //console.log(index.search({ field: "description", query: "vot" }));

//   // // var database = index.export();

//   // // fs.writeFileSync(DB_DIR, database, { encoding: "utf-8" });

//   // // console.log("done");
// }

// function setupSnippets(){
//   //create index
//   var index = new FlexSearch({
//     tokenize: "strict",
//     doc: {
//       id: "id",
//       field: ["description", "package"],
//     },
//     encode: encode,
//   });

//   var data = fs.readFileSync(SNIPPET_DIR, { encoding: "utf-8" });

//   data = JSON.parse(data);

//   var i = 0;
//   for (var packData of data) {
//     //get package name
//     var name = packData["package"]; 

//     var snippets = packData["snippets"];
//     for (var snippet of snippets) {
//       //get snippet info
//       var code = snippet["snippet"];
//       var id = snippet["id"];
//       var order = snippet["num"];
//       var description = snippet["description"];

//       snippetObject = new Snippet(code, description, id, name, order);

//       index.add(snippetObject);

//     }
//     i++;
//   }

//   var database = index.export();

//   fs.writeFileSync(SNIPPET_DB_DIR, database, { encoding: "utf-8" });

 
//   index.clear();

//   index.import(database);

//   console.log(index);

//   //console.log(index.where({packageName: "1px"})[0]);

// }

function encode(str) {
  var wordsArr = str.split(" ");
  wordsArr = stopword.removeStopwords(wordsArr, this.language);
  wordsArr.map((word) => {
    const cleanWord = word.replace(/[^a-zA-Z ]/g, "");
    return natural.PorterStemmer.stem(word);
  });
  return wordsArr.join(" ").toLowerCase();
}
