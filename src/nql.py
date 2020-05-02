#!/usr/bin/env python3
import os
import glob
import shutil
import asyncio
import selectors
from cli.prompt_cmd import PromptCmd
from data_handler import DataHandler
from cli.suggestion_completer import SuggestionCompleter
from prompt_toolkit import PromptSession
import cli.key_bindings
import cli.bottom_toolbar
import globals

HERE=os.path.dirname(os.path.realpath(__file__))
counter=0
dataHandler = DataHandler()

class MyPrompt(PromptCmd):
    """
    Main program prompt using custom prompt-toolkit cmd.
    """
    
    prompt = 'NQL> '
    intro = "Welcome to Node Query Language. Type ? or <tab><tab> to list commands"

    def postcmd(self, stop, line):
        #reset completer
        if self.session.completer:
            self.session.completer.reset()
            self.session.completer = None
        return super().postcmd(stop, line)

    ## exit
    def do_exit(self, inp):
        #TODO: check why need to type twice to exit
        return True

    def help_exit(self):
        print('exit the application. Shorthand: x q Ctrl-D.')   

    # list packages
    def do_list_packages(self, inp):
        packages = dataHandler.packages
        name = ""
        for f in packages:
            name += f + " "
        print(name)

    ## repl
    def do_repl(self, inp):
        print (inp)
        global counter
        packages=inp.split(" ")
        # check if these packages are there
        for pack in packages:
            if (not os.path.exists(os.path.join(HERE, "snippets/" + pack + ".desc"))):
                print("could not find package %s. cannot create repl" % pack)
                return False
        counter=counter + 1
        pathname=os.path.join(HERE, "tmp"+str(counter))
        ## create directory
        os.mkdir(pathname)
        ## copy repl.js and package.json.* within
        shutil.copy(os.path.join(HERE,"repl.js"), pathname)
        shutil.copy(os.path.join(HERE,"package.json"), pathname)
        shutil.copy(os.path.join(HERE,"package-lock.json"), pathname)
        # change directory
        os.chdir(pathname)
        # install packages within that directory
        os.system("npm install " + " ".join(packages) + " --save")
        # invoke the repl
        os.system("node repl.js " + " ".join(packages)) ## this extra argument is to modify the prompt of the repl
        # destroy directory
        os.chdir(HERE)
        shutil.rmtree(pathname, ignore_errors=True)

    def default(self, inp):
            if inp == 'x' or inp == 'q':
                return self.do_exit(inp)
    
            print("Did not understand command: {}\nPress <tab> to show the list of commands.".format(inp))      

    do_EOF = do_exit
    help_EOF = help_exit

class Nql():
    """
    This is the program object. 
    """

    completer = None
    suggestions = None
    prompt = None
    keyBindings = None

    def setupKeyBindings(self):
        """
        Sets up the keybindings.
        """
        self.keyBindings = cli.key_bindings.nql_bindings(self)

    def setupCompleter(self):
        """
        Sets up the completer.
        """
        self.completer = SuggestionCompleter()

        dataHandler.loadSuggestions()
        self.suggestions = dataHandler.getSuggestions()

        self.completer.set_suggestions(self.suggestions)

    
    def setupPrompt(self):
        """
        Sets up the command line interface.
        """

        #fixes an error with asyncio in windows (if you press enter too quickly)
        #https://github.com/prompt-toolkit/python-prompt-toolkit/issues/1023
        selector = selectors.SelectSelector()
        loop = asyncio.SelectorEventLoop(selector)
        asyncio.set_event_loop(loop)

        #create prompt
        self.prompt = MyPrompt()

        #setup completer
        self.setupCompleter()

        #setup keybindings
        self.setupKeyBindings()
        self.prompt.session.key_bindings=self.keyBindings
        self.prompt.session.refresh_interval=0.5
        self.prompt.session.bottom_toolbar = cli.bottom_toolbar.bottom_toolbar

    def run(self):
        """
        Main run function.
        """
        self.setupPrompt()
        self.prompt.cmdloop()


if __name__ == '__main__':
    Nql().run()