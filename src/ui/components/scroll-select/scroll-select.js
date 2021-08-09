const {ScrollMenu, useTerminalSize} = require("ink-scroll-prompts");
const React = require("react");
const ink = require("@gnd/ink");

const e = React.createElement;

/**
 * Item Component Props
 * @typedef {Object} ItemComponentTypes
 * @property {string} label String text to display.
 * @property {boolean} isSelected If selected.
 * @property {string} [accentColor] Color to use for selected.
 * 
 * @typedef {ink.BoxProps & ink.TextProps & ItemComponentTypes} ItemComponentProps
 */

/**
 * Item Component for Menu
 * @type {React.FC<ItemComponentProps>}
 */
const ItemComponent = ({
    label,
    isSelected,
    accentColor = "cyan",
    ...props
}) => {

    const textProps = {
        dimColor: props.dimColor,
        color: isSelected ? accentColor : props.color,
    };

    return e(ink.Box, {marginRight:2},
        e(ink.Text, textProps, "(" + (isSelected? "*" : " ") + ") " + label)
    );
};

/**
 * A scrollable select prompt.
 * @type {React.FC<any>}
 */
const ScrollSelect = ({
    message,
    onSelect,
    onCancel,
    isFocused = true,
    itemComponent = ItemComponent,
    hideOnCancel = true,
    arrows = true,
    accentColor = "cyan",
    items,
    ...props
}) => {

    const {stdout} = ink.useStdout();
 
    const [height, setHeight] = React.useState(stdout.rows);
    const [width, setWidth] = React.useState(stdout.columns);
    const [canceled, setCanceled] = React.useState(false);
    const [selected, setSelected] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState(undefined);
    const [formattedItems, setFormattedItems] = React.useState(undefined);

    React.useEffect(()=>{
        var formatted = items;
        for(var f of formatted){
            f.accentColor = accentColor;
        }
        setFormattedItems(formatted)
    }, [items]);

    useTerminalSize((columns, rows) => {
        setHeight(rows);
        setWidth(columns);
    });
     
    /**
     * What happens on select. Exits then prints the selected item's label.
     */
    const internalOnSelect = React.useCallback((selectedItem)=>{
        setSelectedItem(selectedItem);
        setSelected(true);
        //wait for render
        setTimeout(()=>{
            if(typeof onSelect === "function") onSelect(selectedItem.label);
        }, 100);
    }, []);

    const internalOnCancel = React.useCallback((selectedItem)=>{
        setCanceled(true);
        if(typeof onCancel === "function") onCancel(selectedItem);
    }, [onCancel]);

    ink.useInput((input, key) => {
        if(key.escape || (key.ctrl && input === "c")){
            internalOnCancel();
        }
    }, {isActive: isFocused});

    const ScrollMenuProps = {
        accentColor: accentColor,
        maxHeight: message ? height-3 : height-2,
        width: "100%",
        items: formattedItems,
        onSelect: internalOnSelect,
        itemComponent: itemComponent,
        isFocused: isFocused,
        arrows: arrows,
        display: (canceled && hideOnCancel) ? "none" : "flex",
    };

    var messageElement = null;
    if(message) messageElement = e(ink.Box, {height:1, overflow:"hidden"}, 
        e(ink.Text, {
            dimColor: canceled ? true : false,
            wrap: "truncate"
        }, message)
    );

    if(selected){
        return e(ink.Box, {flexDirection: "column"}, 
            messageElement,
            e(itemComponent, selectedItem)
        );
    }

    if(typeof formattedItems === "undefined") return null;

    return e(ink.Box, {flexDirection: "column"}, 
        messageElement,
        e(ScrollMenu, ScrollMenuProps)
    );
};

module.exports = ScrollSelect;