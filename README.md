# Node Code Query (NCQ)
<p align="center">
  <img src="https://raw.githubusercontent.com/damorimRG/node_code_query/master/media/demo-full.gif" alt="demo"/>
</p>

Node Code Query (NCQ) is a tool to help Node.js developers locate, install and try out NPM packages, in a single environment.

NCQ is REPL (Read-Print-Eval Loop) environment that enables users to search for NPM packages and API code snippets. The REPL environment then allows for users to install these packages and begin programming with them. The combination of search and programming environment is what makes NCQ distinct.

## Installation

<details>

### 1. Install Node.js and NPM

NCQ is a research project and may not be compatible with all Node.js versions. The last tested Node.js version was v14.17.0.

*Hint: Use nvm to install node/npm. Install [nvm](https://github.com/nvm-sh/nvm). Then, run the command `nvm install <version>`*

### 2. Clone this repository

```sh
git clone https://github.com/damorimRG/node_code_query.git
```

### 3. Change to the corresponding directory.


```sh
cd node_code_query
```

### 4. Install

```sh
npm install
```

This step may take some time. In addition to installing dependencies, it runs a setup script and downloads a snapshot of the NPM data to create a local database (for efficiency).

You can now use `npm start` to run the program.

### 5. Globally install the `ncq` command (optional).

To use the `ncq` command, and to run ncq from any location, you can install this repository globally.

```sh
npm install -g
```
  
</details>

## Dataset

The dataset will automatically be downloaded when installing NCQ, you do not need to manually download and extract it, however, the dataset is also made available at https://zenodo.org/record/5094598

## Usage
  
You can start the NCQ CLI by using the ncq command anywhere.
  
```sh
ncq [options]
```
  
If you didn't install NCQ globally, you can use `npm start` to run the program in the repository directory.
<details><summary>Options</summary>
    
|option|description|
|-|-|
|-d, --debug|Run in debug mode, enables extra logging. |
|-u, --usage|Enable additional logging for user study purposes. |
|-r, --recordLimit \<num\>|Limit the number of packages loaded. | 
    
</details>
  
### Load a REPL
  
To load or create a new REPL, use the `repl` command. Once you have selected an option, NCQ will load that instance for you and you can begin programming!

### REPL Commands
  
<details>
  
#### `.packages <query>`
  
Search for packages using the given query string, now interactively! If you select a package, you can now install it from ths menu.
 
#### `.install [packages]`
  
Given a package or list of packages, installs these in your REPL project.
  
#### `.uninstall [packages]`
  
Uninstalls a given package.
  
#### `.samples [packages]`
  
Searches for code snippets from the given packages, and shows them to you right in your REPL prompt.
  
#### `.help`
  
Show more commands.
    
</details>
  
### References
  
Links to published work will be added here.


