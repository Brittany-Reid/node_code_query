import os
import glob

__all__ = [
    "DataHandler"
]

class DataHandler:
    """
    This is the class that handles loading files into memory and provides ways to access them.
    The completer needs the list of packages so we'll load them here. Later we might want to load in
    a list of tasks, code snippet etc.
    """

    SNIPPET_PATH = "../snippets"
    packages = []

    def loadSuggestions(self):
        """
        For now our suggestions are just package names.
        """

        path = self.SNIPPET_PATH
        files = [f for f in glob.glob(path + "**/*.desc")]

        self.packages = []
        for f in files:
            name = os.path.basename(f).split(".")[0]
            self.packages.append(name)

    def getSuggestions(self):
        return self.packages