from prompt_toolkit import prompt
from prompt_toolkit.completion import Completer, Completion
from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit import PromptSession
from prompt_toolkit.filters import Condition
import globals

class SuggestionCompleter(Completer):
    """
    The SuggestionCompleter class provides suggestions based on previous input.

    :param suggestions: A `list` of suggestions that can be provided to the user.
    """

    #the list of suggestions
    suggestions = []
    #when we started suggesting, we can have commands before we dont want to include

    def __init__(self, suggestions=[]):
        super()
        self.suggestions = suggestions

    def reset(self):
        globals.completing = False
        globals.taskStart = 0

    def set_suggestions(self, suggestions):

        """
        Sets the `list` of suggestions that can be shown to the user.
        """
        self.suggestions = suggestions

    def find(self, text):
        """
        Given a string, find completions that match.
        """

        completions = []

        query = text.lower().strip()

        for suggestion in self.suggestions:

            if query in suggestion.lower() or len(query) < 1:
                startpos = len(text)*-1
                completion = Completion(suggestion, start_position=startpos)
                completions.append(completion)

        return completions

    def get_completions(self, document, complete_event):
        """
        Returns a `list` of completions.
        """

        #get line
        line = document.current_line_before_cursor
        #get from when we started looking for a task
        line = line[globals.taskStart:]

        completions = self.find(line)

        return completions

# # testing

# def run():
#     bindings = KeyBindings()
#     completer = SuggestionCompleter()
#     suggestions = ["this is a completion", "here is a suggestion"]
#     suggestions.sort()
#     completer.set_suggestions(suggestions)
#     session = PromptSession(u"> ", key_bindings=bindings)

#     @Condition
#     def is_active():
#         global completing
#         return completing
    
#     #when we press tab start completion
#     @bindings.add('tab')
#     def _(event):
#         global startpos
#         global completing

#         buffer = event.current_buffer

        
#         #if not started, start on tab
#         if completing == False:

#             #get position of starting
#             startpos = event.app.current_buffer.document.cursor_position
            
#             #start completer
#             session.completer=completer
#             session.default_buffer.start_completion()
#             completing = True
#         #if we are still suggesting but ran out, restart on tab
#         elif completing == True and buffer.complete_state == None:
#             #get position of starting
#             startpos = event.app.current_buffer.document.cursor_position
#             session.default_buffer.start_completion()
#         #if still suggesting with completes, stop on tab
#         elif completing == True:
#             session.default_buffer.cancel_completion()
#             completing = False

#     #if we backspace beyond task start, update new task start
#     @bindings.add('c-h', filter=is_active)
#     def _(event):
#         global startpos

#         #do backspace
#         event.current_buffer.delete_before_cursor(1)

#         #update
#         cursor = event.app.current_buffer.document.cursor_position
#         if cursor < startpos:
#             startpos = cursor
    

#     text = session.prompt()
#     print('You said: %s' % text)

# run()

