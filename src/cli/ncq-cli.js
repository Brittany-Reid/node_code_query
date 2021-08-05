const { getBaseDirectory} = require("../common");
const CliPrompt = require("../ui/components/prompts/input/cli-prompt");
const PromptHandler = require("../ui/prompt/prompt-handler");
const Project = require("../core/project");
const CLI = require("./cli");
const path = require("path");
const fs = require("fs");
const React = require("react");
const ink = require("@gnd/ink");
const config = require("../config");
const state = require("../core/state");
const Select = require("../ui/prompt/select");
const ListSelect = require("../ui/prompt/list-select");
const FolderEntry = require("../ui/components/scroll-select/folder-entry");
const { getLogger } = require("../core/logger");
const configInst = require("../config");
const e = React.createElement;

const logger = getLogger();

class NcqCLI extends CLI{
    constructor(input){
        super(input);

        this.opening =
      "Welcome to the NCQ Command Line Interface. Type help for more information.";
        this.replWarning =
      "No REPL. Create a node.js REPL with the repl command to use this command: ";
        this.unknown = "Did not understand command: ";
        this.helpPrompt = "Write help to show the list of commands.";

        var commands = this.getCommands();
        var completions = this.getCompletions(commands);
        this.historyPath = path.join(getBaseDirectory(), state.cliHistory);
        this.defaultProjectName = "tmp";

        this.render = state.render;
        this.app = undefined;

        this.input.properties = {
            prefix: "NCQ",
            placeholder: "Enter your command...",
            multiline:false,
            disableNewlines: true,
            suggestions: commands,
            completions: completions,
            historyFile: this.historyPath,
            accentColor: configInst.config.accentColor,
        }
    }

    getCommands(){
        var names = Array.from(this.getnames());
        var commands = names.filter((value) => {
            if(value.startsWith("do_")) return true;
            return false;
        })

        commands = commands.map((value) => {
            return value.replace("do_", "");
        })
        return commands;
    }

    getCompletions(commands){
        var completions = [...commands];
        for(var c of commands){
            completions.push("help " + c);
        }
        return completions.sort();
    }
    
    sum_repl = "Start a REPL instance";

    help_repl(args){
        this.print("Command to start a REPL.")
    }

    async do_repl(args){
        var project;
        
        //get existing repls
        var repls = Project.getRepls();
        //if no existing, create new
        if(repls.length < 1) project = await this.initProject();
        else{
            var options = {
                new: {label: "Create New"},
            }
            //if previous session, add as option
            if(state.lastSession) options.previous = {label: "Load Previous (" + state.lastSession.lastProject + ")"};
            for(var r of repls) options[r] = {
                label: r,
                date: fs.statSync(path.join(getBaseDirectory(), state.replDir, r)).mtime.toDateString(),
            }

            //ask to load or create?
            var option;
            try{
                option = await new ListSelect().run(Object.values(options), "Create new REPL or load existing REPL?", FolderEntry)
            }catch(e){
                return;
            }   
            if(option === options["new"].label){
                 project = await this.initProject();
            }
            else if(options["previous"] && option === options["previous"].label){
                project = state.lastSession.lastProject;
            }
            else{
                project = option;
            }
        }
        if(project) {
            logger.info("Loading project " + project);
            Project.loadProject(project);
        }
    }

    async ask(question, defaultInput){
        var promptHandler = new PromptHandler(CliPrompt, {
            prefix: question,
            placeholder: undefined,
            initialInput: defaultInput,
            seperator: "?",
            footer: false,
            accentColor: "green",
        }, {exitOnCancel: false});
        promptHandler.render = this.render;
        var prompt = promptHandler.run();
        this.app = promptHandler.app;
        var result = await prompt;
        return result;
    }

    async initProject(){
        var nextName = this.defaultProjectName + this.getProjectNumber();

        //ask for name
        var projectName;
        try{
            projectName = await this.ask("Project name", nextName);
        }
        catch(e){
            return;
        }
        if(!projectName){
            state.write("No project name!")
            return;
        }

        //if exists, do you want to overwrite?
        if(fs.existsSync(path.join(getBaseDirectory(), state.replDir, projectName))){
            var option;
            try{
                option = await new Select().run("Project already exists at " + projectName + ". Do you want to overwrite?", [
                    "Yes",
                    "No"
                ])
            }
            catch(e){
                return;
            }
            if(option === "No") return;
        }
        Project.createProject(projectName);
        return projectName;
    }

    getProjectNumber(){
        var num = 1;
        var projectPath = path.join(getBaseDirectory(), state.replDir, this.defaultProjectName);
        while(fs.existsSync(projectPath+num)){
            num++;
        }
        return num;
    }
}

module.exports = NcqCLI;