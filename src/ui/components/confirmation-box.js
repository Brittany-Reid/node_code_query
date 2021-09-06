const React = require("react");
const ink = require("@gnd/ink");
const { _extends } = require("../../utils");

const e = React.createElement;
 
const Button = ({
    message,
    isSelected = false,
    accentColor = "cyan",
    ...props
}) => {

    const color = isSelected ? accentColor : undefined;

    const buttonProps = {
        borderStyle:"single",
        paddingLeft: 1,
        paddingRight:1,
        marginLeft:1,
        marginRight:1,
        borderColor: color,
        justifyContent: "center",
        alignItems: "center"
    }

    const marker = "(" + ( isSelected? "*" : " ") + ")";

    return e(ink.Box, buttonProps, 
        e(ink.Text, {color: color}, marker + " " + message),
    );
}

const ConfirmationBox = ({
    message = "Yes or No?",
    confirmMessage = "Yes",
    denyMessage = "No",
    accentColor = "cyan",
    initialButton = "confirm",
    isFocused = true,
    onSelect,
    ...props
}) => {
    const [confirm, setConfirm] = React.useState(initialButton === "confirm");
    const [done, setDone] = React.useState(false);

    const buttonProps = {
        accentColor: accentColor,
    }

    ink.useInput((input, key) => {
        if(key.rightArrow || key.leftArrow){
            setConfirm(confirm => !confirm)
            return;
        }
        if(key.return){
            setDone(true);
            if(typeof onSelect === "function") onSelect(confirm);
            return;
        }
    }, {isActive:isFocused})

    if(done) return null;

    return e(ink.Box, _extends({flexDirection: "column", justifyContent: "center", paddingLeft:1, paddingRight:1}, props), 
        e(ink.Box, {justifyContent: "center"},
            e(ink.Text, {}, message)
        ),
        e(ink.Box, {flexDirection: "row", justifyContent: "center"},
            e(Button, _extends(buttonProps, {message: confirmMessage, isSelected: confirm})),
            e(Button, _extends(buttonProps,{message: denyMessage, isSelected: !confirm})),
        )
    )
}

module.exports = ConfirmationBox;