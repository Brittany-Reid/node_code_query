const ink = require("@gnd/ink");
const React = require("react");

const e = React.createElement;

const ProgressBar = ({
    monitor
}) => {
    const app = ink.useApp();
    const [percent, setPercent] = React.useState(0);
    const [end, setEnd] = React.useState(false);

    React.useEffect(()=>{
        setPercent(monitor.worked()/monitor.total*100);
        if(monitor.worked()/monitor.total >= 1) setEnd(true);
    }, [monitor]);

    React.useEffect(()=>{
        if(monitor.state.done){
            setEnd(true);
        }
        var onWork = (work) =>{
            setPercent(monitor.worked()/monitor.total*100);
        };

        var onEnd = () =>{
            setEnd(true);
        };

        monitor.on("work", onWork);
        monitor.on("end", onEnd);
        return () => { 
            monitor.off("work", onWork); 
            monitor.off("end", onEnd);
        };
    });

    React.useEffect(()=>{
        if(end){
            app.exit();
        }
    }, [end]);

    return e(ink.Box, {width:"100%"},
        e(ink.Box, {borderStyle:"single", width: percent+"%", height:3, minWidth: 4}, 
            e(ink.Text, {}, Math.round(percent) + "%")
        )
    );
};

module.exports = ProgressBar;
