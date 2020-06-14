require("mocha");
var assert = require("assert");
const BasePrompt = require("../ncq/ui/prompts/suggestion-prompt");
const sinon = require("sinon");
const PromptHandler = require("../ncq/ui/prompt-handler");
const { getDefault } = require("../ncq/config");

const tab = {
  name: "tab",
  sequence: "\t",
  raw: "\t",
  ctrl: false,
  meta: false,
  shift: false,
  option: false,
};

/**
 * Utility function, takes a string to send as input to Enquirer prompt
 * and simulates keypresses.
 */
async function send(string, prompt) {
  //send each character as a keypress
  for (let i = 0; i < string.length; i++) {
    await prompt.keypress(string[i]);
  }
  //finish
  await prompt.submit();
}

/**
 * Unit tests for the BasePrompt class
 */
describe("BasePrompt", function () {
  var output = [];

  /**
   * This runs once, before tests.
   * We hide output and store it in an array so we can check what gets printed.
   */
  before(() => {
    // stub console log to push to an array
    sinon.stub(console, "log").callsFake(function (string) {
      output.push(string);
    });
  });

  /**
   * This runs before each tests.
   * The clear the output array.
   */
  this.beforeEach(() => {
    output = [];
  });

  describe("unit tests", function () {
    it("should allow custom non choice", async function () {
      var prompt = new BasePrompt({ choices: ["a", "b"], show: false });

      prompt.once("run", async () => {
        prompt.keypress("c");
        prompt.submit();
      });

      var out = await prompt.run();

      assert.strictEqual(out, "c");
    });
    it("should allow empty", async function () {
      var prompt = new BasePrompt({ choices: ["a", "b"], show: false });

      prompt.once("run", async () => {
        prompt.submit();
      });

      var out = await prompt.run();

      assert.strictEqual(out, "");
    });
    it("should toggle autocomplete and insert", async function () {
      var prompt = new BasePrompt({ choices: ["a", "b"], show: false });

      prompt.once("run", async () => {
        //default toggle
        prompt.keys["autocomplete"] = getDefault().keybindings.autocomplete;
        await prompt.keypress("\t", tab);
        await prompt.submit();
        await prompt.submit();
      });

      var out = await prompt.run();

      assert.strictEqual(out, "a");
    });
    it("should toggle autocomplete on and off", async function () {
      var prompt = new BasePrompt({ choices: ["a", "b"], show: false });

      prompt.once("run", async () => {
        //default toggle
        prompt.keys["autocomplete"] = getDefault().keybindings.autocomplete;
        await prompt.keypress("\t", tab);
        await prompt.keypress("\t", tab);
        await prompt.submit();
      });

      var out = await prompt.run();

      assert.strictEqual(out, "");
    });
    it("should allow custom when toggled", async function () {
      var prompt = new BasePrompt({ choices: ["a", "b"], show: false });

      prompt.once("run", async () => {
        //default toggle
        prompt.keys["autocomplete"] = getDefault().keybindings.autocomplete;
        await prompt.keypress("\t", tab);
        await send("abcd", prompt);
        await prompt.submit();
      });

      var out = await prompt.run();

      assert.strictEqual(out, "abcd");
    });
    it("should fix undefined", async function () {
      var prompt = new BasePrompt({ choices: ["a", "b"], show: false });

      var ctrlright = {
        name: "right",
        ctrl: true,
        meta: false,
        option: false,
        shift: false,
      };

      prompt.once("run", async () => {
        //overwrite key bindings
        prompt.keys = {};
        prompt.keypress(undefined, ctrlright);
        prompt.submit();
      });

      var out = await prompt.run();

      assert.notEqual(out, "undefined");
    });
    it("should not print box from ctrlc", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({ choices: ["a", "b"], show: false });

      var escape = {
        raw: "\u0003",
      };

      prompt.once("run", async () => {
        prompt.keypress(undefined, escape);
        prompt.submit();
      });

      var out = await prompt.run();

      assert.notEqual(out, "\u0003");
    });
    it("should allow empty choices", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({ choices: [], show: false });

      prompt.once("run", async () => {
        prompt.submit();
      });

      var out = await prompt.run();

      assert.strictEqual(out, "");
    });
    it("should allow multiple inserts", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({ choices: ["a", "b"], show: false });

      prompt.once("run", async () => {
        prompt.keys["autocomplete"] = getDefault().keybindings.autocomplete;
        await prompt.keypress("\t", tab);
        prompt.submit();
        await prompt.keypress("\t", tab);
        prompt.submit();
        await prompt.keypress("\t", tab);
        prompt.submit();
        prompt.submit();
      });

      var out = await prompt.run();

      assert.strictEqual(out, "aaa");
    });
  });

  /**
   * After all tests, restore functions.
   */
  after(() => {
    console.log.restore();
  });
});
