const ink = require("@gnd/ink");
const React = require("react");

const e = React.createElement;

/**
 * @typedef {Object} HtopFooterProps
 * @property {Object} [keys] Function keys.
 * @property {boolean} [suggesting]
 * @property {string} [accentColor]
 */

/**
 * Generate a custom footer message in htop style.
 * @type {React.FC<HtopFooterProps>}
 */
const HtopFooter = ({
    keys = {},
    suggesting = false,
    accentColor = "cyan",
    ...props
}) =>{
    const fkeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return e(ink.Box, {justifyContent: "flex-start", width:"100%"},
        e(ink.Text, {wrap: "truncate"},
            fkeys.map((value, index)=>{
                var command = "    ";
                var string = keys["f" + value];
                if(typeof string === "string"){
                    if(string !== "Suggest" || suggesting == true){
                        command = keys["f" + value];
                    }
                }
                return e(ink.Text, {key: index},
                    e(ink.Text, {bold:true}, "F" + value),
                    e(ink.Text, {backgroundColor: accentColor, color: "black"}, command + " ")
                );
            })
        )
    );
};

module.exports = HtopFooter;