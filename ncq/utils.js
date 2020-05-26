const path = require("path");

function options(args){

    //default options
    var options = {
        log : false,
    }

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if(arg === "--log"){
            options.log = true;
        }
    }

    return options;
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

exports.getBaseDirectory = getBaseDirectory;
exports.generateChoices = generateChoices;
exports.options = options;
