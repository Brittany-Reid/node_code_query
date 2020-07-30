const DataHandler = require("./service/data-handler");
const { getConfig } = require("./config");
const utils = require("./utils");

const Zip = require("adm-zip");
const axios = require("axios");
const FlexSearch = require("flexsearch");
const fs = require("fs");
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
 * This requires the --max-old-space-size=3072 option on run (already setup for install/setup commands).
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
  setupDatabase();
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

/**
 * Setup Database
 */
function setupDatabase() {
  //package info db
  if (!fs.existsSync(PACKAGE_DB_DIR)) {
    setupPackageInfo();
  }

  //snippet db
  if (!fs.existsSync(SNIPPET_DB_DIR)) {
    setupSnippets();
  }
}

function setupPackageInfo() {
  console.log("Package Info Database does not exist. Creating...");

  var index = new FlexSearch("memory", {
    tokenize: "strict", //opposed to splitting a word into f/fi/fil/file our search is non specific enough as is
    doc: {
      id: "id", //index by name for fast look up
      field: ["Description", "Keywords"],
    },
    encode: encode,
  });

  //read in file
  var data = fs.readFileSync(INFO_DIR, { encoding: "utf-8" });

  //parse as JSON
  data = JSON.parse(data);

  var i = 0;
  for (var packData of data) {
    var packageObject = {};

    //we don't use every field, but I picked out what could be useful in the future
    //packageObject["Name"] = packData["Name"];
    packageObject["id"] = i;
    packageObject["Description"] = packData["Description"];
    // packageObject["Repository Stars Count"] = packData["Repository Stars Count"];
    packageObject["Keywords"] = packData["Keywords"];
    // packageObject["Licenses"] = packData["Licenses"];
    // packageObject["SourceRank"] = packData["SourceRank"];
    // packageObject["Repository Forks Count"] =
    //   packData["Repository Forks Count"];
    // packageObject["Repository Contributors Count"] =
    //   packData["Repository Contributors Count"];
    // packageObject["Latest Release Publish Timestamp"] =
    //   packData["Latest Release Publish Timestamp"];
    // packageObject["Latest Release Number"] = packData["Latest Release Number"];
    // packageObject["Dependent Projects Count"] =
    //   packData["Dependent Projects Count"];
    // packageObject["Dependent Repositories Count"] =
    //   packData["Dependent Repositories Count"];
    // packageObject["Repository Fork?"] = packData["Repository Fork?"];
    // packageObject["Repository Created Timestamp"] =
    //   packData["Repository Created Timestamp"];
    // packageObject["Repository Updated Timestamp"] =
    //   packData["Repository Updated Timestamp"];
    // packageObject["Repository Issues enabled?"] =
    //   packData["Repository Issues enabled?"];
    // packageObject["Repository Wiki enabled?"] =
    //   packData["Repository Wiki enabled?"];
    // packageObject["Repository Pages enabled?"] =
    //   packData["Repository Pages enabled?"];


    index.add(packageObject);

    i++;
  }

  var database = index.export();

  fs.writeFileSync(PACKAGE_DB_DIR, database, { encoding: "utf-8" });

  console.log("DONE!");

  console.log("Package info database was saved to " + PACKAGE_DB_DIR);
}

function setupSnippets() {
  console.log("Snippet Database does not exist. Creating...");

  //create index
  var index = new FlexSearch("memory", {
    tokenize: "strict",
    doc: {
      id: "id",
      field: ["description"],
    },
    encode: encode,
  });

  var data = fs.readFileSync(SNIPPET_DIR, { encoding: "utf-8" });

  data = JSON.parse(data);

  var i = 0;
  for (var packData of data) {
    var snippets = packData["snippets"];
    for (var snippet of snippets) {
      var snippetObject = {};

      snippetObject["package"] = packData["package"];
      snippetObject["description"] = snippet["description"];
      // snippetObject["snippet"] = snippet["snippet"];
      // snippetObject["num"] = snippet["num"];
      snippetObject["id"] = snippet["id"];

      index.add(snippetObject);
    }

    i++;
  }

  var database = index.export();

  fs.writeFileSync(SNIPPET_DB_DIR, database, { encoding: "utf-8" });

  console.log("DONE!");

  console.log("Snippet database was saved to: " + SNIPPET_DB_DIR);
}

function encode(str) {
  var words = DataHandler.keywords(str);
  return words.join(" ");
}
