/*
 * This file runs the linter on the code snippets used in the user study. The code snippets were exported from Excel and use "" double quotes to escape.
 * To run:
 *  node data/scripts/user-study-snippets
 * 
 * It prints the number of linting errors, I just copy and pasted these into the google sheet.
 */

const path = require("path");
const fs = require("fs");
const parse = require('csv-parse');
const Evaluator = require("../../src/core/evaluator/evaluator");
const Snippet = require("../../src/core/snippet");
const LinterHandler = require("../../src/core/evaluator/linter-handler");


const DATA_DIR = "data/user-study";

/**
 * Snippets from first user study.
 */
const snippets1 = "codesnippets1.csv"
/**
 * Snippets from second user study.
 */
const snippets2 = "codesnippets2.csv"

const parser = parse({
    delimiter: ','
});

var evaluator = new Evaluator();

var linter = new LinterHandler();

async function lintFile(file){

    await new Promise((resolve)=>{
        
        const pipeline = fs.createReadStream(path.join(DATA_DIR, file)).pipe(parser);

        var r = -1
        pipeline.on("data", async (data) => {
            r++
            if(r == 0) return;
            var messages = linter.lint(data[3]);
            var errors = LinterHandler.errors(messages);

            console.log(errors.length)

        });

        //on end
        pipeline.on("end", (data) => {
            console.log("Done!")
            resolve();
        });
    })

}

async function main(){
    await lintFile(snippets1);
    //run one at a time 
    // await lintFile(snippets2);
}

main();