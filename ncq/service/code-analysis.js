// Set of functions for code analysis.

const ESTraverse = require("estraverse")
const builtin = require('module').builtinModules;
const path = require("path");



 function getRequireStatements(ast){
    var requires = [];
    
    ESTraverse.traverse(ast, {
      enter: function(node, parent) {
        //look for function calls
        if (node.type === 'CallExpression'){
          //with name require
          if(node.callee.name === "require"){
            var arguments = node.arguments;
            if(arguments.length > 0){
                var id = arguments[0].value;
                var pName = getPackageName(id);
                if(pName){
                    requires.push(pName);
                }
            }
          }
        }
      }
    });
  
    return requires;
 }

 /**
  * Given argument string from function call, return package name.
  * Returns null if bultin or local.
  * @param {String} argument 
  */
 function getPackageName(argument){
    if(isNodeModule(argument)){
        var name = path.basename(argument);
        if(!builtin.includes(name)){
            return name;
        }
    }
 }

 function isNodeModule(id){
     return id.charAt(0) !== '.' ||
     (id.length > 1 &&
     id.charAt(1) !== '.' &&
     id.charAt(1) !== '/' &&
     (process.platform !== 'win32' || id.charAt(1) !== '\\'));
 }

 module.exports = {
     getRequireStatements,
 }

