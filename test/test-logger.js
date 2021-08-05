require("mocha");
var assert = require("assert");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const { getBaseDirectory } = require("../src/common");
const { Logger, getLogger } = require("../src/core/logger");
const state = require("../src/core/state");
const delay = require("delay");

const directory = path.join(getBaseDirectory(), "testLogs");

describe("Logger", function () {
    describe("global logger", function(){
        it("should get global logger", function () {
            var logger = getLogger();
            assert(logger instanceof Logger);
        });
    });
    describe("unit tests", function () {
        var logger;

        beforeEach(()=>{
            logger = new Logger({directory:directory});
        });

        it("should create a new logger", function () {
            var logger = new Logger();
            assert(logger instanceof Logger);
        });
        it("should create file on debug", async function(){
            //set state to debug
            state.debug = true;
            logger.debug("hi");
            logger.debug("hi");
            await delay(100);
            var file = path.join(directory, logger.debugFile);
            var contents = fs.readFileSync(file, {encoding:"utf-8"});
            var lines = contents.split("\n");
            assert.strictEqual(JSON.parse(lines[0]).message, "hi");
        });
        it("should create file on info", async function(){
            //set state to usage
            state.usage = true;
            
            logger.info("hi");
            logger.info("hi2");
            await delay(100);
            var file = path.join(directory, logger.infoFile);
            var contents = fs.readFileSync(file, {encoding:"utf-8"});
            if(!contents) assert.fail();
            var lines = contents.split("\n");
            assert.strictEqual(lines[0].split(" ")[1], "hi");
        });
        it("should not log if state false", async function(){         
            logger.info("hi");
            logger.debug("hi");
            await delay(100);
            assert.strictEqual(fs.existsSync(logger.directory), false);
        });

    });

    afterEach(()=>{
        //clean up
        if(fs.existsSync(directory)) rimraf.sync(directory);
        state.debug = false;
        state.usage = false;
    });
});