const repl = require("repl");
const { getBaseDirectory } = require("../common");
const { ReplPrompt } = require("../ui/components/prompts/input/repl-prompt");
const PromptReadable = require("../ui/prompt/prompt-readable");
const PromptWritable = require("../ui/prompt/prompt-writable");
const path = require("path");
const state = require("../core/state");
const fs = require("fs");
const Project = require("../core/project");
const Select = require("../ui/prompt/select");
const PromptHandler = require("../ui/prompt/prompt-handler");
const { EditorPrompt } = require("../ui/components/prompts/input/editor-prompt");
const Service = require("../core/service");
const chalk = require("chalk");
const { getLogger } = require("../core/logger");
const configInst = require("../config");


const logger = getLogger();

class REPL{
    constructor(){
        //get the path to the history file
        this.historyPath = path.join(getBaseDirectory(), state.replHistory);
        //installed package array
        this.installedPackages = [];
        
        //create our inputs and outputs
        this.promptWritable = new PromptWritable();
        this.promptReadable = new PromptReadable(ReplPrompt, {
            prefix: "NCQ",
            message: "[]",
            seperator: ">",
            historyFile: this.historyPath,
            accentColor: configInst.config.accentColor
        }, this.promptWritable);

        //repl instance options
        this.options = {
            prompt: "",
            input: this.promptReadable,
            output: this.promptWritable,
            breakEvalOnSigint: true,
            terminal: false,
            useColors: true,
            preview: false,
            ignoreUndefined: true,
        };

        this.replInstance = undefined;
        this.installHelp = "Install a package.";
        this.packageHelp = "Search for packages.";
        this.samplesHelp = "Search for samples.";
    }

    async run(){

        state.repl = this;

        var dependencies = this.getDependencies();
        if(dependencies) {
            var names = Object.keys(dependencies);
            this.install(names.join(" "));
        }

        logger.info("Initialized REPL with packages " + this.installedPackages);

        this.replInstance = repl.start(this.options);
        this.internalLoad = this.replInstance.commands["load"].action;
        this.internalLoad = this.internalLoad.bind(this.replInstance);

        this.load();

        this.defineCommands();

        this.handlePrompt();
    }

    /**
     * This function is called outside the repl to enable async commands.
     * We need this if we need to do prompts.
     */
    async intercept(str){
        var cmd = str.split(" ")[0];
        var args = str.substring(cmd.length).trim();
        args = args ? args : undefined;
        if(cmd.startsWith(".")){
            if(cmd === ".editor"){
                await this.editor();
                return true;
            }
            if(cmd === ".exit"){
                await this.exit(false);
                return true;
            }
            if(cmd === ".packages"){
                await this.packages(args);
                return true;
            }
        }
        return false;
    }

    defineCommands(){
        var that = this;
        this.replInstance.defineCommand("install", {
            help: that.installHelp,
            action:function(arg){
                that.install(arg);
            }
        });
        this.replInstance.defineCommand("uninstall", {
            help: that.installHelp,
            action:function(arg){
                that.uninstall(arg);
            }
        });
        this.replInstance.defineCommand("packages", {
            help:that.packageHelp,
            action:()=>{}
        });
        this.replInstance.defineCommand("samples", {
            help:that.samplesHelp,
            action:(arg)=>{that.samples(arg);}
        });
    }

    samples(args){
        var packages;
        if(args){
            packages = args.split(" ");
        }
        else{
            packages = this.installedPackages;
        }
        if(!packages || packages.length < 1){
            state.write("No packages given for samples!\n");
            state.write("Usage:\n\t.samples [" + chalk.green("packages...") + "]");
            state.write("\t.samples (with packages installed)");
            state.write("Example:\n\t.samples csv-writer");
            return;
        }

        var samples = Service.packageSnippets(packages);
        if(!samples || samples.length < 1){
            state.write("No samples for packages: " + packages.join(", "));
            return;
        }
        this.promptReadable.promptOptions.snippets = samples;
    }

