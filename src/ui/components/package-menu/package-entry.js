const {ColorBox} = require("ink-scroll-prompts");
const React = require("react");
const ink = require("@gnd/ink");
const { _extends } = require("../../../utils");

const e = React.createElement;

/**
  * Component for each package entry in menu.
  */
const PackageEntry = ({
    label = "",
    description = "",
    keywords = [],
    stars = 0,
    isSelected = false,
    accentColor = "cyan",
    id = 1,
    ...props
}) => {

    var internalAccentColor = isSelected ? accentColor : "grey";
 
    const boxProps = {
        width:"100%",
        flexDirection: "column",
    }

    const colorBoxProps = {
        backgroundColor: internalAccentColor,
        width: "100%",
        height:1,
        overflow:"hidden",
        flexShrink:0
    }

    const marker = "(" + ( isSelected? "*" : " ") + ")";
 
    return e(ink.Box, _extends(boxProps, props), 
        e(ColorBox, colorBoxProps, 
            e(ink.Text, {backgroundColor:internalAccentColor, bold:true}, marker + " " + id + ". " + label),
            e(ink.Text, {backgroundColor:internalAccentColor, color:"black"}, " stars: " + stars)
        ),
        e(ink.Box, { width:"100%", flexDirection: "column"}, 
            e(ink.Text, {wrap:"truncate"}, description),
            e(ink.Text, {wrap:"truncate", color: internalAccentColor}, "Keywords: " + keywords.join(", "))
        )
    )
}

module.exports = PackageEntry;