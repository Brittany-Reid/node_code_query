const React = require("react");
const ink = require("@gnd/ink");

const e = React.createElement;

/**
 * Item Component for Menu
 * @type {React.FC<any>}
 */
const FolderEntry = ({
    label,
    date,
    isSelected,
    accentColor = "cyan",
    ...props
}) => {

    const boxProps = {
        justifyContent: "space-between",
        width: "100%",
    };

    const textProps = {
        dimColor: props.dimColor,
        color: isSelected ? accentColor : props.color,
    };

    return e(ink.Box, boxProps,
        e(ink.Text, textProps,
            "(" + (isSelected? "*" : " ") + ") " + (date ? label : "[ " + label + " ]")
        ),
        e(ink.Text, textProps, date)
    );
};

module.exports = FolderEntry;