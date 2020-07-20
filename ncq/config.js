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
 * Keybinding that triggers task suggestions.
 */
var defaultAutocomplete = {
  name: "tab",
  meta: false,
  shift: false,
  option: false,
  sequence: "\t",
  raw: "\t",
};


/**
 * Keybinding that triggers code snippet cycling.
 */
var defaultCycle = {
  name: "1",
  ctrl: false,
  meta: true,
  shift: false,
  option: false,
};

/**
 * Keybinding that triggers a newline character in REPL.
 * Not all terminals can detect shift+enter.
 * You can also do down on last line.
 */
var defaultNewLine = {
  name: "return",
  ctrl: false,
  meta: false,
  shift: true,
  option: false,
};

/**
 * Moves the cursor up a line.
 */
var defaultCursorUp = {
  name: "up",
  ctrl: false,
  meta: false,
  shift: false,
  option: false,
};

/**
 * Moves the cursor down a line.
 */
var defaultCursorDown = {
  name: "down",
  ctrl: false,
  meta: false,
  shift: false,
  option: false,
};

/**
 * Navigates backwards in history to get the previous command.
 */
var defaultHistoryUp = {
  name: "up",
  ctrl: true,
  meta: false,
  shift: false,
  option: false,
};

/**
 * Navigates forward in history.
 */
var defaultHistoryDown = {
  name: "down",
  ctrl: true,
  meta: false,
  shift: false,
  option: false,
};

/**
 * Move to the end of the current line.
 */
var defaultLineEnd = {
  name: "right",
  ctrl: true,
  meta: false,
  shift: false,
  option: false,
};

/**
 * Move to the start of the current line.
 */
var defaultLineStart = {
  name: "left",
  ctrl: true,
  meta: false,
  shift: false,
  option: false,
};

/**
 * Special multiline paste.
 */
var defaultPaste = {
  name: "v",
  ctrl: true,
  meta: false,
  shift: false,
  option: false,
};

/**
 * Copy entire input to clipboard (even non-visble snippets scrolled off screen).
 */
var defaultCopy = {
  name: "s",
  ctrl: true,
  meta: false,
  shift: false,
  option: false,
};

/**
 * Mac specific keybindng overwrites.
 */
var macDefaults = {
  keybindings: {
    cycle: {
      name: "right",
      ctrl: false,
      meta: false,
      shift: true,
      option: false,
    },
  },
};

/**
 * Linux specific keybindng overwrites.
 */
var linuxDefaults = {
  keybindings: {
    cycle: defaultCycle,
  },
};

var dflt = {
  keybindings: {
    autocomplete: [defaultAutocomplete, {name: "f1"}],
    cycle: [defaultCycle, {name: "f3"}],
    cyclePrev: {name: "f2"},
    newLine: [defaultNewLine, {name: "f4"}],
    cursorDown: defaultCursorDown,
    cursorUp: defaultCursorUp,
    lineEnd: defaultLineEnd,
    lineStart: defaultLineStart,
    historyDown: defaultHistoryDown,
    historyUp: defaultHistoryUp,
    paste: [defaultPaste, {name:"f10"}],
    copy: [defaultCopy, {name:"f9"}],
    clear: {name:"f5"},
    help: {name: "f11"},
    exit: {name: "f12"},
  },
  colors: {
    contrast: defaultContrast,
    contrastText: defaultContrastText,
    secondary: defaultSecondary,
  },
};

/**
 * Checks OS and reassigns default keys.
 */
function handleOS() {
  if (process.platform == "darwin") {
    var keys = macDefaults.keybindings;
    reassignKeys(keys);
  } else if (process.platform == "linux") {
    var keys = linuxDefaults.keybindings;
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
    dflt.keybindings[name] = key;
  }
}

/**
 * Updates config with defaults if any are missing.
 */
function update(category){
  var settings = dflt[category];
  var fields = Object.keys(settings);

  for(var field of fields){
    var name = category + "." + field;
    var current = config.get(name);
    
    if(!current || current == {}){
      config.set(name, settings[field]);
    }
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

  //do colours
  if (!config.has("colors")) {
    //set all defaults
    config.set("colors",  dflt.colors);
  } else {
    update("colors");
  }

  //do keybindings
  if (!config.has("keybindings")) {
    config.set("keybindings", dflt.keybindings);
  } else {
    update("keybindings");
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

function getDefault() {
  return dflt;
}

exports.getConfig = getConfig;
exports.getDefault = getDefault;
