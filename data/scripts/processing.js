const fs = require("fs");
const StreamObject = require("stream-json/streamers/StreamObject");
const StreamArray = require("stream-json/streamers/StreamArray");
var stringify = require('csv-stringify');

const file = "npmData.json";
const out = "dataset.csv";
var csv = [];

function setUpCSVStream(){
  fs.writeFileSync(out, "");
  const stringifier = stringify({
    header: true,
    delimiter: "\t",
    quoted:false,
    quote:false,
    cast:{
      string: function(value){
        //console.log([JSON.stringify(value)])
        return {value: JSON.stringify(value), quoted:false, quote:false}
      },
      object: function(value){
        return JSON.stringify(value);
      },
    }
  })
  
  stringifier.on('readable', function(){
    let row;
    while(row = stringifier.read()){
      //console.log(row.toString())
      // console.log(row.toString())
      fs.appendFileSync(out, row);
    };
  });

  stringifier.on('error', function(err){
    console.error(err.message)
  });

  stringifier.on('finish', function(){ 
  });

  return stringifier;
}

function readFile(file, onData = function (){}, onEnd = function (){}, streamer = StreamArray.withParser()){
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
      }));
}

async function main(){
    var csvStream = setUpCSVStream();

    var i = 0;
    const onData = (data, pipeline) => {
        if(i % 10000 === 0) console.log(i); 
        var value = data.value;
        var name = value.name;
        var description = value.description;
        var keywords = value.keywords;
        var license = value.license;
        var repository = value.repository;
        var repositoryUrl;
        if(repository) repositoryUrl = repository.url;
        var readme = value.readme;
        var time = value.time;
        var modified;
        if(time){
          modified = time.modified;
        }
        var snippets = value.snippets;
        var codeBlocks = value.codeblocks;
        var readmeLines = value.readmeLines;
        var hasInstallExample = value.hasInstallExample;
        var hasRunExample = value.hasRunExample;

        var newObject = {
          name: name,
          description: description,
          keywords: keywords,
          license: license,
          repositoryUrl: repositoryUrl,
          readme: readme,
          timeModified: modified,
          snippets: snippets,
          numberOfCodeBlocks: codeBlocks,
          linesInReadme: readmeLines,
          hasInstallExample: hasInstallExample,
          hasRunExample: hasRunExample,
        }
        // if(readme && snippets.length > 0){
        //   csvStream.write(newObject);
        // }
        csvStream.write(newObject);

        // stringify([line], {quoted:true}, function(error, out){
        //   console.log(out);
        //   process.exit();
        // })
        i++;
        
    }
    const onEnd = (data) => {
      
    }
    await readFile(file, onData, onEnd);
    console.log(csv)
}


main();