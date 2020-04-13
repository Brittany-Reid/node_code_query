import click
import os
from cmd import Cmd
import glob

HERE = os.path.dirname(os.path.realpath(__file__))

class MyPrompt(Cmd):
   prompt = 'NQL> '
   intro = "Welcome to Node Query Language. Type ? or <tab><tab> to list commands"

   ## exit
   def do_exit(self, inp):
      #TODO: check why need to type twice to exit
      return True
   def help_exit(self):
       print('exit the application. Shorthand: x q Ctrl-D.')   
 
   # list packages
   def do_list_packages(self, inp):
      '''List packages...'''
      path = os.path.join(HERE, "snippets")
      files = [f for f in glob.glob(path + "**/*.desc", recursive=False)]
      name = ""
      for f in files:
         name += os.path.basename(f).split(".")[0] + "  "
      print(name)

       
   ## repl
   def do_repl(self, inp):
      print(inp)
      packages=inp.split(" ")
      print(packages)
      return True
      # status = os.system("node repl.js")
      # left repl mode. back to regular console mode

   def default(self, inp):
        if inp == 'x' or inp == 'q':
            return self.do_exit(inp)
 
        print("Default: {}".format(inp))      
      
   do_EOF = do_exit
   help_EOF = help_exit
 
if __name__ == '__main__':
    MyPrompt().cmdloop()


# @click.command()
# @click.option("--list-packages", "-lp", "list_packages", is_flag=True, help="List all loaded packages.")
# @click.option("--list-samples", "-ls", "list_samples", is_flag=True, help="List all samples")
# @click.option('--repl', "repl", is_flag=True, help='List of libraries to start the repl playground')
# def process(list_packages, list_samples, repl):
#     if (repl):
#         ## exeuction block until an .exit
#         returned_value = os.system("node repl.js")  # returns the exit code in unix
    
#     print("goodbye")
# if __name__ =="__main__":    
#     process()
