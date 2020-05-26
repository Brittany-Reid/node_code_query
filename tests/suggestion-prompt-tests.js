require("mocha");
var assert = require("assert");
const SuggestionPrompt = require("../ncq/ui/prompts/suggestion-prompt");
const sinon = require("sinon");

const up = { sequence: '\u001b[A', name: 'up', code: '[A' };
const down = { sequence: '\u001b[B', name: 'down', code: '[B' };
const right = { sequence: '\u001b[C', name: 'right', code: '[C' };
const left = { sequence: '\u001b[D', name: 'left', code: '[D' };

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
 * Unit tests for the Cmd Class.
 */
describe("SuggestionPrompt", function () {
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
        var prompt = new SuggestionPrompt({choices : ["a", "b"], show:false});
        
        prompt.once("run", async () => {
            prompt.keypress("c");
            prompt.submit();
        });

        var out = await prompt.run();
  
        assert.strictEqual(out, "c");
      });
      it("should allow empty", async function () {
        var prompt = new SuggestionPrompt({choices : ["a", "b"], show:false});
        
        prompt.once("run", async () => {
            prompt.submit();
        });

        var out = await prompt.run();
  
        assert.strictEqual(out, "");
      });
    });
  
    /**
     * After all tests, restore functions.
     */
    after(() => {
      console.log.restore();
    });
  });
  