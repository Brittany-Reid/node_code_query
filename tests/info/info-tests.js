require("mocha");
const DataHandler = require("../../ncq/core/data-handler");
const LinterHandler = require("../../ncq/core/linter-handler");


/**
 * Stats for the paper :)
 * Run `npm run info` or `mocha tests/info/<file> --max-old-space-size=4096`.
 */

describe("Dataset Info (takes time to load)", function () {
    var data;

    before(async function(){
        this.timeout(0);
        data = new DataHandler();
        await data.loadDatabase();
    })

    it("Should tell us how many packages", function (){
        var packages = data.getPackages();
        console.log("Total packages: " + packages.length);
    })
    it("Should tell us how many snippets", function (){
        var snippets = data.getSnippets();
        console.log("Total snippets: " + snippets.length);
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
            var string = "Has " + field + ": " + value + "/" + total + " (" + (value/total) + ")";
            return string;
        }

        console.log(format("description", hasDescription));
        console.log(format("keywords", hasKeywords));
        console.log(format("run example", hasRunExample));
        console.log(format("license", hasLicense));
        console.log(format("install example", hasInstallExample));
        console.log(format("last update", hasLastUpate));
        console.log(format("repository url", hasRepoUrl));
    })
    it("Should tell us some snippet error information (20mins)", function(){
        var errorData = {};
        function addToErrorData(errors){
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
                errorData[rule] = (errorData[rule] | 0) + 1;
            }
        }
        var snippets = data.getSnippets();
        var linter = new LinterHandler();
        for(var s of snippets){
            var code = s.code;
            var errors = linter.lint(code);
            addToErrorData(errors);
        }
        var keys = Object.keys(errorData);
        keys.sort((a, b)=>{
            var aValue = errorData[a];
            var bValue = errorData[b];
            return bValue - aValue;
        })
        console.log("Error data: ")
        for(var k of keys){
            console.log("\"" + k + "\" : " + errorData[k] )
        }
    }).timeout(0);
});