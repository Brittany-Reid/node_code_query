from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit.filters import Condition
import globals

def nql_bindings(nql):
    """
    Custom keybindings. Takes an instance of nql with a completer and session.
    """
    bindings = KeyBindings()
    session = nql.prompt.session
    completer = nql.completer

    @Condition
    def is_active():
        """
        Keybinding filter for if we are suggesting.
        """
        return globals.completing
    
    @bindings.add('tab')
    def _(event):
        """
        What happens when tab is pressed.
        """
        buffer = event.current_buffer
        
        #if we're not completing, start completing
        if not globals.completing:
            #get position of starting
            globals.taskStart = buffer.document.cursor_position

            #start
            session.completer = completer
            session.default_buffer.start_completion()
            globals.completing = True
        #if we didn't manually close the completer, i.e. backspacing, startup without resetting
        elif globals.completing == True and buffer.complete_state == None:
            session.default_buffer.start_completion()
        #if press tab when completing, close completions
        elif globals.completing == True:
            session.default_buffer.cancel_completion()
            globals.completing = False

    @bindings.add('c-h', filter=is_active)
    def _(event):
        """
        If we backspace beyond task start, update new task start
        """

        #do backspace
        event.current_buffer.delete_before_cursor(1)

        #update
        cursor = event.app.current_buffer.document.cursor_position
        if cursor <  globals.taskStart:
            globals.taskStart = cursor

    return bindings