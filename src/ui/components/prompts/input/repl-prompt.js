const ink = require("@gnd/ink");
const { useInput } = require("ink-scroll-prompts");
const React = require("react");
const { getLogger } = require("../../../../core/logger");
const Snippet = require("../../../../core/snippet");
const { _extends } = require("../../../../utils");
const BasePrompt = require("./base-prompt");

const logger = getLogger();

const onWrite = (promptWritable, callback) => 
{
    function callbackHandler(str) {
        callback(str);
    }


    function handleWrite(isEnabled = false){
        if(isEnabled){
            promptWritable.addListener("write", callbackHandler);
        }
        else{
            promptWritable.removeListener("write", callbackHandler);
        }   
    }

    if(promptWritable){
        React.useLayoutEffect(() => {
            handleWrite(true);
            return () => {
                handleWrite(false);
            };
        }, [handleWrite]);

    }
};


const e = React.createElement;

/**
 * @typedef {Object} ReplPromptTypes
 * @property {Array<Snippet>} [snippets] Array of snippets to display
 * 
 * @typedef {import("./base-prompt").BasePromptProps & ReplPromptTypes} ReplPromptProps
 */

/**
 * Prompt for use in the REPL.
 * @type {React.FC<ReplPromptProps>}
 */
const ReplPrompt = ({
    accentColor = "cyan",
    onCancel,
    snippets,
    promptWritable,
    ...props
}) => {

    const ref = React.useRef();
    const [cleared, setCleared] = React.useState(false);
    const [displayingSnippet, setDisplayingSnippet] = React.useState(false);
    const [snippetIndex, setSnippetIndex] = React.useState(0);

    //when there are snippets, we are displaying them
    React.useEffect(()=>{
        if(cleared) return;
        if(snippets && snippets.length > 0) setDisplayingSnippet(true);
    }, [snippets]);

    //when cleared, we no longer display snippets
    React.useEffect(()=>{
        if(cleared) setDisplayingSnippet(false);
    }, [cleared]);

    //when snippet index changes, update input
    React.useEffect(()=>{
        if(!displayingSnippet) return;
        var snippet = snippets[snippetIndex];
        var code = snippet.code;
        logger.info("Got snippet: {" + JSON.stringify(code) + "} from package " + snippet.package);
        ref.current.setInput(code);
    }, [snippetIndex, displayingSnippet]);

    //function to get next snippet
    const nextSnippet = React.useCallback((n)=>{
        logger.info("Cycled index by " + n);
        if(!displayingSnippet) return;
        var newIndex = snippetIndex + n;
        if(newIndex >= snippets.length) newIndex = 0;
        if(newIndex < 0) {
            newIndex = snippets.length-1;
        }
        setSnippetIndex(newIndex);
    }, [displayingSnippet, snippets, snippetIndex]);

    const internalOnCancel = React.useCallback(() =>{
        setDisplayingSnippet(false);
        if(typeof onCancel === "function") onCancel();
    }, [onCancel]);

    /*
     * On output from the writable.
     * Handles console.log while prompt is on screen, for example async printing.
     */
    onWrite(promptWritable, (str) => {
        if(str.endsWith("\n")){
            console.log(str.substring(0, str.length-1));
            return;
        }
            
        var lines = str.split("\n");
        if(lines.length > 1){
            for(var i = 0; i<lines.length-1; i++){
                var line = lines[i];
                if(line)
                    console.log(line);
            }
            console.log(lines[lines.length-1]);
        }
    });

    const footerKeys = React.useMemo(()=>{
        return {
            f1: "Suggest",
            f2: displayingSnippet? "Prev" : undefined,
            f3: displayingSnippet? "Next" : undefined,
            f5: "clear",
            f12: "Cancel",
        };
    }, [displayingSnippet]);

    const header = React.useMemo(()=>{
        if(!displayingSnippet) return;
        return e(ink.Text, {color: accentColor}, 
            e(ink.Text, {}, "package: " + snippets[snippetIndex].package + ", "),
            e(ink.Text, {}, snippetIndex+1 + "/" + snippets.length)
        );
    }, [displayingSnippet, snippetIndex, snippets]);
    

    useInput((input, key)=>{
        //right arrow
        if(input === "[1;2C" || key.f3){
            nextSnippet(1);
            return;
        }
        //left arrow
        if(input === "[1;2D" || key.f2){
            nextSnippet(-1);
            return;
        }
        if(key.f5){
            setCleared(true);
            return;
        }
    });

    const promptProps = {
        multiline: true,
        ref: ref,
        accentColor: accentColor,
        footerKeys: footerKeys,
        header: header,
        onCancel: internalOnCancel,
    };

    return e(BasePrompt, _extends(promptProps, props));
};

module.exports = {
    ReplPrompt,
};