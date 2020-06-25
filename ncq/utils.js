const path = require("path");

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

exports.getBaseDirectory = getBaseDirectory;
exports.generateChoices = generateChoices;
exports.options = options;
