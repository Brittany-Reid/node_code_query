const parse = require('csv-parse')
const fs = require("fs");
const file = "NCQDataset2.csv";

const parser = parse({
    delimiter: '\t',
    relax: true,
    escape: false,
});

const pipeline = fs.createReadStream(file).pipe(parser);

var i =0;
pipeline.on("data", async (data) => {
    // console.log(data);
    
    if(i%10000 === 0) console.log(i)
    i++;
});

//on end
pipeline.on("end", (data) => {
    console.log(i)
});