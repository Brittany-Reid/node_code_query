require("mocha");
var assert = require("assert");
const { initializeState, startREPL, initializeREPL } = require("../ncq/repl");
const PromptReadable = require("../ncq/ui/prompt-readable");
const sinon = require("sinon");
const stream = require("stream");
const stripAnsi = require("strip-ansi");
const fs = require("fs");
const rimraf = require("rimraf");

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
 * REPL Tests. Be careful as we're interfacing with the actual application, weird stuff can happen here.
 */
describe("repl", function () {
  var promptHandler;
  var options;
  var out;
  var output = "";
  var input = [];

  /**
   * Code to run once before testing begin.
   */
  before(function () {
    this.timeout(0);

    if (fs.existsSync("tmpTest")) {
      rimraf.sync("tmpTest");
    }
    fs.mkdirSync("tmpTest");
    process.chdir("tmpTest");

    fs.writeFileSync(
      "package.json",
      '{"license": "ISC", "description": "temporary repl", "repository": "null"}'
    );
    fs.writeFileSync("package-lock.json", '{"lockfileVersion": 1}');

    initializeState(true, []);
  });

  beforeEach(function () {
    options = initializeREPL();
    promptHandler = options.input.p;

    class writ extends stream.Writable {
      constructor(options) {
        super(options);
        this.isTTY = process.stdout.isTTY;
      }

      write = function (chunk) {
        output += chunk;
      };
    }

    out = new writ();

    options.output = out;
  });

  describe("repl functions", function () {
    it("initialize", function () {
      return new Promise((resolve, reject) => {
        promptHandler.input = async function () {
          await send(".exit", promptHandler.prompt);
        };

        var repl = startREPL(options);

        repl.on("exit", function () {
          //i dont know why there is ansi here, moving the cursor from node repl i think?
          assert.strictEqual(stripAnsi(output).trim(), ".exit");
          resolve();
        });
      });
    });
    it("should be able to get snippets for installed packages", function () {
      return new Promise((resolve, reject) => {
        var command = 0;
        var samples;
        promptHandler.input = async function () {
          if (command === 0) {
            await send(".install enquirer", promptHandler.prompt);
          } else if (command === 1) {
            output = "";
            await send(".samples", promptHandler.prompt);
          } else if (command === 2) {
            samples = promptHandler.options.snippets;
            await promptHandler.prompt.keypress(undefined, { name: "f5" });
            await send(".exit", promptHandler.prompt);
          }
          command++;
        };

        var repl = startREPL(options);

        repl.on("exit", function () {
          assert(samples.length > 0);
          resolve();
        });
      });
    }).timeout(0);
  });

  afterEach(function () {
    output = "";
  });

  after(function () {
    process.chdir("../");
    if (fs.existsSync("tmpTest")) {
      rimraf.sync("tmpTest");
    }
  });
});

//nothing for now

// describe('repl', function() {

//     /**
//      * Code to run before every test.
//      */
//     before(()=> {
//         //stub console log to push to an array
//         sinon.stub(console, 'log').callsFake(function(string){
//             output.push(string);
//         });
//     });

//     describe('repl functions', function(){
//         it('version', function(){
//             repl.state.version();
//             assert.equal(output[0], "Node Query Library (NQL) version 1.0.0");
//         });
//         it('help', function(){
//             repl.state.help();
//             //should print some help output
//             assert(output != []);
//         });
//         //update this later
//         // it('install and uninstall', function(){
//         //     //install a package we wont ever use
//         //     repl.state.install("one-liner-joke", "pipe");
//         //     //try to use
//         //     const joke = require("one-liner-joke");
//         //     var j = joke.getRandomJoke();
//         //     //uninstall
//         //     repl.state.uninstall("one-liner-joke", "pipe");
//         //     assert(j);
//         // }).timeout(100000000); //this may take a while
//     });

//     after(() => {
//         console.log.restore();
//         //console.log(output);
//     });

// });
