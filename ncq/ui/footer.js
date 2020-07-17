const colors = require("ansi-colors");
const { getConfig } = require("../config");
const { to_width, width_of } = require("to-width");

var keys;

function getKey(key){
    var binding = keys[key];
    var name;
    if(binding["name"]){
        name = binding["name"];
    }

    if(name){
        if(binding["meta"]){
            name = "alt + " + name;
        }
        if(binding["shift"]){
            name = "shift + " + name;
        }
        if(binding["option"]){
            name = "option + " + name;
        }
        if(binding["ctrl"]){
            name = "ctrl + " + name;
        }
        return name;
    }
}

/**
 * Generates a footer for our prompt, called from prompt so can use this. to access values.
 */
function footer(){
    //get key bindings
    if(!keys){
        var config = getConfig();
        keys = config.get("keybindings");
    }

    var content = [];

    //autocomplete command
    var key = "autocomplete";
    var command = getKey(key);
    if(command){
        content.push(key + ": <" + command + ">");
    }

    if(this.snippets){
        key = "cycle";
        command = getKey(key);
        if(command){
            content.push(key + ": <" + command + ">");
        }
    }
    
    key = "copy";
    command = getKey(key);
    if(command){
        content.push(key + " all" + ": <" + command + ">");
    }

    content = " keys: " + content.join(" | ");


    //format length
    content = to_width(content, this.width);

    //format colour
    content = colors.bgBlackBright(content)

    return content;
}

exports.footer = footer;