const React = require("react");
const ink = require("@gnd/ink");
const ConfirmationBox = require("./confirmation-box");

const e = React.createElement;
function _extends() { let _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
 

const ConfirmPrompt = ({
    onSelect,
    ...props
}) => {

    const {stdout} = ink.useStdout();
    const app = ink.useApp();

    const [exited, setExited] = React.useState(false);
    const [selected, setSelected] = React.useState(false);

    const internalOnSelect = (v) => {
        if(typeof onSelect === "function") onSelect(v);
        setSelected(true);
        exit();
    }

    /**
      * Function to exit.
      */
    const exit = React.useCallback(()=>{
        stdout.moveCursor(0, -1);
        app.exit();
    }, []);

    React.useEffect(()=>{
        if(exited) exit();
    }, [exited])
         
    
    ink.useInput((input, key) => {
        if(key.escape){
            setExited(true);
        }
    })

    const confirmationBoxProps = {
        confirmMessage: "Yes",
        denyMessage: "No",
        borderStyle: "single",
        onSelect: internalOnSelect,
    };

    if(exited || selected) return null;

    return e(ink.Box, {justifyContent: "center"}, 
        e(ConfirmationBox, _extends(confirmationBoxProps, props))
    );
}

module.exports = ConfirmPrompt;