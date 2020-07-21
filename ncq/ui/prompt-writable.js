const stream = require("stream");

/**
 * Custom write stream that clears the prompt when writing repl output.
 * We need this as the repl will ask for prompt before finish printing errors.
 */
class PromptWritable extends stream.Writable {
  constructor(promptReadable, options) {
    super(options);
    this.isTTY = process.stdout.isTTY;
    this.cleared = false;

    this.promptReadable = promptReadable;
  }

  write(str) {
    var prompt = this.promptReadable.p;
    var buffer;
    if (prompt) prompt = prompt.prompt;
    if (prompt) {
      if (!prompt.state.submitted) {
        buffer = prompt.state.buffer;
        prompt.clear();
        prompt.restore();
      }
    }

    process.stdout.write(str);

    if (prompt && !prompt.state.submitted) {
      prompt.renderNoClear();
    }
  }

  _write(str, encoding, done) {
    process.stdout.write(str);
    done();
  }
}

module.exports = PromptWritable;
