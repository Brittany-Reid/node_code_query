const shell = require('shelljs');
const names = require("all-the-package-names");
const axios = require('axios');
const fs = require('fs').promises;

// constants
const MAX=100;
const HTML_DIR="./package_home_pages"

fs.mkdir(HTML_DIR, (err) => {if (err) throw err; });

console.log(`Total of ${names.length} npm packages found, processing ${MAX}.`);
for (let count=0; count <MAX; count++) {
    shell.exec(`./view.sh ${names[count]}`, {silent:true}, function(code, stdout, stderr) {
        url=stdout.replace(/[^\x20-\x7E]/g, '');
        url=url.slice(4,url.length-4); // TODO: horrible hack. fix it.
        read_data(names[count], url); // async read page and write to file
    });
}

// function will be called asynchronously
async function read_data(name, url) {
    try {
        // blocking until page is completely downloaded
        let response = await axios.get(url);
        console.log(`${name} ${url}`);
        // blocking until file is completely written
        await fs.writeFile(`${HTML_DIR}/${name}.html`, response.data);
    } catch (error) {
        console.error(`could not print to file ${error}`);
    }
}

