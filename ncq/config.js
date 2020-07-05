const path = require("path");
const Store = require("data-store");
const utils = require("./utils");

/**
 * Generates a new config file when one doesn't exist based on defaults.
 * Delete your config to regen a new one.
 * The defaults are a guess of what works well, you can customize your config.json if neccessary.
 * To add mac/linux defaults, just replace = default<Key>.
 */

var config;

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
 * Mac specific keybindng overwrites.
 */
var macDefaults = {
  keybindings: {
    cycle: defaultCycle,
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
    autocomplete: defaultAutocomplete,
    cycle: defaultCycle,
    newLine: defaultNewLine,
    cursorDown: defaultCursorDown,
    cursorUp: defaultCursorUp,
    lineEnd: defaultLineEnd,
    lineStart: defaultLineStart,
    historyDown: defaultHistoryDown,
    historyUp: defaultHistoryUp,
    paste: defaultPaste,
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
 * Sets up keybindings. If a config.json doesn't already have the key, the default is added.
 * The config object is handled using data-store, allowing us to read and write to the file easily.
 */
function setupKeybindings() {

  //overwrite defaults based on OS
  handleOS();

  //get keys
  var keys = dflt.keybindings;

  if (!config.has("keybindings")) {
    config.set("keybindings", "{}");
  }

  if (
    !config.has("keybindings.autocomplete") ||
    JSON.stringify(config.get("keybindings.autocomplete")) == "{}"
  ) {
    config.set("keybindings.autocomplete", keys.autocomplete);
  }

  if (
    !config.has("keybindings.cycle") ||
    JSON.stringify(config.get("keybindings.cycle")) == "{}"
  ) {
    config.set("keybindings.cycle", keys.cycle);
  }

  if (
    !config.has("keybindings.newLine") ||
    JSON.stringify(config.get("keybindings.newLine")) == "{}"
  ) {
    config.set("keybindings.newLine", keys.newLine);
  }

  if (
    !config.has("keybindings.cursorUp") ||
    JSON.stringify(config.get("keybindings.cursorUp")) == "{}"
  ) {
    config.set("keybindings.cursorUp", keys.cursorUp);
  }

  if (
    !config.has("keybindings.cursorDown") ||
    JSON.stringify(config.get("keybindings.cursorDown")) == "{}"
  ) {
    config.set("keybindings.cursorDown", keys.cursorDown);
  }

  if (
    !config.has("keybindings.historyUp") ||
    JSON.stringify(config.get("keybindings.historyUp")) == "{}"
  ) {
    config.set("keybindings.historyUp", keys.historyUp);
  }

  if (
    !config.has("keybindings.historyDown") ||
    JSON.stringify(config.get("keybindings.historyDown")) == "{}"
  ) {
    config.set("keybindings.historyDown", keys.historyDown);
  }

  if (
    !config.has("keybindings.lineEnd") ||
    JSON.stringify(config.get("keybindings.lineEnd")) == "{}"
  ) {
    config.set("keybindings.lineEnd", keys.lineEnd);
  }

  if (
    !config.has("keybindings.lineStart") ||
    JSON.stringify(config.get("keybindings.lineStart")) == "{}"
  ) {
    config.set("keybindings.lineStart", keys.lineStart);
  }

  if (
    !config.has("keybindings.paste") ||
    JSON.stringify(config.get("keybindings.paste")) == "{}"
  ) {
    config.set("keybindings.paste", keys.paste);
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
