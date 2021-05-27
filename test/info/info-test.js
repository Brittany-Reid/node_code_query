require("mocha");
const path = require("path");
const winston = require("winston");
const DataHandler = require("../../ncq/core/data-handler");
const LinterHandler = require("../../ncq/core/linter-handler");
const { getBaseDirectory } = require("../../ncq/utils");


const BASE = getBaseDirectory();
const LOG_DIR = path.join(BASE, "logs");
const INFO_LOG_DIR = path.join(LOG_DIR, "info");


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

    before(async function(){
        logger.info("DATASET INFORMATION:")
        this.timeout(0);
        data = new DataHandler();
        await data.loadDatabase();
    })

    it("Should tell us how many packages", function (){
        packages = data.getPackages();
        logger.info("TOTAL PACKAGES: " + packages.length);
    })
    it("Should tell us how many snippets", function (){
        snippets = data.getSnippets();
        logger.info("TOTAL SNIPPETS: " + snippets.length);
    })
    it("Should tell us snippet per package statistics", function (){
        var average = snippets.length/packages.length;
        var min, max;
        var minName, maxName;
        for(var p of packages){
            var name = p.name;
            var psnippets = data.packageToSnippets(name);
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
        var packages = data.getPackages();
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
    it("Should tell us some snippet error information (20mins)", function(){
        logger.info("--------");
        logger.info("ERROR ANALYSIS\n")
        var errorData = {};
        function addToErrorData(errors, id){
            for(var e of errors){
                var rule = e.ruleId;
                if(!rule){
                    if(e.message.startsWith("Parsing error: Unexpected token")){
                        rule = "Parsing error: Unexpected token";
                    }
                    else if(e.message.startsWith("Parsing error: Unexpected character")){
                        rule = "Parsing error: Unexpected character";
                    }
                    else{
                        rule = e.message;
                    }
                }
                var data = errorData[rule];
                if(!data) data = {
                    occurances: 0,
                    affectedSnippets: new Set(),
                    fatal: false,
                }
                if(e.fatal) data.fatal = true;
                data.severity = e.severity;
                data.occurances++;
                data.affectedSnippets.add(id);
                errorData[rule] = data;
            }
        }
        var snippets = data.getSnippets();
        var linter = new LinterHandler();
        for(var s of snippets){
            var code = s.code;
            var errors = linter.lint(code);
            addToErrorData(errors, s.id);
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
    }).timeout(0);
});