const parse = require("csv-parse");
const fs = require("fs");

function _extends() { var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/**
 * Read a CSV file as stream. Returns a promise.
 */
function readCSVStream(file, onData = (data, pipeline)=>{}, onEnd = (data)=>{}, onClose = ()=>{}, options = {
    delimiter: '\t',
    relax: true,
    escape: false,
    columns:true,
}){
    const parser = parse(options);

    var pipeline = fs.createReadStream(file, {encoding: "utf-8"}).pipe(parser);

    return new Promise((resolve, reject) => {
        pipeline.on("data", (data) => {
            onData(data, pipeline);
        });
        pipeline.on("end", (data) => {
            onEnd(data);
            resolve();
        });
        pipeline.on("close", (data) =>{
            onClose();
            resolve();
        });
    });
}

module.exports = {
    _extends,
    readCSVStream
};