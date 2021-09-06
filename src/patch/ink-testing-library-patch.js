/**
 * @file Patch Ink Testing Library to use fork.
 * Add move cursor.
 * Can now trigger a resize event.
 * Add rows.
 */

const {EventEmitter} = require("events");
const {render: inkRender} = require('@gnd/ink');

var columns = 100;
var rows = 10;

class Stdout extends EventEmitter {

	constructor(){
		super();
		columns = 100;
		rows = 10;
	}


	get columns() {
		return columns;
	}

	get rows(){
		return rows;
	}

	set columns(value){
		columns = value;
		this.emit("resize");
	}

	set rows(value){
		rows = value;
		this.emit("resize");
	}

	frames = [];
	_lastFrame;

	write = (frame) => {
		this.frames.push(frame);
		this._lastFrame = frame;
	};

	lastFrame = () => {
		return this._lastFrame;
	};

	moveCursor = () =>{}
}

class Stderr extends EventEmitter {
	frames = [];
	_lastFrame;

	write = (frame) => {
		this.frames.push(frame);
		this._lastFrame = frame;
	};

	lastFrame = () => {
		return this._lastFrame;
	};
}

class Stdin extends EventEmitter {
	isTTY = true;

	write = (data) => {
		this.emit('data', data);
	};

	setEncoding() {
		// Do nothing
	}

	setRawMode() {
		// Do nothing
	}

	resume() {
		// Do nothing
	}

	pause() {
		// Do nothing
	}
}

const instances = [];

exports.render = (tree) => {
	const stdout = new Stdout();
	const stderr = new Stderr();
	const stdin = new Stdin();

	const instance = inkRender(tree, {
		stdout: stdout,
		stderr: stderr,
		stdin: stdin,
		debug: true,
		exitOnCtrlC: false,
		patchConsole: false
	});

	instances.push(instance);

	return {
		rerender: instance.rerender,
		unmount: instance.unmount,
		cleanup: instance.cleanup,
		stdout,
		stderr,
		stdin,
		frames: stdout.frames,
		lastFrame: stdout.lastFrame,
		waitUntilExit: async () =>{},
		clear: ()=>{}
	};
};

exports.cleanup = () => {
	for (const instance of instances) {
		instance.unmount();
		instance.cleanup();
	}
};