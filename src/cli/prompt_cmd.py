from cmd import Cmd
from prompt_toolkit import prompt
from prompt_toolkit import PromptSession

class PromptCmd(Cmd):
    """
    Extends Cmd to overwrite how cmdloop works. Uses prompt-toolkit instead of readline.
    Treat this class like Cmd, as a base to extend a command line interface from.
    """
    session = PromptSession()

    
    def promptInput(self, prompt):
        """
        Gets input from the commandline using prompt-toolkit.
        """
        input = self.session.prompt(prompt)
        return input

    def cmdloop(self, intro=None):
        """
        Our overwritten cmdloop function. Most of this is just copied from the cmd library.
        """
        self.preloop()

        #begin command
        try:
            #print intro
            if intro is not None:
                self.intro = intro
            if self.intro:
                self.stdout.write(str(self.intro)+"\n")

            #begin command loop
            stop = None
            while not stop:

                #accept input
                try:
                    line = self.promptInput(self.prompt)
                except EOFError:
                    line = 'EOF'

                line = self.precmd(line)
                stop = self.onecmd(line)
                stop = self.postcmd(stop, line)
            self.postloop()
        finally:
            pass