    async packages(args){
        if(!args){
            state.write("No query given for package search.\n");
            state.write("Usage:\n\t.package [" + chalk.green("keywords...") + "]\n");
            state.write("Example:\n\t.package write file");
            return;
        }
        state.write(".packages " + args);
        var result = await Service.packageSearch(args);
        if(result && result.toInstall){
            this.install(result.packageName);
        }
    }

    install(packages){
        packages = packages.trim();
        if(!packages){
            state.write("Error: No package name given.\nUsage: .install <pkg>");
            return;
        }
        var packageArray = packages.split(" ");
        try{
            Project.install(packageArray);
        } catch(e){
            return;
        }

        var installedSet = new Set(this.installedPackages);
        for(var p of packageArray)
            installedSet.add(p);
        this.installedPackages = Array.from(installedSet);
    }

    uninstall(packages){
        packages = packages.trim();
        if(!packages){
            state.write("Error: No package name given.\nUsage: .uninstall <pkg>");
            return;
        }
        var packageArray = packages.split(" ");
        try{
            Project.uninstall(packageArray);
        } catch(e){
            return;
        }

        var installedSet = new Set(this.installedPackages);
        for(var p of packageArray)
            installedSet.delete(p);
        this.installedPackages = Array.from(installedSet);
    }

    async editor(){
        state.write("// Entering editor mode");

        var code = this.replInstance.lines.join("\n");
        var pHandler = new PromptHandler(EditorPrompt, {initialInput: code});
        var result;
        try{
            result = await pHandler.run();
        } catch(e){
            return;
        }
        if(typeof result === "undefined") return;
        fs.writeFileSync(Project.filename, result);
        //var internalClear = this.replInstance.commands["clear"].action.bind(this.replInstance);
        this.replInstance.resetContext();
        this.load();
    }

    /**
     * Was the repl edited, used to ask for save.
     */
    wasEdited(){
        var oldContents = undefined;
        var newContents = this.replInstance.lines.join('\n');
        //if file exists
        if(fs.existsSync(Project.filename)){
            //get contents
            oldContents = fs.readFileSync(Project.filename, {encoding:"utf-8"});
        }
        
        if(!oldContents && !newContents) return false;
        if(oldContents === newContents) return false;

        return true;
    }

    save(){
        try{
            fs.writeFileSync(Project.filename, this.replInstance.lines.join('\n'));
            state.write("Session saved to: " + Project.filename);
        }catch(e){
            state.write("Error: Could not save repl instance!");
        }
    }

    load(){
        if(!fs.existsSync(Project.filename)) return;
        var internalLoad = this.replInstance.commands["load"].action;
        internalLoad = internalLoad.bind(this.replInstance);
        internalLoad(Project.filename);
    }

    async exit(force = true){
        if(!force && this.wasEdited()){
            var save;
            try{
                save = await new Select().run("Do you want to save your REPL before exit?", ["Save and Exit", "Exit", "Cancel"]);
            } catch(e){
                save === "Exit";
            }
            if(save === "Cancel") return;
            if(save === "Save and Exit"){
                this.save();
            }
        }
        this.replInstance.close();
        this.replInstance.input.destroy();
    }

    /**
     * This function overwrites the display prompt function.
     * Avoids writing `...` inside function declarations.
     * Instead we send this to our prompt.
     */
    handlePrompt(){
        //make promptHanlder accessible here
        const promptHandler = this.promptReadable.promptHandler;

        //function scoped to the replInstance
        function displayPrompt(){
            const len = this.lines.level.length ? this.lines.level.length : 0;
            if(len > 0){
                promptHandler.properties.seperator = "...".repeat(len);
            }
            else{
                promptHandler.properties.seperator = ">";
            }

        }

        //overwrite
        this.replInstance.displayPrompt = displayPrompt;
    }

    getDependencies(){
        var packageJson = JSON.parse(fs.readFileSync("package.json", {encoding: "utf-8"}));
        var dependencies = packageJson.dependencies;
        return dependencies;
    }

}

module.exports = REPL;