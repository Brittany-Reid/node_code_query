# Commands

## **CLI Commands**

When you start up the REPL, you are in the CLI. The CLI handles loading and creating new REPLs.

### `repl`

Load or create a new REPL. If this is the first use, you will be prompted to make a new REPL, if you have existing REPLs you will be presented with the load menu. When you have selected a REPL, the REPL will startk, initializing your project and loading in the (offline) code snippet database, which may take some time.

### `help`

Print help information

### `exit`

Exit the REPL, the same as pressing <kbd>ESC</kbd> or <kbd>F10</kbd>

## **REPL Commands**

When you have loaded a REPL, you are now in REPL mode. You can write code and press enter to execute this. Commands in the REPL start with `.` to differentiate them from variables within the REPL.

### `.packages`

Usage: `.packages [...keywords]`

Search for packages, using the given keywords. You will be taken to an interactive list of packages, with package statistics and information. If you select a package, you will be asked if you'd like to install it.

### `.samples`

Usage: `.samples [...packages]`

Search for code snippets from package documentation. You can use the `.samples` command without arguments to find samples for the installed packages. The code snippets will display in your REPL prompt, where you can edit them or press enter to run.

### `.editor`

Access the editor mode, where you can modify the current state of the REPL (previously executed code). If you save and exit, the code will rerun. 

If you enter the editor mode after viewing a code snippet with an empty REPL state, the code snippet will be available for you.

### `.reset`

Reset the state of the REPL, you can use this if you run into any issues.

### `.install`

Install a package.

### `.uninstall`

Uninstall a package.

## **KeyBindings**

| KeyBinding | Command | Details |
| - | - | - |
| <kbd>return</kbd> | Submit |  |
| <kbd>escape</kbd> or <kbd>f10</kbd>| Cancel |  |
| <kbd>delete</kbd> | Delete Character | |
| <kbd>meta</kbd> + <kbd>delete</kbd> | Delete word | <kbd>ctrl</kbd> + <kbd>w</kbd> also works. |
| <kbd>ctrl</kbd> + <kbd>delete</kbd> | Delete line | <kbd>ctrl</kbd> + <kbd>u</kbd> also works. |
| <kbd>ctrl</kbd> + <kbd>←</kbd> | Move to line start | |
| <kbd>ctrl</kbd> + <kbd>➞</kbd> | Move to line end | |
| <kbd>meta</kbd> + <kbd>←</kbd> | Previous Word | <kbd>meta</kbd> + <kbd>b</kbd> also works. |
| <kbd>meta</kbd> + <kbd>➞</kbd> | Next word | <kbd>meta</kbd> + <kbd>f</kbd> also works. |
| <kbd>↑</kbd> | Cursor Line Up | |
| <kbd>↓</kbd> | Cursor Line Down | |
| <kbd>f4</kbd> | Newline | |
| <kbd>f5</kbd> | Clear | Clears currently entered input. |
| <kbd>f6</kbd> | Editor | Enter editor mode. |
| <kbd>f9</kbd> | Save | |
