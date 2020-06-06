//Perform Web-Scraping for single-page applications using Node.js

//Web scraping is a technique used to extract data from websites using a script.

const axios = require('axios');

//Build a request using axes
//Capture data from https://news.ycombinator.com/
//Make an HTTP request to get content from the site
const url = 'https://news.ycombinator.com';

axios.get(url)
    .then(response => {
        //console.log(response.data);
        console.log(getData(response.data));
    })
    .catch(error => {
        console.log(error);
    })

const cheerio = require('cheerio');
//Analyze HTML with Cheerio.js
let getData = html => {
  data = [];
  const $ = cheerio.load(html);
  $('table.itemlist tr td:nth-child(3)').each((i, elem) => {
    data.push({
      title : $(elem).text(),
      link : $(elem).find('a.storylink').attr('href')
    });
  });
  //console.log(data);
  //getData(response.data) 
  return data;
}
