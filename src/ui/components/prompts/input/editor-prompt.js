const ink = require("@gnd/ink");
const { ColorBox, InputPrompt } = require("ink-scroll-prompts");
const React = require("react");
const { _extends } = require("../../../../utils");
const {ReplPrompt} = require("./repl-prompt");
const e = React.createElement;

/**
 * 
 */
const EditorPrompt = ({
    accentColor = "cyan",
    ...props
}) => {

    const header = e(ColorBox, {justifyContent: "center", backgroundColor: accentColor}, 
        e(ink.Text, {backgroundColor: accentColor, color: "black"} , "editor")
    );

    const additionalKeys = _extends({}, InputPrompt.defaultKeyBindings);

    additionalKeys.submit = [
        {
            key: {
                ctrl: true
            },
            input: "s",
        },
        {
            key:{
                f9: true
            }
        }
    ];
    additionalKeys.append = {
        key: {
            return: true
        },
        args: ["\n"]
    }
    

    const promptProps = {
        accentColor: accentColor,
        minHeight:3,
        prefix: "",
        seperator: "",
        header: header,
        newlineOnDown: false,
        useDefaultKeys: false,
        additionalKeys: additionalKeys,
        footerKeys: {
            f5: "Clear",
            f9: "Save",
            f10: "Exit",
        },
    };

    return e(ReplPrompt, _extends(promptProps, props));
};

module.exports = {
    EditorPrompt,
};