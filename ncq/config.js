const path = require("path");
const Store = require("data-store");
const utils = require("./utils");

var config;

var defaultAutocomplete = {
    name: 'tab',
    meta: false,
    shift: false,
    option: false,
    sequence: '\t',
    raw: '\t'
}

var defaultCycle = {
    name: '1',
    ctrl: false,
    meta: true,
    shift: false,
    option: false,
}

var defaultNewLine = {
    name: 'return',
    ctrl: false,
    meta: false,
    shift: true,
    option: false,
}

var defaultCursorUp = {
    name: 'up',
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
}

var defaultCursorDown = {
    name: 'down',
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
}

var defaultHistoryUp = {
    name: 'up',
    ctrl: true,
    meta: false,
    shift: false,
    option: false
}

var defaultHistoryDown = {
    name: 'down',
    ctrl: true,
    meta: false,
    shift: false,
    option: false
}

var defaultLineEnd = {
    name: 'right',
    ctrl: true,
    meta: false,
    shift: false,
    option: false
}

var defaultLineStart = {
    name: 'left',
    ctrl: true,
    meta: false,
    shift: false,
    option: false
}

var dflt = {
    keybindings: {
        autocomplete: defaultAutocomplete,
        cycle: defaultCycle,
        newLine: defaultNewLine,
        cursorDown: defaultCursorDown,
        cursorUp: defaultCursorUp,
        lineEnd: defaultLineEnd,
        lineStart: defaultLineStart,
        historyDown: defaultHistoryDown,
        historyUp: defaultHistoryUp
    }
}


function setupKeybindings(){
    if(!config.has("keybindings")){
        config.set("keybindings", "{}")
    }

    if(!config.has("keybindings.autocomplete") || JSON.stringify(config.get("keybindings.autocomplete")) == '{}'){
        config.set("keybindings.autocomplete", defaultAutocomplete);
    }

    if(!config.has("keybindings.cycle") || JSON.stringify(config.get("keybindings.cycle")) == '{}'){
        config.set("keybindings.cycle", defaultCycle);
    }

    if(!config.has("keybindings.newLine") || JSON.stringify(config.get("keybindings.newLine")) == '{}'){
        config.set("keybindings.newLine", defaultNewLine);
    }

    if(!config.has("keybindings.cursorUp") || JSON.stringify(config.get("keybindings.cursorUp")) == '{}'){
        config.set("keybindings.cursorUp", defaultCursorUp);
    }

    if(!config.has("keybindings.cursorDown") || JSON.stringify(config.get("keybindings.cursorDown")) == '{}'){
        config.set("keybindings.cursorDown", defaultCursorDown);
    }

    if(!config.has("keybindings.historyUp") || JSON.stringify(config.get("keybindings.historyUp")) == '{}'){
        config.set("keybindings.historyUp", defaultHistoryUp);
    }

    if(!config.has("keybindings.historyDown") || JSON.stringify(config.get("keybindings.historyDown")) == '{}'){
        config.set("keybindings.historyDown", defaultHistoryDown);
    }

    if(!config.has("keybindings.lineEnd") || JSON.stringify(config.get("keybindings.lineEnd")) == '{}'){
        config.set("keybindings.lineEnd", defaultLineEnd);
    }

    if(!config.has("keybindings.lineStart") || JSON.stringify(config.get("keybindings.lineStart")) == '{}'){
        config.set("keybindings.lineStart", defaultLineStart);
    }

}

function setupConfig(){
    var dir = path.join(utils.getBaseDirectory(), "config.json");
    config = new Store({path: dir});

    setupKeybindings();
}

function getConfig(){
    if(!config){
        setupConfig();
    }

    return config;
}

function getDefault(){
    return dflt;
}

exports.getConfig = getConfig;
exports.getDefault = getDefault;