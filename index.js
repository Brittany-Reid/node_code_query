const repl = require('repl');
const fs = require('fs');
const path = require('path');
var string_similarity = require('string-similarity');

/* constants */
const version = "1.0.0";
const snippets_dir = "./snippets";
const threshold_sim = 0.25;

/* library description */
const library_desc = {};

/* snippet description */
const snippets = {};

/* read description of snippets from snippets dir */
fs.readdir(snippets_dir, (err, files) => {
    files.forEach(file => {
        var filepath = path.join(snippets_dir, file);
        var text = fs.readFileSync(filepath, 'utf8');
        // update dictionaries with library and snippet descriptions
        if (path.extname(file) == ".desc") {
            library_desc[file] = text;
        } else {
            lines = text.split("\n");
            desc = ""; rest = "";
            lines.forEach(line => {
                if (line.startsWith("#")) {
                    desc += line;
                } else {
                    rest += line + "\n";
                }                
            });
            snippets[desc] = rest.trim();
        }
    });
});

/* creating REPL */
const myRepl = repl.start({prompt: "NQL> ", ignoreUndefined: true});

Object.assign(myRepl.context,{
    help() {
        console.log("list_s(keywords)           searches for snippets from string of keywords");
        console.log("list_p(keywords)           searches for packages from string of keywords");        
        console.log("version                    prints version of library");
    }});

/* list_snippets */
Object.assign(myRepl.context,{
    list_s(keys_string) {
        const keys = Object.keys(snippets);
        keys.forEach(key => {
            /* this is a nesty hack. should take code into account*/
            doc = key;
            body = snippets[key];
            var sim = string_similarity.compareTwoStrings(keys_string, doc /* description of snippet */);
            if (sim >= threshold_sim) {
                console.log(doc);
                console.log(body);
            }
        });
    }
});

/* list_packages */
Object.assign(myRepl.context,{
    list_p(string) {
        for ([key, val] of Object.entries(library_desc)) {
            console.log(`${key}      ${val}`);
        }
    }});

/* version */
Object.assign(myRepl.context,{
    version() {
        console.log(`Node Query Library (NQL) version ${version}`);        
    }});
