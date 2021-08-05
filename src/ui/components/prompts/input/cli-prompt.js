const React = require("react");
const { _extends } = require("../../../../utils");
const BasePrompt = require("./base-prompt");

const e = React.createElement;

/**
 * Prompt used in the Cli
 * Just passes some default options to Base Prompt.
 */
const CliPrompt = ({
    accentColor = "cyan",
    ...props
}) => {

    const promptProps = {
        placeholder: "Enter your command...",
        multiline:false,
        disableNewlines: true,
        accentColor: accentColor,
    };

    return e(BasePrompt, _extends(promptProps, props));
};

module.exports = CliPrompt;