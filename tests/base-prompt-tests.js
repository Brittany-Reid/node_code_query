require("mocha");
var assert = require("assert");
const BasePrompt = require("../ncq/ui/prompts/base-prompt");
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
async function send(string, prompt, send = true) {
  //send each character as a keypress
  for (let i = 0; i < string.length; i++) {
    await prompt.keypress(string[i]);
  }
  //finish
  if (send) await prompt.submit();
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
    it("should fix undefined on ctrl right", async function () {
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
    it("should go to line start", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({
        choices: ["a", "b"],
        show: false
      });

      prompt.once("run", async () => {
        prompt.keys["lineStart"] = getDefault().keybindings.lineStart;
        await send("this is line one", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.lineStart);
        await send("hi, ", prompt, true);
      });

      var out = await prompt.run();

      assert.strictEqual(out, "hi, this is line one");
    });
    it("should go to line start on non first line", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({
        choices: ["a", "b"],
        show: false,
        multiline: true
      });

      prompt.once("run", async () => {
        prompt.keys["cursorDown"] = getDefault().keybindings.cursorDown;
        prompt.keys["lineStart"] = getDefault().keybindings.lineStart;
        await send("this is line one", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorDown);
        await send("this is line two", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.lineStart);
        await send("hi, ", prompt, true);
      });

      var out = await prompt.run();

      assert.strictEqual(out, "this is line one\nhi, this is line two");
    });
    it("should handle line start when at start", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({
        choices: ["a", "b"],
        show: false
      });

      prompt.once("run", async () => {
        prompt.keys["lineStart"] = getDefault().keybindings.lineStart;
        await send("this is line one", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.lineStart);
        await prompt.keypress(null, getDefault().keybindings.lineStart);
        await send("hi, ", prompt, true);
      });

      var out = await prompt.run();

      assert.strictEqual(out, "hi, this is line one");
    });
    it("should go to line end", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({
        choices: ["a", "b"],
        show: false
      });

      prompt.once("run", async () => {
        prompt.keys["lineStart"] = getDefault().keybindings.lineStart;
        prompt.keys["lineEnd"] = getDefault().keybindings.lineEnd;
        await send("this is line one", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.lineStart);
        await send("hi, ", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.lineEnd);
        await send(". Bye!", prompt, true);
      });

      var out = await prompt.run();

      assert.strictEqual(out, "hi, this is line one. Bye!");
    });
    it("should go to line end that isnt end of input", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({
        choices: ["a", "b"],
        show: false,
        multiline: true
      });

      prompt.once("run", async () => {
        prompt.keys["cursorUp"] = getDefault().keybindings.cursorUp;
        prompt.keys["cursorDown"] = getDefault().keybindings.cursorDown;
        prompt.keys["lineStart"] = getDefault().keybindings.lineStart;
        prompt.keys["lineEnd"] = getDefault().keybindings.lineEnd;
        await send("this is line one", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorDown);
        await send("this is line two", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorUp);
        await prompt.keypress(null, getDefault().keybindings.lineStart);
        await send("hi, ", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.lineEnd);
        await send(";", prompt, true);
      });

      var out = await prompt.run();

      assert.strictEqual(out, "hi, this is line one;\nthis is line two");
    });
    it("should do newline", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({
        choices: ["a", "b"],
        show: false,
        multiline: true,
      });

      prompt.once("run", async () => {
        prompt.keys["cursorDown"] = getDefault().keybindings.cursorDown;
        await send("this is line one", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorDown);
        await send("this is line two", prompt);
      });

      var out = await prompt.run();

      assert.strictEqual(out, "this is line one\nthis is line two");
    });
    it("should respect multiline false", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({ choices: ["a", "b"], show: false });

      prompt.once("run", async () => {
        prompt.keys["cursorDown"] = getDefault().keybindings.cursorDown;
        await send("this is line one", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorDown);
        await send("this is line two", prompt);
      });

      var out = await prompt.run();

      assert.strictEqual(out, "this is line onethis is line two");
    });
    it("should do line up", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({
        choices: ["a", "b"],
        show: false,
        multiline: true,
      });

      prompt.once("run", async () => {
        prompt.keys["cursorDown"] = getDefault().keybindings.cursorDown;
        prompt.keys["cursorUp"] = getDefault().keybindings.cursorUp;
        await send("this is line one", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorDown);
        await send("this is line two", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorUp);
        await send(";", prompt, true);
      });

      var out = await prompt.run();

      assert.strictEqual(out, "this is line one;\nthis is line two");
    });
    it("should do line up then line down", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({
        choices: ["a", "b"],
        show: false,
        multiline: true,
      });

      prompt.once("run", async () => {
        prompt.keys["cursorDown"] = getDefault().keybindings.cursorDown;
        prompt.keys["cursorUp"] = getDefault().keybindings.cursorUp;
        await send("this is line one", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorDown);
        await send("this is line two", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorUp);
        await send(";", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorDown);
        await send(";", prompt, true);
      });

      var out = await prompt.run();

      assert.strictEqual(out, "this is line one;\nthis is line two;");
    });
  });
  describe("rendering tests", function () {
    it("visible lines should be subset if too long", async function () {
      //sometimes ctrl c prints a box
      var prompt = new BasePrompt({
        choices: ["a", "b"],
        show: false,
        multiline: true,
      });

      var allLines;
      var renderedLines;
      prompt.once("run", async () => {
        prompt.keys["cursorDown"] = getDefault().keybindings.cursorDown;
        prompt.keys["cursorUp"] = getDefault().keybindings.cursorUp;
        var height = prompt.height;
        await send("first line", prompt, false);
        await prompt.keypress(null, getDefault().keybindings.cursorDown);
        for(var i=0; i<height; i++){
          await send("1", prompt, false);
          await prompt.keypress(null, getDefault().keybindings.cursorDown);
        }

        //go back to top
        for(var i=0; i<height+1; i++){
          await prompt.keypress(null, getDefault().keybindings.cursorUp);
        }

        allLines = prompt.lineBuffer;
        renderedLines = prompt.renderedLines;
        await prompt.submit();
      });

      var out = await prompt.run();

      //some lines are not rendered
      assert(allLines.length > renderedLines.length);

      //when we move back to top, the rendered lines move with us
      assert.strictEqual(allLines[0], renderedLines[0]);
    });
  });

  /**
   * After all tests, restore functions.
   */
  after(() => {
    console.log.restore();
  });
});
