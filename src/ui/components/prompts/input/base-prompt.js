const ink = require("@gnd/ink");
const { HandledInputPrompt, useTerminalSize } = require("ink-scroll-prompts");
const React = require("react");
const { _extends } = require("../../../../utils");
const HtopFooter = require("./htop-footer");

const e = React.createElement;

/**
 * @typedef {Object} BasePromptTypes
 * @property {Object} [footerKeys] Keys for the footer.
 * @property {string | React.ReactElement<ink.Text>} [header] Header string or element
 * @typedef {import("ink-scroll-prompts").HandledInputPromptProps & BasePromptTypes} BasePromptProps
 */

/**
 * Base prompt implements all basic, shared functionality of prompts.
 * @type {React.FC<BasePromptProps>}
 */
const BasePrompt = React.forwardRef(({
    additionalKeys,
    footerKeys = {f1: "Suggest", f5: "Clear", f10: "Cancel"},
    header,
    accentColor = "cyan",
    ...props
}, ref) => {
    const {stdout} = ink.useStdout();
    const [height, setHeight] = React.useState(stdout.rows);
    const [width, setWidth] = React.useState(stdout.columns);
    const [suggesting, setSuggesting] = React.useState((props.suggestions && props.suggestions.length > 0) ? true : false);

    React.useEffect(()=>{
        if(props.suggestions && props.suggestions.length > 0) setSuggesting(true);
        else{
            setSuggesting(false);
        }
    }, [props.suggestions]);

    useTerminalSize((columns, rows) => {
        setWidth(columns);
        setHeight(rows);
    });

    const defaultBindings = {
        cancel: {
            key: {
                f10: true,
            }
        },
        setInput: {
            key: {
                f5: true
            },
            args: [""],
        },
        toggleSuggest: {
            key: {
                f1:true
            }
        }
    };

    const footerMessage = e(HtopFooter, {keys: footerKeys, suggesting: suggesting, accentColor: accentColor});

    const inputProps = {
        prefix: "NCQ",
        minHeight:2,
        maxHeight: height-2,
        width: "100%",
        additionalKeys: _extends(defaultBindings, additionalKeys),
        footerMessage: footerMessage,
        footer:true,
        accentColor: accentColor,
        ref: ref,
        header: header
    };

    return e(ink.Box, {flexDirection: "column"}, 
        e(HandledInputPrompt, _extends(inputProps, props))
    );
});

module.exports = BasePrompt;