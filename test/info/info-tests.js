require("mocha");
const path = require("path");
const winston = require("winston");
const DataHandler = require("../../src/core/data-handler");
const Evaluator = require("../../src/core/evaluator/evaluator");
const LinterHandler = require("../../src/core/evaluator/linter-handler");
const { getBaseDirectory } = require("../../src/common");


const BASE = getBaseDirectory();
const LOG_DIR = path.join(BASE, "logs");
const INFO_LOG_DIR = path.join(LOG_DIR, "info");

function addToErrorData(errors, id, object){
    for(var e of errors){
        var rule = e.ruleId;
        if(!rule){
            if(e.message.startsWith("Parsing error: Unexpected token")){
                rule = "Parsing error: Unexpected token";
            }
            else if(e.message.startsWith("Parsing error: Unexpected character")){
                rule = "Parsing error: Unexpected character";
            }
            else if(e.message.startsWith("Parsing error: Identifier") && e.message.endsWith("has already been declared")){
                rule = "Parsing error: Identifier has already been declared";
            }
            else if(e.message.startsWith("Parsing error: Label") && e.message.endsWith("is already declared")){
                rule = "Parsing error: Label is already declared";
            }
            else if(e.message.startsWith("Parsing error: Invalid regular expression")){
                rule = "Parsing error: Invalid regular expression";
            }
            else if(e.message.startsWith("Parsing error: The keyword") && e.message.endsWith("is reserved")){
                rule = "Parsing error: Reserved keyword"
            }
            else{
                rule = e.message;
            }
        }
        var data = object[rule];
        if(!data) data = {
            occurances: 0,
            affectedSnippets: new Set(),
            fatal: undefined,
        }
        data.fatal = e.fatal;
        data.severity = e.severity;
        data.occurances++;
        data.affectedSnippets.add(id);
        object[rule] = data;
    }
}

const logger = winston.createLogger();
logger.add(
    new winston.transports.File({
        filename: path.join(
            INFO_LOG_DIR,
            "info.log"
        ),
        level: "info",
        format: winston.format.printf(({level, message})=>{
            return `${message}`
        }),
        options:{
            flags: "w"
        }
    })
);

/**
 * Stats for the paper :)
 * Run `npm run info` or `mocha tests/info/<file> --max-old-space-size=4096`.
 */

