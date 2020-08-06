
[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]

# Node Code Query (NCQ)

Node.js is a JS runtime focused on development of server-side and console applications. A big asset of Node.js is the set of libraries offered by 
its package manager, [NPM](https://www.npmjs.com/). Today, NPM lists over 1M packages on its database. It is likely that a developer will find a library that implements the functions she needs. The problem with that, however, is that deciding which package to use and quickly understanding these packages can be daunting.

NCQ is tool to help Node.js developers 1) find and 2) try Node packages. 

NCQ enables users to write queries for packages and their samples in English. It provides a virtual environment that enables users to try different samples in isolation. The combination of 1) search (for packages and their samples) and 2) virtualization is what makes NCQ distinct.

[![15m NCQ Demo](https://img.youtube.com/vi/C1PZ2g96eVo/0.jpg)](https://www.youtube.com/watch?v=C1PZ2g96eVo&t=43s/0.jpg)


NCQ can be used to start node.js REPLs and find code snippets for given strings. This gif quickly demonstrates the creation of a REPL, the search for functionality, and the execution of code snippets.

<!--[Here](https://1drv.ms/v/s!AoG_FqzVTCCZj0TSWAbXMwvzJ_0Z) is a demonstration of a very rough idea of ​​the project.-->

## Setup

1. Download and install Node.js version 12.18.3 and NPM (https://nodejs.org/en/).
2. Clone this repository.
3. Run `npm install` in the repository directory. The setup script will automatically download our dataset from https://zenodo.org/record/3923490/files/ncqData.zip and extract it into the data folder. Then, it will setup the Database files for you. Note: these files is too large to upload to Github. 

## Example

Let us consider the example where the developer--a user of our tool--wants to know how to read a file in node.js. Here is how NCQ can help:

1. Install/update project dependencies. Execute the following command from within the project directory:

```sh
$> npm install
```

2. Start NPM using the `npm start` command within the repository directory. 

```sh
$> npm start
```
Your prompt will look like this:

```sh
NCQ  >  _
```

3. Type repl to create a virtual isolated environment where you can play with different examples.

```sh
NCQ  >  repl
```

As of now, this commands takes a little while to execute (1-2m). A progress bar will give you a rough estimate of waiting time. 

After that the screen will look like this:

![KEYS](/media/keys.png)

The square brackets in the command prompt indicate that you successfully created a node repl, i.e., you can run any node.js code from the prompt now. However, you do *not* have any library installed!

Please note that there is a (context-sensitive) menu of (parameterless) function keys in the bottom of the screen. You can use any of these functions with the tool. We describe some of these functions as we move along this tutorial.

4. Type `.help` in the command line or F12 (as per the menu of function keys) to see which commands you can use. 

```sh
NCQ [] >  .help
.help
.break           Sometimes you get stuck, this gets you out
.clear           Break, and also clear the local context
.editor          Enter editor mode
.exit            Exit the repl
.help            Print this help message
.install         Install given package. (Usage: .install <package>)
.load            Load JS from a file into the REPL session
.packages        Search for packages using a task, optional index to navigate results. (Usage: .packages <task> , <index>)
.samples         Search for samples using package names, or with no arguments, your installed packages. (Usage: .samples <package/s>)
.samplesByTask   Search for samples using a task. (Usage: .samplesByTask <task>)
.save            Save all evaluated commands in this REPL session to a file
.version         Print REPL version
```

5. Type `.samples file` and see what happens.

```sh
NCQ [] >  .samples file
.samples file
NCQ [] >  // ...
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));
```
Several snippets are printed on screen. The first one shows that the module/library fs is used for that. So, we need to install that module and then create a variable to access that module. Let's do it.

6. Install module "fs"

```sh
NCQ [] >  .install fs 
.install fs
+ fs@0.0.1-security
added 1 package and audited 1 package in 0.675s
found 0 vulnerabilities

NCQ [fs] > 
```

Note that "fs" now appears inside brackets!

7. Access module fs from a variable with the same name.

```sh
NCQ [fs] > fs = require("fs")
...
NCQ [fs] > _
```
A list with all fs functions is printed on screen (omitted for space).

8. Run the snippet. We used a common unix file for illustration.

```sh
NCQ [fs] >  file = fs.readFileSync(new URL('file:///etc/passwd')) 
file = fs.readFileSync(new URL('file:///etc/passwd'))
<Buffer 72 6f 6f 74 3a 78 3a 30 3a 30 3a 72 6f 6f 74 3a 2f 72 6f 6f 74 3a 2f 62 69 6e 2f 62 61 73 68 0a 64 61 65 6d 6f 6e 3a 78 3a 31 3a 31 3a 64 61 65 6d 6f ... 3250 more bytes>
```
Variable file stores a buffer with byte contents. Try printing that on screen now.


## Commands

### **CLI Commands:**

### `repl <package>`

Start a node.js REPL with the given packages installed.

### **REPL Commands:**

**Once the REPL is started you can use these commands:**

### `.packages <task>, <index?>`

Enter a task to search for packages. Prints a table of the 25 most starred packages and their descriptions. Optional index argument can be used to see more results. Starts at 0 by default. 

Example:
```
NCQ [] >  .packages read csv file, 0

  ┌─────────┬───────────────────┬───────────────────────────────────────────────┐
  │  index  │        name       │                   desciption                  │
  ├─────────┼───────────────────┼───────────────────────────────────────────────┤
  │    0    │ csv-to-collection │ reads a csv file and returns a collection of  │
  │         │                   │ objects, using the first record's values...   │ 
  └─────────┴───────────────────┴───────────────────────────────────────────────┘ 

```

### `.samples <package>`
Search for samples by package name. If no package/s specified, the command will search for code snippets from installed packages. Code snippets will be inserted into your prompt, and cyclable using the cycle button.

```sh
NCQ [] >  .samples csv-to-collection
.samples csv-to-collection
package: csv-to-collection, rank: 0, 1/2
NCQ [] > // this csv:
//
// name,age
// sally,5
// billy,10

// becomes...
[
  {name: "sally", age: "5"},
  {name: "billy", age: "10"}
]

```

### `.samplesByTask <task>`
Enter a task to find code snippets. Code snippets will be inserted into your prompt, and cyclable using the cycle button (default <kbd>alt</kbd> + <kbd>1</kbd>) or according to your platform. For that see the session Keybindings.

### `.install <package>`

Runs `npm install` for a given package.

### `.uninstall <package>`
Runs `npm uninstall` for a given package.

### Keybindings

The following functinalities are mapped to these keys by default:


| **Command**     |    **Keys**  |
|-|-|
| open and close autocompletes | <kbd>tab</kbd> |
| insert autocomplete | <kbd>enter</kbd> |
| scroll autocompletes | <kbd>up</kbd> / <kbd>down</kbd> |
| Cycle snippets (Windows) | <kbd>alt</kbd> + <kbd>1</kbd> |
| Cycle snippets (MacOs) | <kbd>shift</kbd> + <kbd>right</kbd> |
| View command history | <kbd>ctrl</kbd> + <kbd>up</kbd> / <kbd>ctrl</kbd> + <kbd>down</kbd> |
| Move cursor up and down in REPL | <kbd>up</kbd> / <kbd>down</kbd> |
| New line in REPL | <kbd>down</kbd> on last line |
| Paste multi-line | <kbd>ctrl</kbd> + <kbd>v</kbd> |
| Copy current input | <kbd>ctrl</kbd> + <kbd>s</kbd> |

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
