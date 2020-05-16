
# Playground REPL
> Playground REPL to discover Node code snippets from Natural Language Descriptions.

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]

The general goal is to improve the productivity of nodejs developers by providing better access to snippets/samples of packages and self-contained tasks, and an environment that enables them to quickly reproduce these artifacts.

[Here](https://1drv.ms/v/s!AoG_FqzVTCCZj0TSWAbXMwvzJ_0Z) is a demonstration of a very rough idea of ​​the project.


## Installation

#### OS X & Linux:

```sh
sudo apt-get install npm
sudo npm install -g npm@latest
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
pip3 install lxml
pip3 install jupyterlab
```

#### Windows:

1. Download and install Node.js (https://nodejs.org/en/).
2. Clone Repository.
3. Run `npm install` in the repository directory to install dependencies.

## Instructions:

```sh
npm install
npm start
```

Outside REPL:

| **comand**       | **description**                                   |
|------------------|---------------------------------------------------|
|<kbd>tab</kbd>    | Open and close autocompletes.                     |
|<kbd>return</kbd>| Enter selected autocomplete.                      |
|<kbd>up/down</kbd>| Scroll autocompletes                              |
| `repl <package>`| Start REPL with entered package/s.                  |

REPL:

| **comand**           | **description**                                    |
|----------------------|----------------------------------------------------|
|`samples("<package>")`| Get snippets for package.                          |
|`install("<package>")`| Install given package within REPL.                 |
|`uninstall("<package>")`| Uninstall given package                          |
|<kbd>`</kbd>          | Cycle snippets in REPL (after using samples())     |
|<kbd>tab</kbd>        | Open and close autocompletes.                      |
|<kbd>return</kbd>     | (Autocomplete Open) Enter selected autocomplete.   |
|<kbd>return</kbd>     | (Autocomplete Closed) Newline                      |
|<kbd>return</kbd> <kbd>return</kbd> | Submit input.                        |
|<kbd>up/down</kbd>    | Scroll autocompletes                               |

## Usage example

A few motivating and useful examples of how your product can be used. Spice this up with code blocks and potentially more screenshots.

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
