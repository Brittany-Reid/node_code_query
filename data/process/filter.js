/**
 * @file Filter the NPM registry dataset (url).
 * The NPM dataset is a csv file seperated by tabs. 
 * The resulting filtered datset contains only packages with snippets and readmes.
 * Run in root directory as `node data/process/filter`
 */


const parse = require('csv-parse')
const fs = require("fs");
const file = "data/NCQDataset.csv";
const result = "data/filteredDataset.csv"

const parser = parse({
    delimiter: '\t',
    relax: true,
    escape: false,
});

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