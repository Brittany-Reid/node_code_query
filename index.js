const repl = require('repl');
const fs = require('fs');
const path = require('path');

/* constants */
const version = "1.0.0"
const snippets_dir = "./snippets"

/* library description */
const library_desc = {}

/* read description of snippets from snippets dir */
fs.readdir(snippets_dir, (err, files) => {
    files.forEach(file => {
        // update dictionary with library descriptions
        if (path.extname(file) == ".desc") {
            var filepath = path.join(snippets_dir, file)
            var text = fs.readFileSync(filepath,'utf8');
            library_desc[file]=text;
        }
    });
});

/* creating REPL */
const myRepl = repl.start({prompt: "NQL> ", ignoreUndefined: true});

Object.assign(myRepl.context,{
    help() {
        console.log("howto(keywords)            searches for snippets from string of keywords");
        console.log("list_packages(keywords)    searches for packages from string of keywords");        
        console.log("howto_tasks                searches for snippets from tasks");
        console.log("tasks                      lists all catalogued tasks");
        console.log("version                    prints version of library");
    }});

Object.assign(myRepl.context,{
    howto(string) {
        let keywords = string.split(" ");
        keywords.forEach(key => { console.log(key) })
    }});

Object.assign(myRepl.context,{
    list_packages(string) {
        let keywords = string.split(" ");
        //TODO: search for keywords
        console.log(library_desc);
    }});

Object.assign(myRepl.context,{
    howto_tasks() {
        console.log(`--- ONLY listing library descriptions ---}`);
        console.log(library_desc);
    }});

Object.assign(myRepl.context,{
    tasks() {
        console.log(`--- Not yet implemented ---}`);        
    }});


Object.assign(myRepl.context,{
    version() {
        console.log(`Node Query Library (NQL) version ${version}`);        
    }});
