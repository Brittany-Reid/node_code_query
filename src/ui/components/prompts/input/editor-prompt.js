const ink = require("@gnd/ink");
const { ColorBox } = require("ink-scroll-prompts");
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

    const promptProps = {
        accentColor: accentColor,
        prefix: "",
        seperator: "",
        header: e(ColorBox, {justifyContent: "center", backgroundColor: accentColor}, 
            e(ink.Text, {backgroundColor: accentColor, color: "black"} , "editor")
        )
    };

    return e(ReplPrompt, _extends(promptProps, props));
};

module.exports = {
    EditorPrompt,
};