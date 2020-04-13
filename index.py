import click
import os
from cmd import Cmd

class MyPrompt(Cmd):
   prompt = 'NQL> '
   intro = "Welcome to Node Query Language. Type ? or <tab><tab> to list commands"

   def do_exit(self, inp):
      '''Exit the applicationg'''
      print("Bye")
      return True
   
   def help_exit(self):
       print('exit the application. Shorthand: x q Ctrl-D.')   
 
   def do_add(self, inp):
      '''Add something...'''
      print("Adding '{}'".format(inp))

   def default(self, inp):
        if inp == 'x' or inp == 'q':
            return self.do_exit(inp)
 
        print("Default: {}".format(inp))      
      
#   do_EOF = do_exit
#   help_EOF = help_exit
 
MyPrompt().cmdloop()
print("after")

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
