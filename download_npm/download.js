const names = require("all-the-package-names");
const fs = require("fs");
const axios = require('axios').default;

const MAX=1106544;
//customize this until you get no errors - nodejs will try to download everything at once, this also can improve speed
//im not really sure how nodejs handles a large number of downloads and writes, but manually limiting it seems to work
const BATCH_SIZE = 200;
const HTML_DIR="readmes/"
const DB = "https://registry.npmjs.org/"
const readmes = ['README.md', 'readme.md', 'Readme.md', 'readme.markdown', 'README.markdown'];




async function downloadURL(url){
    var body;
    //60 second timeout, had to add this at 1mill or it would hang even with restart, this gives NO RESPONSE error
    await axios.get(url, {transformResponse: [], timeout: 60000}).then(function (response) {
        // handle success
        body = response;
      })
      .catch(function (error) {
        // handle error
        body = error.response;
      })
      .finally(function () {
        // always executed
      });;
    return body;
}

async function tryRepo(name, repo){
    if(!repo){
        //sometimes there is no repo
        console.log("ERROR! Package: " + name + " has no repository!");
        return;
    }
    var url = repo["url"];
    if(!url || url == ""){
        console.log(name + ", has no repo url!");
        return;
    }
    var dir = repo["directory"];

    if(url.includes("github.com")){
        url = url.replace(".git", "");
        url = url.replace("git+", "");
        url = url.replace("git:", "https:")
        if(url.includes("/tree/master/")){
            url = url.replace("/tree/master/", "/master/");
            url+="/";
        }
        else{
            url += "/master/";
        }
        url = url.replace('github.com', 'raw.githubusercontent.com');
    }

    if(dir && dir != ""){
        url += dir = "/";
    }

    var readme;

    for (let i = 0; i < readmes.length; i++) {
        var rm  = url + readmes[i];
        var body = await downloadURL(rm);
        if(!body){
            console.log("NO RESPONSE: " + rm +", for package " + name);
            return;
        }
        if(body.status !== 200){
            if(i == readmes.length-1){
                console.log(rm + ": ERROR! Package: " + name);
                //sometimes there is no readme
            }
        }
        else{
            readme = body.data;
            break;
        }
    }

    return readme;
    
}

async function tryVersions(versions){
    var readme;

    if(versions){
        var keys = Object.keys(versions);
        for (let i = keys.length-1; i >= 0; i--) {
            var v = versions[keys[i]];
            readme = v["readme"];
            if(readme && readme != "" && readme != "ERROR: No README data found!"){
                return readme;
            }
            
        }
    }

    return;
}

async function getReadme(name){
    var url = DB + name;
    var body = await downloadURL(url);
    if(!body){
        console.log("NO RESPONSE: " + url +", for package " + name);
        return;
    }
    if(body.status !== 200){
        console.log("STATUS: " + body.status  + " on " + url +", for package " + name);
        return;
    }
    var json;
    try {
        json = JSON.parse(body.data);
    } catch (error) {
        console.error(name);
        console.error(body.data);
        //return;
    }
    var readme = json["readme"];
    if(!readme || readme == "" || readme == "ERROR: No README data found!"){
        readme = await tryVersions(json["versions"]);
        if(!readme){
            //look in repository
            readme = await tryRepo(name, json["repository"]);
        }
    }
    return readme;
}

async function doName(name){
    var readme = await getReadme(name);
    if(readme && readme != ""){
        //windows safe
        name =name.replace(/\*/g, "%2A");
        name = name.replace(/\//g, "%2F");
        name = name.replace(/\./g, "%2E");//no dots, otherwise we get cons.js and windows thinks this is a console file!!! evil!

        fs.writeFileSync(HTML_DIR + name + ".md", readme);
    }
    else{
        //console.log(name);
    }
    //console.log(name);
}


async function batch(start, end){
    var promiseArray = [];
    for (let i = start; i < end; i++) {
        promiseArray.push(new Promise((resolve, reject) => {
            doName(names[i]).then(function name(params) {
                resolve();
            });
        }))
    }
    
    return await Promise.all(promiseArray);
}

async function main(){
    try {
        fs.mkdirSync(HTML_DIR);
    } catch (error) {
        //do nothing
    }
    console.log(`Total of ${names.length} npm packages found, processing ${MAX}.`);
    for (let count=1102200; count <MAX; count+=BATCH_SIZE) {
        console.log("BATCH: " + count);
        await batch(count, Math.min(count+BATCH_SIZE, MAX));
    }
}

main();
