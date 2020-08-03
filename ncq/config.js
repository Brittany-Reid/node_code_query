const path = require("path");
const Store = require("data-store");
const utils = require("./utils");

/**
 * Generates a new config file when one doesn't exist based on defaults.
 * Delete your config to regen a new one.
 * The defaults are a guess of what works well, you can customize your config.json if neccessary.
 */

var config;

/**
 * Colours. By default the contrast colour will be cyan.
 * We use chalk-pipe for styles.
 */
var defaultContrast = "cyan"; //for contrast text and blocks
var defaultContrastText = "#000000"; //for text in a contrast box, https://github.com/chalk/chalk/issues/303 use hex for black
var defaultSecondary = "purple"; //an additional contrast

/**
 * Default keybindings
 */
var defaultKeybindings = {
  autocomplete: {
    name: "tab",
    meta: false,
    shift: false,
    option: false,
    sequence: "\t",
    raw: "\t",
  },
  cycleNext: {
    name: "1",
    ctrl: false,
    meta: true,
    shift: false,
    option: false,
  },
  cyclePrev: {},
  newLine: {
    name: "return",
    ctrl: false,
    meta: false,
    shift: true,
    option: false,
  },
  cursorDown: {
    name: "down",
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
  },
  cursorUp: {
    name: "up",
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
  },
  lineEnd: {
    name: "right",
    ctrl: true,
    meta: false,
    shift: false,
    option: false,
  },
  lineStart: {
    name: "left",
    ctrl: true,
    meta: false,
    shift: false,
    option: false,
  },
  historyDown: {
    name: "down",
    ctrl: true,
    meta: false,
    shift: false,
    option: false,
  },
  historyUp: {
    name: "up",
    ctrl: true,
    meta: false,
    shift: false,
    option: false,
  },
  paste: {
    name: "v",
    ctrl: true,
    meta: false,
    shift: false,
    option: false,
  },
  copy: {
    name: "s",
    ctrl: true,
    meta: false,
    shift: false,
    option: false,
  },
  clear: {},
  editor: {},
  help: {},
  exit: {},
};

/**
 * Mac specific keybindng overwrites.
 */
var macKeybindings = {
    cycleNext: {
      name: "right",
      ctrl: false,
      meta: false,
      shift: true,
      option: false,
    },
  };

/**
 * Linux specific keybindng overwrites.
 */
var linuxLKeybindings = {};


var colors = {
  contrast: defaultContrast,
  contrastText: defaultContrastText,
  secondary: defaultSecondary,
};

var files = {
  snippets: "data/snippets.json",
  snippetDB: "data/snippetDB.txt",
  info: "data/packageStats.json",
  packageDB: "data/packageDB.txt",
  tasks: "data/id,tasks.txt",
  replHistory: "history-repl.json",
};

var functionKeys = {
  autocomplete: { name: "f1" },
  cyclePrev: { name: "f2" },
  cycleNext: { name: "f3" },
  newLine: { name: "f4" },
  clear: { name: "f5" },
  editor: { name: "f6" },
  copy: { name: "f7" },
  paste: { name: "f8" },
  help: { name: "f9" },
  exit: { name: "f10" },
}

var defaultConfig = {};

// var dflt = {
//   keybindings: {
//     autocomplete: [defaultAutocomplete, { name: "f1" }],
//     cycleNext: [defaultCycle, { name: "f3" }],
//     cyclePrev: { name: "f2" },
//     newLine: [defaultNewLine, { name: "f4" }],
//     cursorDown: defaultCursorDown,
//     cursorUp: defaultCursorUp,
//     lineEnd: defaultLineEnd,
//     lineStart: defaultLineStart,
//     historyDown: defaultHistoryDown,
//     historyUp: defaultHistoryUp,
//     paste: [defaultPaste, { name: "f10" }],
//     copy: [defaultCopy, { name: "f9" }],
//     clear: { name: "f5" },
//     editor: { name: "f8" },
//     help: { name: "f11" },
//     exit: { name: "f12" },
//   },
//   colors: {
//     contrast: defaultContrast,
//     contrastText: defaultContrastText,
//     secondary: defaultSecondary,
//   },
//   files: {
//     snippets: "data/snippets.json",
//     snippetDB: "data/snippetDB.txt",
//     info: "data/packageStats.json",
//     packageDB: "data/packageDB.txt",
//     tasks: "data/id,tasks.txt",
//     replHistory: "history-repl.json",
//   },
// };

/**
 * Checks OS and reassigns default keys.
 */
function handleOS() {
  if (process.platform == "darwin") {
    var keys = macKeybindings;
    reassignKeys(keys);
  } else if (process.platform == "linux") {
    var keys = linuxLKeybindings;
    reassignKeys(keys);
  }
}

/**
 * Function that reassigns only given keys in the keySet, called by handleOS.
 */
function reassignKeys(keySet) {
  var keyNames = Object.keys(keySet);
  for (var i = 0; i < keyNames.length; i++) {
    var name = keyNames[i];
    var key = keySet[name];
    defaultKeybindings[name] = key;
  }
}

/**
 * Updates config with defaults if any are missing.
 */
function update(category) {
  var settings = defaultConfig[category];
  var fields = Object.keys(settings);

  for (var field of fields) {
    var name = category + "." + field;
    var current = config.get(name);

    if (!current || current == {}) {
      config.set(name, settings[field]);
    }
  }
}

function setupDefault(){
  defaultConfig.keybindings = defaultKeybindings;
  defaultConfig.colors = colors;
  defaultConfig.files = files;

  var keyNames = Object.keys(functionKeys);
  for(var name of keyNames){
    var binding = defaultConfig.keybindings[name];
    if(!binding || !Object.keys(binding).length){
      binding = functionKeys[name];
    }
    else if (typeof binding === "array"){
      binding = [...binding, functionKeys[name]];
    }
    else{
      binding = [binding, functionKeys[name]];
    }

    defaultConfig.keybindings[name] = binding;
  }

}

/**
 * Sets up keybindings. If a config.json doesn't already have the key, the default is added.
 * The config object is handled using data-store, allowing us to read and write to the file easily.
 */
function setupKeybindings() {
  var current;

  //overwrite defaults based on OS
  handleOS();

  //setup defaults
  setupDefault();

  //do colours
  if (!config.has("colors")) {
    //set all defaults
    config.set("colors", defaultConfig.colors);
  } else {
    update("colors");
  }

  //do keybindings
  if (!config.has("keybindings")) {
    config.set("keybindings", defaultConfig.keybindings);
  } else {
    update("keybindings");
  }

  //do files
  if (!config.has("files")) {
    config.set("files", defaultConfig.files);
  } else {
    update("files");
  }
}

function setupConfig() {
  var dir = path.join(utils.getBaseDirectory(), "config.json");
  config = new Store({ path: dir });

  setupKeybindings();
}

function getConfig() {
  if (!config) {
    setupConfig();
  }

  return config;
}

function getFunctionKeys(){
  return functionKeys;
}

function getDefault() {
  return defaultConfig;
}

exports.getConfig = getConfig;
exports.getDefault = getDefault;
exports.getFunctionKeys = getFunctionKeys;
