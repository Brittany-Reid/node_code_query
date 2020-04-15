#import click
import os
from cmd import Cmd
import glob
import shutil

HERE=os.path.dirname(os.path.realpath(__file__))
counter=0

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
 
if __name__ == '__main__':
    MyPrompt().cmdloop()
