const fs = require("fs");
const parse = require('csv-parse');
const { Downloader } = require("../lib");
const GitHubMiner = require("../lib/extractor/githubminer");
const { HTTPStatusError } = require("../lib/extractor/downloader");
const dataset = "NCQDataset.csv";
const d2 = "names.csv";
const out = "gh.csv";

var start = 99962;
const BATCH_SIZE = 5;

var packages = [];

function readFile(file, onData = function (){}, onEnd = function (){}, onClose = function(){}, streamer = StreamArray.withParser()){
    return (promise = new Promise((resolve, reject) => {
        //create pipeline
        const pipeline = fs.createReadStream(file).pipe(streamer);
        //on data
        pipeline.on("data", async (data) => {
            onData(data, pipeline);
        });

        //on end
        pipeline.on("end", (data) => {
            onEnd();
            resolve();
        });

        pipeline.on("close", (data) =>{
            onClose();
            resolve();
        })
      }));
}

async function main(){

    const parser = parse({
        delimiter: '\t',
        relax: true,
        escape: false,
        columns:true,
    });

    var i = 0;
    const onData = (data, pipeline) =>{
        var name = data.name;
        var url = data["repositoryUrl"];
        packages.push({
            name: name,
            url: url
        })
        // if(i===2){
        //     pipeline.destroy();
        //     return;
        // }
        i++;
    }

    await readFile(d2, onData, function(){}, function(){}, parser)
    var g = new GitHubMiner();
    var j=0;
    for(var p of packages){
        if(j < start) {
            console.log("less")
            j++;
            continue;
        }
        // console.log(j);
        // if(j===0) fs.writeFileSync(out, ["name", "stars", "fork", "forks", "watchers", "hasTestDirectory"].join("\t")+"\n")
        // var url = p.url;
        // var repoName;
        // if(url){
        //     repoName = GitHubMiner.getRepo(url);
        // }
        // var data = await g.getRepoData(repoName);
        // var line = [p.name, data.stars, data.fork, data.forks, data.watchers, data.hasTestDirectory].join("\t")+"\n";
        // fs.appendFileSync(out, line);
        // data.name = p.name;
        // console.log(data);
        j++;
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

var gm = new GitHubMiner();

async function doPackage(data){
    var repoName;
    if(data.url){
        repoName = GitHubMiner.getRepo(data.url);
    }
    var result = await gm.getRepoData(repoName);
    result.name = data.name;
    return result;
}

async function doBatch(batch, next){
    var promiseArray = [];
	for(var b of batch){
        // console.log(b.name)
		promiseArray.push(new Promise(async (resolve, reject)=>{
			var t = setTimeout(()=>{
				clearTimeout(t);
				reject(new Error("timeout"));
			}, 1000000)
			try{
				var p = await doPackage(b);
				clearTimeout(t);
				resolve(p);
			}
			catch(e){
				reject(e);
			}
		}));
	}

    var p;
	try{
		p = await Promise.all(promiseArray);
		return p;
	}
	catch(e){
		if(e.message === "timeout") p = await doBatch(batch);
        if((e instanceof HTTPStatusError) && e.statusCode === 403 && e.wait){
            if(!next) gm.nextToken();
            else{
                var wait = e.wait * 1000 - Date.now();
                await delay(wait);
            };
            p = await doBatch(batch, true);
        }
		return p;
	}

}

async function main2(){
    var g = new GitHubMiner();

    var file = fs.readFileSync(d2, {encoding:"utf-8"});
    var lines = file.split("\n");
    var batch = [];
    var i=0;
    for(var l of lines){
        if(i<start){
            i++;
            continue;
        }
        console.log(i);
        if(i===0){
            fs.writeFileSync(out, ["name", "stars", "fork", "forks", "watchers", "hasTestDirectory"].join("\t")+"\n")
        }
        var parts = l.split("\t");
        var data = {
            name: parts[0],
            url: parts[1],
        }

        batch.push(data);
        if(batch.length >= BATCH_SIZE){
            var results = await doBatch(batch);
            for (var r of results){
                var line = [r.name, r.stars, r.fork, r.forks, r.watchers, r.hasTestDirectory].join("\t")+"\n";
                fs.appendFileSync(out, line);
            }
            batch = [];
        }
        // else{
        //     var parts = l.split("\t");
        //     var name = parts[0];
        //     var url = parts[1];
        //     var repoName;
        //     if(url){
        //         repoName = GitHubMiner.getRepo(url);
        //     }
        //     var data = await g.getRepoData(repoName);
        //     var line = [name, data.stars, data.fork, data.forks, data.watchers, data.hasTestDirectory].join("\t")+"\n";
        //     fs.appendFileSync(out, line);
        // }
        // data.name = p.name;
        // console.log(data);
        //if(i=== 4) process.exit();
        i++;
    }
    // if(batch.length > 0){
    //     var results = await doBatch(batch);
    //     for (var r of results){
    //         console.log(r);
    //     }
    //     batch = [];
    // }
    // const parser = parse({
    //     delimiter: '\t',
    //     relax: true,
    //     escape: false,
    //     columns:true,
    // });

    // var i = 0;
    // const onData = (data, pipeline) =>{
    //     if(i===0) fs.writeFileSync(d2, "name\turl\n")
    //     var name = data.name;
    //     var url = data["repositoryUrl"];
    //     packages.push({
    //         name: name,
    //         url: url
    //     })
    //     fs.appendFileSync(d2, name + "\t" + url + "\t\n");
    //     // if(i===2){
    //     //     pipeline.destroy();
    //     //     return;
    //     // }
    //     i++;
    // }

    // await readFile(dataset, onData, function(){}, function(){}, parser)
}


/**
 * Check if missing any packages from GitHub
 */
async function main3(){
    var packages = new Map();
    var file = fs.readFileSync(d2, {encoding:"utf-8"});
    var lines = file.split("\n");
    var batch = [];
    var i=0;
    for(var l of lines){
        i++;
        if(i === 1) continue;
        var parts = l.split("\t");
        var name = parts[0];
        var url = parts[1];
        packages.set(name, url);
    }
    var file2 = fs.readFileSync(out, {encoding:"utf-8"});
    lines = file2.split("\n");
    for(var l of lines){
        var parts = l.split("\t");
        var name = parts[0];
        if(!packages.has(name)) console.log(name)
    }
}

//main2();

//main();

main3();

