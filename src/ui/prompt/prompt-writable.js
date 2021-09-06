const stream = require("stream");
const state = require("../../core/state");

/**
 * Handle writing while prompting.
 */
class PromptWritable extends stream.Writable {
    constructor(options) {
        super(options);
        this.isTTY = process.stdout.isTTY;
    }

    write(str) {
        if(this._events.write){
            this.emit("write", str);
        }
        else{
            if(state.stdout) state.stdout.write(str);
        }
        return true;
        // var prompt = this.promptReadable.p;
        // var buffer;
        // if (prompt) prompt = prompt.prompt;
        // if (prompt) {
        //     if (!prompt.state.submitted) {
        //         buffer = prompt.state.buffer;
        //         prompt.clear();
        //         prompt.restore();
        //     }
        // }

        // process.stdout.write(str);

        // if (prompt && !prompt.state.submitted) {
        //     prompt.renderNoClear();
        // }
    }

    _write(str, encoding, done) {
        process.stdout.write(str);
        done();
    }
}

module.exports = PromptWritable;
