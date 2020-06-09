
# Node Code Query (NCQ)
> NCQ is a REPL to discover Node code snippets from Natural Language Descriptions. The general goal is to improve the productivity of nodejs developers by providing better access to snippets/samples of packages and self-contained tasks, and an environment that enables them to quickly reproduce these artifacts.

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]

NCQ can be used to start node.js REPLs and find code snippets for given strings. This gif quickly demonstrates the creation of a REPL, the search for functionality, and the execution of code snippets.

<p align="center">
<img src="https://media.giphy.com/media/YpYDeyS8ZZWz3E2l1J/giphy.gif">
</p>

[Here](https://1drv.ms/v/s!AoG_FqzVTCCZj0TSWAbXMwvzJ_0Z) is a demonstration of a very rough idea of ​​the project.

## Setup

1. Download and install Node.js and NPM (https://nodejs.org/en/)
2. Clone this repository.
3. Download the dataset and unzip into the data directory (https://doi.org/10.5281/zenodo.3836540) Our system requires an offline dataset of NPM readme files. This dataset is too large to upload to Github (600MB compressed, 2.6GB uncompressed). Please download the file from this link https://zenodo.org/record/3836540/files/readmes.zip?download=1, unzip it and put the containing JSON file into the data directory.
4. Run `npm install` in the repository directory to install dependencies.

## Example

Let us consider the user want to know how to read a file in node.js. Here is how NCQ can help:

1. Start NPM using the `npm start` command within the repository directory. 

```sh
$> npm start
```
Your prompt will look like this:

```sh
NCQ  >  _
```

2. Type repl to create a virtual isolated environment where you can play with different examples.

```sh
repl
```

Your prompt will look like this:

```sh
NCQ [] > _
```

The square brackets indicate that you created a node repl and you do *not* have any libraries installed.

3. Type help() to see which functions you can use.

```sh
NCQ [] >  help() 
help()
========================================
samples(str)             lists samples catalogued for that package
packages(str)            lists packages for a given task
install(str)             install given package
uninstall(str)           uninstall given package
```

4. Type samples("file") and see what happens.

```sh
NCQ [] >  samples("file")
samples("file")
NCQ [] >  // ...
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));
```
Several snippets are printed on screen. The first one shows that the module/library fs is used for that. So, we need to install that module and then create a variable to access that module. Let's do it.

5. Install module "fs"

```sh
NCQ [] >  install("fs") 
install("fs")
+ fs@0.0.1-security
added 1 package and audited 1 package in 0.675s
found 0 vulnerabilities

NCQ [fs] > 
```

Note that "fs" now appears inside brackets!

6. Access module fs from a variable with the same name.

```sh
NCQ [fs] > fs = require("fs")
...
NCQ [fs] > _
```
A list with all fs functions are printed on screen (omitted for space).

7. Run the snippet. We replaced the file with a common unix file.

```sh
NCQ [fs] >  file = fs.readFileSync(new URL('file:///etc/passwd')) 
file = fs.readFileSync(new URL('file:///etc/passwd'))
<Buffer 72 6f 6f 74 3a 78 3a 30 3a 30 3a 72 6f 6f 74 3a 2f 72 6f 6f 74 3a 2f 62 69 6e 2f 62 61 73 68 0a 64 61 65 6d 6f 6e 3a 78 3a 31 3a 31 3a 64 61 65 6d 6f ... 3250 more bytes>
```
Variable file stores a buffer with byte contents. Try printing that on screen now.


### Commands

```js
repl("<packages>")
```
Start a node.js REPL with the given packages.

**Once the REPL is started you can use these commands:**

```js
packages("<task>")
```
Enter a task to find package recommendations (limited to the tasks in task.txt for now!)

```js
install("<package>")
```
Runs `npm install` for a given package.

```js
uninstall("<package>")
```
Runs `npm uninstall` for a given package.

```js
samples("<package>")
```
Enter a package to find code snippets. Code snippets will be inserted into your prompt, and cyclable using the cycle button (default <kbd>alt</kbd> + <kbd>1</kbd>)

The following functinalities are mapped to these keys by default:


| **Command**     |    **Keys**  |
|-|-|
| open and close autocompletes | <kbd>tab</kbd> |
| insert autocomplete | <kbd>enter</kbd> |
| scroll autocompletes | <kbd>up</kbd> / <kbd>down</kbd> |
| Cycle snippets | <kbd>alt</kbd> + <kbd>1</kbd> |
| View command history | <kbd>ctrl</kbd> + <kbd>up</kbd> / <kbd>ctrl</kbd> + <kbd>down</kbd> |
| Move cursor up and down in REPL | <kbd>up</kbd> / <kbd>down</kbd> |
| New line in REPL | <kbd>down</kbd> on last line |

Because of different terminal configurations, many of these keybindings can be modified in the config.json file generated on first run.


<!--
## Testing

To run tests, install DevDependencies:

```
npm install --only=dev
```

Then use:

```
npm test
```

You can see test coverage using:

```
npm run coverage
```

We use mocha, nyc and sinon for testing.

-->

<!--
_For more examples and usage, please refer to the [Wiki][wiki]._
-->

<!-- ## Development setup


## Release History

* 0.2.1
    * CHANGE: Update docs (module code remains unchanged)
* 0.2.0
    * CHANGE: Remove `setDefaultXYZ()`
    * ADD: Add `init()`


## Meta

Your Name – [@YourTwitter](https://twitter.com/dbader_org) – YourEmail@example.com

Distributed under the XYZ license. See ``LICENSE`` for more information.

[https://github.com/yourname/github-link](https://github.com/dbader/)


## Contributing

1. Fork it (<https://github.com/yourname/yourproject/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request -->

<!-- Markdown link & img dfn's -->
[npm-image]: https://img.shields.io/npm/v/datadog-metrics.svg?style=flat-square
[npm-url]: https://npmjs.org/package/datadog-metrics
[npm-downloads]: https://img.shields.io/npm/dm/datadog-metrics.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/dbader/node-datadog-metrics/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/dbader/node-datadog-metrics
[wiki]: https://github.com/yourname/yourproject/wiki
