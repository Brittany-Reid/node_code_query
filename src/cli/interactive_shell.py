import sys
import os
import subprocess
from subprocess import Popen, PIPE
import threading
import prompt_toolkit
from cli.bottom_toolbar import bottom_toolbar
from prompt_toolkit.patch_stdout import patch_stdout
import globals

class InteractiveShell:
    """
    Launch node repl shell and allow us to have control over the IO through prompt-toolkit.
    This relies entirely on being able to tell when repl.js asks for input, by looking for NQL[*]>
    """

    def _write(self, process, message):
        process.stdin.write(message)
        process.stdin.flush()

    def run(self):
        env = os.environ.copy()

        #open repl shell
        process = Popen("node repl", stdin=PIPE, stdout=PIPE, stderr=PIPE, env=env)

        globals.prompt = ""
        #callable for our thread, reads output from the pipe and writes
        def writeall(p):
            buffer = ""

            while True:
                char = p.stdout.read(1).decode("utf-8")

                #when done, exit loop
                if not char:
                    break
                
                #add to buffer
                buffer += char

                #capture prompt here, this must be the final line (i can't find any other way to handle input correctly)
                if buffer.startswith("NQL[") and buffer.endswith("]> "):
                    globals.replprompt = buffer
                    #reset buffer
                    buffer = ""

                #print line on end
                if char == '\n':
                    sys.stdout.write(buffer)
                    sys.stdout.flush()
                    buffer = ""

                

        #start reading
        writer = threading.Thread(target=writeall, args=(process,))
        writer.start()

        #start input loop
        try:
            while True:
                #d = sys.stdin.read(1)

                #ask for input only when we have a prompt
                if globals.replprompt == "":
                    continue
                d = prompt_toolkit.prompt(globals.replprompt, bottom_toolbar=bottom_toolbar, enable_system_prompt=True)+"\n"
                globals.replprompt = ""
                if not d:
                    break
                self._write(process, d.encode())

        except EOFError:
            pass