/**
 * @file Filter the NPM registry dataset (url).
 * The NPM dataset is a csv file seperated by tabs. 
 * The resulting filtered datset contains only packages with snippets and readmes.
 * Run in root directory as `node data/process/filter`
 */


const parse = require('csv-parse')
const fs = require("fs");
const { readCSVStream } = require('../../ncq/utils');
const file = "data/NCQDataset.csv";
const result = "data/filteredDataset.csv"
const gh = "data/gh.csv"

const parser = parse({
    delimiter: '\t',
    relax: true,
    escape: false,
});

function filter(){
    const pipeline = fs.createReadStream(file).pipe(parser);

    var i =0;
    var j = 0;
    pipeline.on("data", async (data) => {
        var name = data[0];
        var description = data[1];
        var keywords = data[2];
        var license = data[3];
        var repositoryUrl = data[4];
        var readme = data[5];
        var timeModified = data[6];
        var snippets = data[7];
        var numberOfCodeBlocks = data[8];
        var linesInReadme = data[9];
        var hasInstallExample = data[10];
        var hasRunExample = data[11];

        //1. remove readme field (to save space as unused)
        var line = [name, description, keywords, license, repositoryUrl, timeModified, snippets, numberOfCodeBlocks, linesInReadme, hasInstallExample, hasRunExample];

        //2.a write the line if header line
        if(i === 0) fs.writeFileSync(result, line.join("\t")+"\n")
        //2.b write line if has snippets and readme
        else{
            //3. get array of non empty snippets
            snippets = JSON.parse(snippets)
            var newSnippets = [];
            for(var s of snippets){
                if(s.trim() !== ""){
                    newSnippets.push(s);
                }
            }
            //update line
            snippets = JSON.stringify(newSnippets);
            var line = [name, description, keywords, license, repositoryUrl, timeModified, snippets, numberOfCodeBlocks, linesInReadme, hasInstallExample, hasRunExample];
            if(newSnippets.length > 0 && readme){
                fs.appendFileSync(result, line.join("\t")+"\n")
            }
            else{j++;}
        }
        
        //if(i===10)process.exit();
        if(i%10000 === 0) console.log(i)
        i++;
    });

    //on end
    pipeline.on("end", (data) => {
        console.log(i)
        console.log(j)
    });
}

async function addGithub(){
    var packages = new Map();
    await readCSVStream("data/datasetold.csv", (data) => {
        var name = data.name;
        data.stars = 0;
        data.fork = false,
        data.forks = 0,
        data.watchers = 0,
        data.hasTestDirectory = false,
        packages.set(name, data);
    })

    var line = ["name", "description", "keywords", "license", "repositoryUrl", "timeModified", "snippets", "numberOfCodeBlocks", "linesInReadme", "hasInstallExample", 
        "hasRunExample", "stars", "fork", "forks", "watchers", "hasTestDirectory"].join("\t")
    fs.writeFileSync("data/dataset2.csv", line+"\n");
    
    var file = fs.readFileSync(gh, {encoding:"utf-8"});
    var lines = file.split("\n");
    var i =0;
    for(var l of lines){
        var parts = l.split("\t");
        var name = parts[0];
        var stars = parts[1];
        var fork = parts[2];
        var forks = parts[3];
        var watchers = parts[4];
        var hasTestDirectory = parts[5];
        if(!packages.has(name)){//
        }
        else{
            var data = packages.get(name);
            data.stars = stars;
            data.fork = fork;
            data.forks = forks;
            data.watchers = watchers;
            data.hasTestDirectory = hasTestDirectory;
        }
        i++;
    }
    packages.forEach((value) => {
        let data = value;
        var line = [data.name, data.description, data.keywords, data.license, data.repositoryUrl, data.timeModified, data.snippets, data.numberOfCodeBlocks, data.linesInReadme, data.hasInstallExample, data.hasRunExample, 
            data.stars, data.fork, data.forks, data.watchers, data.hasTestDirectory].join("\t");
        fs.appendFileSync("data/dataset2.csv", line+"\n");
    })
}


//filter();
addGithub();

