require("mocha");
var assert = require("assert");
const NcqCmd = require("../ncq/ncq-cmd");
const PromptHandler = require("../ncq/ui/prompt-handler");
const sinon = require("sinon");
const { Input } = require("enquirer");

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
 * Unit tests for the NcqCmd Class.
 */
describe("NcqCmd", function () {
  var output = [];
  var packages  = ["fs"];

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

  describe("functions", function () {
    it("should print something on startup", async function () {
      var ncqCmd = new NcqCmd(new PromptHandler(Input, { show: false }), packages);

      var counter = 0;

      ncqCmd.input.input = async function () {
        if (counter == 0) {
          await send("exit()" ,ncqCmd.input.prompt);
        }
        counter++;
      };

      await ncqCmd.run();

      assert.strictEqual(output[0], ncqCmd.opening);
    });
    it("should list packages", async function () {
      var ncqCmd = new NcqCmd(new PromptHandler(Input, { show: false }), packages);

      var counter = 0;

      ncqCmd.input.input = async function () {
        if (counter == 0) {
          await send("list_packages()", ncqCmd.input.prompt);
        }
        if (counter == 1) {
          await send("exit()", ncqCmd.input.prompt);
        }
        counter++;
      };

      await ncqCmd.run();

      assert.strictEqual(output[1], packages[0]);
    });
    it("should print help for list_packages", async function () {
      var ncqCmd = new NcqCmd(new PromptHandler(Input, { show: false }), packages);

      var counter = 0;

      ncqCmd.input.input = async function () {
        if (counter == 0) {
          await send("help(list_packages)", ncqCmd.input.prompt);
        }
        if (counter == 1) {
          await send("exit()", ncqCmd.input.prompt);
        }
        counter++;
      };

      await ncqCmd.run();

      assert.strictEqual(output[1], "Lists available packages.");
    });
    it("should explain repl only commands", async function () {
      var ncqCmd = new NcqCmd(new PromptHandler(Input, { show: false }), packages);

      var counter = 0;

      ncqCmd.input.input = async function () {
        if (counter == 0) {
          await send("samples()", ncqCmd.input.prompt);
        }
        if (counter == 1) {
          await send("exit()", ncqCmd.input.prompt);
        }
        counter++;
      };

      await ncqCmd.run();

      assert.strictEqual(output[1], ncqCmd.replWarning + "samples()");
    });
    it("should print for unknown commands", async function () {
      var ncqCmd = new NcqCmd(new PromptHandler(Input, { show: false }), packages);

      var counter = 0;

      ncqCmd.input.input = async function () {
        if (counter == 0) {
          await send("unknown()", ncqCmd.input.prompt);
        }
        if (counter == 1) {
          await send("exit()", ncqCmd.input.prompt);
        }
        counter++;
      };

      await ncqCmd.run();

      assert.strictEqual(output[1], ncqCmd.unknown + "unknown()");
    });
    it("should print help for repl", async function () {
      var ncqCmd = new NcqCmd(new PromptHandler(Input, { show: false }), packages);

      var counter = 0;

      ncqCmd.input.input = async function () {
        if (counter == 0) {
          await send("help(repl)", ncqCmd.input.prompt);
        }
        if (counter == 1) {
          await send("exit()", ncqCmd.input.prompt);
        }
        counter++;
      };

      await ncqCmd.run();

      assert.strictEqual(output[1], "Runs a node.js repl.");
    });
    it("should not open a repl with unknown package", async function () {
      var ncqCmd = new NcqCmd(new PromptHandler(Input, { show: false }), packages);

      var counter = 0;

      ncqCmd.input.input = async function () {
        if (counter == 0) {
          await send("repl(notapackage___)", ncqCmd.input.prompt);
        }
        if (counter == 1) {
          await send("exit()", ncqCmd.input.prompt);
        }
        counter++;
      };

      await ncqCmd.run();

      assert.strictEqual(output[2], "could not find package notapackage___ cannot create repl");
    });
  });


  /**
   * After all tests, restore functions.
   */
  after(() => {
    console.log.restore();
  });
});