describe("Dataset Info (takes time to load)", function () {
    var data;
    var packages;
    var snippets;
    var noFixErrorData;
    var snippetsNoError;
    var snippetsNoWarnOrError;

    before(async function(){
        logger.info("DATASET INFORMATION:")
        this.timeout(0);
        data = new DataHandler({
            recordLimit: 1000
        });
        await data.loadDatabase();
    })

    it("Should tell us how many packages", function (){
        packages = data.packages;
        logger.info("TOTAL PACKAGES: " + packages.length);
    })
    it("Should tell us how many snippets", function (){
        snippets = data.snippets;
        logger.info("TOTAL SNIPPETS: " + snippets.length);
    })
    it("Should tell us snippet per package statistics", function (){
        var average = snippets.length/packages.length;
        var min, max;
        var minName, maxName;
        for(var p of packages){
            var name = p.name;
            var psnippets = data.getSnippetsForPackage(name);
            var length = psnippets.length;
            if(!min || length < min){
                min = length;
                minName = name;
            }
            if(!max || length > max){
                max = length;
                maxName = name;
            }
        }
        logger.info("AVERAGE SNIPPETS PER PACKAGE: " + average);
        logger.info("MIN SNIPPETS: " + min + " (" + minName + ")");
        logger.info("MAX SNIPPETS: " + max + " (" + maxName + ")");
    })
    it("Should tell us some package statistics", function(){
        var packages = data.packages;
        var total = packages.length;
        var hasDescription = 0;
        var hasKeywords = 0;
        var hasRunExample = 0;
        var hasLicense = 0;
        var hasInstallExample = 0;
        var hasLastUpate = 0;
        var hasRepoUrl = 0;
        for(var p of packages){
            if(p.description && p.description.trim().length > 0){
                hasDescription++;
            }
            if(p.keywords && p.keywords.length>0) hasKeywords++;
            if(p.hasRunExample) hasRunExample++;
            if(p.hasLicense) hasLicense++;
            if(p.hasInstallExample) hasInstallExample++;
            if(p.lastUpdate) hasLastUpate++;
            if(p.hasRepoUrl) hasRepoUrl++;
        }

        function format(field, value){
            var string = "NUM PACKAGES WITH " + field.toUpperCase() + ": " + value + "/" + total + " (" + (value/total) + ")";
            return string;
        }

        logger.info(format("description", hasDescription));
        logger.info(format("keywords", hasKeywords));
        logger.info(format("run example", hasRunExample));
        logger.info(format("license", hasLicense));
        logger.info(format("install example", hasInstallExample));
        logger.info(format("last update", hasLastUpate));
        logger.info(format("repository url", hasRepoUrl));
    })
    it("Should tell us parsing error statistics", function(){
        logger.info("--------");
        logger.info("PARSING ERROR ANALYSIS\n");
        var noErrors = 0;
        var errorData = {};
        var snippets = data.snippets;
        var linter = new LinterHandler();
        linter.config.rules = {};
        for(var s of snippets){
            var code = s.code;
            var errors = linter.lint(code);
            if(errors.length < 1) noErrors++;
            addToErrorData(errors, s.id, errorData);
        }
        var keys = Object.keys(errorData);
        keys.sort((a, b)=>{
            var aValue = errorData[a].occurances;
            var bValue = errorData[b].occurances;
            return bValue - aValue;
        })
        logger.info("ERROR, SEVERITY, FATAL, NUM OCCURANCES, NUM AFFECTED SNIPPETS, PERCENT")
        for(var k of keys){
            var e = errorData[k];
            logger.info(k + ", " + e.severity + ", "+ e.fatal+ ", "+ e.occurances + ", " + e.affectedSnippets.size + ", " + (errorData[k].affectedSnippets.size/snippets.length))
        }
        logger.info("");
        logger.info("Snippets without errors: " + noErrors + "/" + snippets.length + "(" + (noErrors/snippets.length) +")")
    }).timeout(0);
    it("Should tell us also rule info", function(){
        logger.info("--------");
        logger.info("RULE ANALYSIS\n")
        var errorData = {};
        snippetsNoWarnOrError = 0;
        snippetsNoError = 0;
        var snippets = data.snippets;
        var linter = new LinterHandler();
        for(var s of snippets){
            var code = s.code;
            var errors = linter.lint(code);
            var justErrors = LinterHandler.errors(errors);
            if(justErrors.length < 1) snippetsNoError++;
            if(errors.length < 1) snippetsNoWarnOrError++;
            addToErrorData(errors, s.id, errorData);
        }
        var keys = Object.keys(errorData);
        keys.sort((a, b)=>{
            var aValue = errorData[a].occurances;
            var bValue = errorData[b].occurances;
            return bValue - aValue;
        })
        logger.info("ERROR, SEVERITY, FATAL, NUM OCCURANCES, NUM AFFECTED SNIPPETS, PERCENT")
        for(var k of keys){
            var e = errorData[k];
            logger.info(k + ", " + e.severity + ", "+ e.fatal+ ", "+ e.occurances + ", " + e.affectedSnippets.size + ", " + (errorData[k].affectedSnippets.size/snippets.length))
        }
        logger.info("");
        logger.info("Snippets without errors: " + snippetsNoError + "/" + snippets.length + "(" + (snippetsNoError/snippets.length) +")")
        logger.info("Snippets without errors or warnings: " + snippetsNoWarnOrError + "/" + snippets.length + "(" + (snippetsNoWarnOrError/snippets.length) +")")
        noFixErrorData = errorData;
    }).timeout(0);
    it("Should tell us impact of eslint fixes", function(){
        logger.info("--------");
        logger.info("ESLINT FIX ANALYSIS\n")
        var snippets = data.snippets;
        var evaluator = new Evaluator();
        evaluator.fixer.rules = {
            "redeclared-identifier": false,
            "no-import-export": false
        };
        var evaluatedSnippets = evaluator.fix(snippets);
        var errorData = {};
        var snippetsNoWarnOrErrorFix = 0;
        var snippetsNoErrorFix = 0;

        for(var s of evaluatedSnippets){
            var errors = s.errors;
            var justErrors = LinterHandler.errors(errors);
            if(justErrors.length < 1) snippetsNoErrorFix++;
            if(errors.length < 1) snippetsNoWarnOrErrorFix++;
            addToErrorData(errors, s.id, errorData);
        }
        var keys = Object.keys(errorData);
        keys.sort((a, b)=>{
            var aValue = errorData[a].occurances;
            var bValue = errorData[b].occurances;
            return bValue - aValue;
        })
        logger.info("ERROR, SEVERITY, FATAL, NUM OCCURANCES, NUM AFFECTED SNIPPETS, PERCENT")
        for(var k of keys){
            var e = errorData[k];
            logger.info(k + ", " + e.severity + ", "+ e.fatal+ ", "+ e.occurances + ", " + e.affectedSnippets.size + ", " + (errorData[k].affectedSnippets.size/snippets.length))
        }

        logger.info("");
        logger.info("Snippets without errors: " + snippetsNoErrorFix + "/" + snippets.length + "(" + (snippetsNoErrorFix/snippets.length) +")")
        logger.info("Snippets without errors or warnings: " + snippetsNoWarnOrErrorFix + "/" + snippets.length + "(" + (snippetsNoWarnOrErrorFix/snippets.length) +")")

    }).timeout(0);
    it("Should tell us impact of no import export", function(){
        logger.info("--------");
        logger.info("NO IMPORT EXPORT\n")
        var snippets = data.snippets;
        var evaluator = new Evaluator();
        evaluator.fixer.rules = {
            "redeclared-identifier": false,
            "no-import-export": true
        };
        var evaluatedSnippets = evaluator.fix(snippets);
        var errorData = {};
        var snippetsNoWarnOrErrorFix = 0;
        var snippetsNoErrorFix = 0;

        for(var s of evaluatedSnippets){
            var errors = s.errors;
            var justErrors = LinterHandler.errors(errors);
            if(justErrors.length < 1) snippetsNoErrorFix++;
            if(errors.length < 1) snippetsNoWarnOrErrorFix++;
            addToErrorData(errors, s.id, errorData);
        }
        var keys = Object.keys(errorData);
        keys.sort((a, b)=>{
            var aValue = errorData[a].occurances;
            var bValue = errorData[b].occurances;
            return bValue - aValue;
        })
        logger.info("ERROR, SEVERITY, FATAL, NUM OCCURANCES, NUM AFFECTED SNIPPETS, PERCENT")
        for(var k of keys){
            var e = errorData[k];
            logger.info(k + ", " + e.severity + ", "+ e.fatal+ ", "+ e.occurances + ", " + e.affectedSnippets.size + ", " + (errorData[k].affectedSnippets.size/snippets.length))
        }

        logger.info("");
        logger.info("Snippets without errors: " + snippetsNoErrorFix + "/" + snippets.length + "(" + (snippetsNoErrorFix/snippets.length) +")")
        logger.info("Snippets without errors or warnings: " + snippetsNoWarnOrErrorFix + "/" + snippets.length + "(" + (snippetsNoWarnOrErrorFix/snippets.length) +")")

    }).timeout(0);
    it("Should tell us impact of all fixes", function(){
        logger.info("--------");
        logger.info("ALL FIXES\n")
        var snippets = data.snippets;
        var evaluator = new Evaluator();
        var evaluatedSnippets = evaluator.fix(snippets);
        var errorData = {};
        var snippetsNoWarnOrErrorFix = 0;
        var snippetsNoErrorFix = 0;

        for(var s of evaluatedSnippets){
            var errors = s.errors;
            var justErrors = LinterHandler.errors(errors);
            if(justErrors.length < 1) snippetsNoErrorFix++;
            if(errors.length < 1) snippetsNoWarnOrErrorFix++;
            // if(errors.length > 0 && errors[0].message === "Parsing error: 'import' and 'export' may appear only with 'sourceType: module'"){
            //     console.log(s.code)
            // }
            addToErrorData(errors, s.id, errorData);
        }
        var keys = Object.keys(errorData);
        keys.sort((a, b)=>{
            var aValue = errorData[a].occurances;
            var bValue = errorData[b].occurances;
            return bValue - aValue;
        })
        logger.info("ERROR, SEVERITY, FATAL, NUM OCCURANCES, NUM AFFECTED SNIPPETS, PERCENT")
        for(var k of keys){
            var e = errorData[k];
            logger.info(k + ", " + e.severity + ", "+ e.fatal+ ", "+ e.occurances + ", " + e.affectedSnippets.size + ", " + (errorData[k].affectedSnippets.size/snippets.length))
        }

        logger.info("");
        logger.info("Snippets without errors: " + snippetsNoErrorFix + "/" + snippets.length + "(" + (snippetsNoErrorFix/snippets.length) +")")
        logger.info("Snippets without errors or warnings: " + snippetsNoWarnOrErrorFix + "/" + snippets.length + "(" + (snippetsNoWarnOrErrorFix/snippets.length) +")")

    }).timeout(0);
});