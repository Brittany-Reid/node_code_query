/*
 * This file does a mass extraction of code snippets and saves them to a file.
 */

const { Downloader, Extractor } = require("../lib");
const fs = require("fs");
const { time } = require("console");

//all package entries url
const allDocsURL = "https://replicate.npmjs.com/_all_docs";

//destination
const SNIPPET_FILE = "snippets.json";

/**
 * Max number of packages to download readmes for.
 */
const MAX = 100; 

const START = 0;

/**
 * Max number of requests to send asynchronously.
 * Node.js is single threaded but this does improve total download time.
 * You just don't want to send too many requests at the same time.
 */
const BATCH_SIZE = 5; 

var first = true;
var readmes = [];

async function getAllDocs(){
	var allDocs;
	//download and save
	if(!fs.existsSync("all_docs.json")){
		allDocs = await Downloader.download(allDocsURL);
		fs.writeFileSync("all_docs.json", allDocs);
	}
	//read
	else{
		allDocs = fs.readFileSync("all_docs.json", {encoding: "utf-8"});
	}
	return allDocs;
}

async function getPackageNames(){
	//get list of all packages
	var allDocs = await getAllDocs();
    
	//parse
	var data = JSON.parse(allDocs);
    
	var packageNames = [];
    
	var rows = data.rows;
	for (var r of rows){
		//all keys/ids match
		// if(r.id !== r.key){
		// 	console.log(r.id);
		// 	console.log(r.key);
		// }
        
		packageNames.push(r.id);
	}
    
	return packageNames;
}

async function doName(name){
	var downloader = new Downloader();
	var readme;
	var errors = [];
	try{
		readme = await downloader.getReadme(name);
	} catch(e){
		errors = downloader.events;
		errors.push(e.message);
	}
    
	return {name: name, readme: readme, errors: errors};
}

/**
 * Does a number of jobs asynchronously
 * @param {*} batch 
 */
async function doBatch(batch){
	var promiseArray = [];
	for(var b of batch){
		promiseArray.push(doName(b));
	}
    
	return await Promise.all(promiseArray);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getSnippets(readme, package){
    var snippets = [];
    if(readme){
        var extractor = new Extractor();
        snippets = extractor.extract(readme);
    }

    var toWrite = {
        name: package,
        snippets: snippets,
    }
    toWrite = JSON.stringify(toWrite);
    if(first){
        first = false;
    }
    else{
        toWrite = "," + toWrite;
    }

    fs.appendFileSync(SNIPPET_FILE, toWrite);
}

async function main(){
	var packageNames = await getPackageNames();
    
    console.log(packageNames.length + " packages.");
    
    shuffleArray(packageNames);

    fs.writeFileSync(SNIPPET_FILE, '[');

    //stats
	//you could also pipe the console to a file and process the logs after the fact for the same stats
	//but lets do it as we go to show its possible
	var successes = 0;
	var empties = 0;
	var fails = 0;
	var noRepos = 0;
	var noDataError = 0;
	var notGithub = 0;
	var cantFindRepoReadme = 0;
	var sites = {};
    
	//do in batches
	var i = 0;
	var batch = [];
	//for each package
	for(var p of packageNames){
		//stop at max
		if(i === MAX) break;
		if(i < START) {
			i++;
			continue;
		}
        
		//construct batch
		batch.push(p);
        
		//at batch limit, send and wait
		if(batch.length === BATCH_SIZE || i === MAX-1){
			var current = await doBatch(batch);
			console.log("Batch " + (i+1));
            
			for(var c of current){

				var out = {
					name: c.name,
					status: "fail",
					errors: c.errors,
				};
				if(typeof c.readme !== "undefined"){
					out.status = "success";
                    
					//get success stats
					successes++;
					if(c.readme.length < 1){
						empties++;
					}
				}
				else{
					fails++;
				}
                
				console.log(JSON.stringify(out));
                

				//stats processing
				if(c.errors.includes("No Repository")){
					noRepos++;
				}
				if(c.errors.includes("NPM README error \"ERROR: No README data found!\".")){
					noDataError++;
				}
				if(c.errors.includes("No README in repository.")){
					cantFindRepoReadme++;
				}
				for(var e of c.errors){
					if(e.includes("Repository hosted on unsupported site")){
						notGithub++;
						var urlParts = e.split("\"");
						try{
							var url = new URL(urlParts[1]);
							var host = url.host;
							if(!sites[host]){
								sites[host] = 0;
							}
							sites[host]++;
						}
						catch(e){
							sites[urlParts[1]] = (sites[urlParts[1]] || 0) + 1;
						}
					}
                }
            

                
				//large downloads may exeed alloted ram,
				//so this is commented out.
				//you should use a stream to write to a file
				//we dont print readme to keep the console clean in this example

				//save the output object with readme
				// out.readme = c.readme;
				// readmes.push(out);
            }
            
            //after errors do snippets
            for(var c of current){
                getSnippets(c.readme, c.name);
            }
            
			//reset batch
			batch = [];
		}
        
		i++;
    }
    
    fs.appendFileSync(SNIPPET_FILE, ']');

    JSON.parse(fs.readFileSync(SNIPPET_FILE))
    
	console.log("END");
	//packages with readmes
	console.log("Packages with READMEs: " + successes + " out of " + (MAX-START) + " (" + Math.round((successes/(MAX-START))*10000)/100 + "%).");
	//how many of those are empty
	console.log("Empty READMEs: " + empties);
	//how many had no repository, only looked at the saved readme
	console.log("No repository: " + noRepos);
	//how many we couldn't get a readme for/don't have
	console.log("Failures: " + fails);
	//how many have the NPM no data error? 
	console.log("No README data error: " + noDataError);
	//how many packages have a repo but cant find readme in it?
	//you might want to check these manually for more common readme name patterns
	console.log("No README in repository: " + cantFindRepoReadme);

	//how many are hosted on a non-github site?
	console.log("Non-github repository: " + notGithub);
    
	console.log("Sites:");
	console.log(sites);
}

main();