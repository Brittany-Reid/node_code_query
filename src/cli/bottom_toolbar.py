import globals

def bottom_toolbar():
    """
    A bottom toolbar for the commandline.
    For now, this is so I can debug things without using print (which messes up the UI)
    Logging would be a better solution.
    """
    message = "Press <tab> to open package suggestions"

    return message + ", Debug: " + str(globals.completing) + ", " + str(globals.taskStart)