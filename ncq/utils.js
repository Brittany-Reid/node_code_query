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

exports.getBaseDirectory = getBaseDirectory;
exports.options = options;
