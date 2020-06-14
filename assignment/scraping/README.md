## Web Scraping
> This tutorial is based on the [tutorial](https://blog.bitsrc.io/https-blog-bitsrc-io-how-to-perform-web-scraping-using-node-js-5a96203cb7cb) by Ankit Jain.

**Context**

Web scraping is the task of extracting data from websites using a script.
It is typically used when websites do not expose APIs for fetching the data. 
One example is scraping news headlines from a news website. 
Scraping consists of two tasks: reading the data from the web and processing the data to extract information.

**Assignment**

Create a node.js script to **(1)** read data from the (static) web page "https://news.ycombinator.com", and **(2)** report the list of stories from the page. 
The output should be a list of records of the form _"{title: <string>, link: <string>}"_, where _"title"_ and _"link"_ correspond to the items listed on the page.

**Solution**

1 - Read the html file from the web.

The following snippet shows how we performed this task.
We used the axios library, but there are several other options (e.g., curl, fetch).
Note that we used JS promises to handle the effects of the call. 
For an introduction to promises, check the link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises.

The purpose of function `processData` is to process the data.
At this point, it does nothing. The execution of this code should print the html on output.

```js
const axios = require('axios');
//Making an (HTTP) request with the axios.js module to obtain content from the website.
const url = 'https://news.ycombinator.com';

axios.get(url)
    .then(response => {
        console.log(processData(response.data));
    })
    .catch(error => {
        console.log(error);
    })

// just return the raw data now
var processData = html => { return html }
```

Add this snippet to file index.js.
Then, install dependencies with `$> node install`. Finally, run the code with `$> node index.js`.

2 - Parse the HTML DOM to extract the data.

As per the call to function load, note that we chose to use the library cheerio to navigate through the nodes of the _DOM_ tree of the page. 
The code iterates through specific nodes of the tree, containing the data that we want, and then creates title-link records for each one of them.

```js
const cheerio = require('cheerio');
// update definition of processData
var processData = html => {
  data = [];
  const $ = cheerio.load(html);
  $('table.itemlist tr td:nth-child(3)').each((i, elem) => {
    data.push({
      title : $(elem).text(),
      link : $(elem).find('a.storylink').attr('href')
    });
  });
  return data;
}
```

Update the definition of function `getData` on the index.js.
Then, run the code with `$> node index.js`.
The output should look like this:

![2](https://user-images.githubusercontent.com/4914063/83377140-0f522c00-a3ab-11ea-9092-b6b22ddcdff1.jpg)

