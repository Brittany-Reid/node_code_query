const repl = require('repl');
const fs = require('fs');
const path = require('path');
const string_similarity = require('string-similarity');
const natural = require('natural');
const en = require("stopwords").english;
const acorn = require("acorn");
const acornwalk = require("acorn-walk");

/* constants */
const version = "1.0.0";
const snippets_dir = "./snippets";
const threshold_sim = 0.25;
const tname = "NQL";
const NUM_KEYWORDS = 5;

/* library description */
const library_desc = {};

/* snippet description */
const snippets = {};

// keywords extracted from package description and snippet description (needs to clean up)
const tfidf = new natural.TfIdf();

/* read description of snippets from snippets dir and update variable
 * library_desc and snippets */
fs.readdir(snippets_dir, (err, files) => {
    files.forEach(file => {
        const filepath = path.join(snippets_dir, file);
        const text = fs.readFileSync(filepath, 'utf8');
        // update dictionaries with library and snippet descriptions
        if (path.extname(file) == ".desc") {
            library_desc[file] = text;
            tfidf.addDocument(removeStopWords(text));
        } else {
            lines = text.split("\n");
            // separate comments (variable desc) from actual code
            // (variable rest)
            desc = ""; rest = "";
            lines.forEach(line => {
                if (line.startsWith("#")) {
                    desc += line;
                } else {
                    rest += line + "\n";
                }                
            });
            tfidf.addDocument(removeStopWords(desc));
            tfidf.addDocument(removeStopWords(parseJS(rest)));
            snippets[desc] = rest.trim();
        }
    });
});

/* remove stopwords from text */
function removeStopWords(text) {
    textClean = "" 
    text.split(" ").forEach(s => { if (!en.includes(s.trim())) textClean = textClean+" "+s })
    return textClean;
}

function parseJS(text) {
    set = new Set();
    acornwalk.simple(acorn.parse(text), {
        Identifier(node) {
            set.add(node.name);
        }
    })
    res = ""
    set.forEach(s => {res = res + " " + s})
    return res
}

/* auto-completion function passed to repl.start as option. See:
 * https://nodejs.org/api/readline.html#readline_use_of_the_completer_function */
function completer(line) {
    /* showing a list of keywords with lowest (more popular) tfidfs */
    const terms = {}
    for (a=0; a<tfidf.documents.length; a++) {
        tfidf.listTerms(a).forEach(function(item) {
            terms[item.term] = item.tfidf;
        });
    }
    invTerms={}; Object.keys(terms).forEach(key => invTerms[terms[key]] = key)
    const sortedKeys = Object.keys(invTerms).map(parseFloat).sort(function(a,b){return a-b;})
    const common_tfidfs = sortedKeys.slice(0, NUM_KEYWORDS); //TODO: create a constant
    completions = []
    common_tfidfs.forEach(val => { completions.push(invTerms[val]) })
    
    // completions

    const hits = completions.filter((c) => c.startsWith(line));
    // Show all completions if none found
    return [hits.length ? hits : completions, line];
}

/* creating REPL */
const myRepl = repl.start({prompt: tname+"> ", ignoreUndefined: true, completer: completer});

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
