const React = require("react");
const ink = require("@gnd/ink");
const { SelectMenu } = require("./select-menu");
const { _extends } = require("../../../../utils");

const e = React.createElement;

/**
 * @typedef {Object} SelectPromptTypes
 * @property {string} [message] Message to display
 * 
 * @typedef {import("./select-menu").SelectMenuProps & SelectPromptTypes} SelectPromptProps
 */

/**
 * Prompt version of select menu, adds a text message.
 * @type {React.FC<SelectPromptProps>}
 */
const SelectPrompt = ({
    message,
    ...props
}) => {

    const [canceled, setCanceled] = React.useState(false);

    const onCancel = React.useCallback((selected)=>{
        setCanceled(true);
        if(typeof props.onCancel === "function") props.onCancel(selected);
    }, []);

    const textProps = {
        color: props.color,
        dimColor: canceled ? true : props.dimColor,
    };

    var selectMenuProps = _extends({}, props);
    selectMenuProps.onCancel = onCancel;

    return e(ink.Box, {flexDirection: "column"}, 
        e(ink.Text, textProps, message),
        e(SelectMenu, selectMenuProps)
    );
};

module.exports = SelectPrompt;