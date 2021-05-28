const fs = require("fs");
const path = require("path");
const parse = require("csv-parse");

var opts;
var defaultOptions = { log : false};

function options(args){

    if(opts) return opts;

    opts = defaultOptions;
  
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if(arg === "--log"){
            opts.log = true;
        }
        if(arg === "--usage"){
            opts.usage = true;
        }
        if(arg === "--searchless"){
            opts.searchless = true;
        }
    }

    return opts;
}

function getBaseDirectory() {
    var base = __dirname;
    //fall back if we run from node_code_query/ncq
    if (
        path.dirname(base) != "node_code_query" &&
    path.dirname(base) != "node_code_query/"
    ) {
        base = path.join(base, "../");
    }
    return base;
}

function generateChoices(choices = [], type){
    var result = [];
    for (let i = 0; i < choices.length; i++) {
        const choice = choices[i];
        const entry = {name : choice, type: type};
        if(type == "command"){
            entry["value"] = choice + "(\"\")"
        }
        result.push(entry);
    }
    return result;
}

/**
 * Prints a list as columns that fit given width. Adapted from python Cmd.
 */
function printColumns(list = [], displaywidth = 80){
    var size = list.length;
    if (size === 1) {
        console.log(list[0]);
        return;
    }
    var nr,
        nc,
        cwidth = 0;
    var cwidths = [];
    var b = false;
    for (nr = 1; nr < list.length; nr++) {
        nc = size + nr - 1;
        cwidths = [];
        var totwidth = -2;
        for (let c = 0; c < nc; c++) {
            cwidth = 0;
            for (let r = 0; r < nr; r++) {
                var i = r + nr * c;
                if (i >= size) {
                    break;
                }
                var x = list[i];
                cwidth = Math.max(cwidth, x.length);
            }
            cwidths.push(cwidth);
            totwidth += cwidth + 2;
            if (totwidth > displaywidth) {
                break;
            }
        }
        if (totwidth <= displaywidth) {
            b = true;
            break;
        }
    }
    if (!b) {
        nr = list.length;
        nc = 1;
        cwidths = [0];
    }
    for (let r = 0; r < nr; r++) {
        var texts = [];
        for (let c = 0; c < nc; c++) {
            i = r + nr * c;
            x = "";
            if (i >= size) {
                x = "";
            } else {
                x = list[i];
            }
            texts.push(x);
        }
        console.log(texts.join("  "));
    }
}

/**
 * Read a CSV file as stream. Returns a promise.
 */
function readCSVStream(file, onData = (data, pipeline)=>{}, onEnd = (data)=>{}, onClose = ()=>{}){
    const parser = parse({
        delimiter: '\t',
        relax: true,
        escape: false,
        columns:true,
    });

    var pipeline = fs.createReadStream(file, {encoding: "utf-8"}).pipe(parser);

    return new Promise((resolve, reject) => {
        pipeline.on("data", (data) => {
            onData(data, pipeline);
        })
        pipeline.on("end", (data) => {
            onEnd(data);
            resolve();
        })
        pipeline.on("close", (data) =>{
            onClose();
            resolve();
        })
    });
}


exports.getBaseDirectory = getBaseDirectory;
exports.generateChoices = generateChoices;
exports.options = options;
exports.printColumns = printColumns;
exports.readCSVStream = readCSVStream;
