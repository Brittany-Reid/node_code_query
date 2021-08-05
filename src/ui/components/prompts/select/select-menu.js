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
    accentColor,
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
 * Select Menu onSelect Handler
 * @callback OnSelectHandler
 * @param {string} selected Item that was Selected.
 */

/**
 * Select Menu onCancel Handler
 * @callback OnCancelHandler
 * @param {string} selected Item that was Selected on cancel.
 */

/**
 * Select Menu Props
 * @typedef {Object} SelectMenuTypes
 * @property {Array<string>} items Items
 * @property {string} [message] Text to display above menu.
 * @property {string} [accentColor] Color to use for selected.
 * @property {OnSelectHandler} [onSelect] Function called on select.
 * @property {OnCancelHandler} [onCancel] Function called on cancel.
 * @property {boolean} [isFocused] Is element accepting input?
 * 
 * @typedef {ink.BoxProps & SelectMenuTypes} SelectMenuProps
 */

/**
 * Select Menu 
 * @type {React.FC<SelectMenuProps>}
 */
const SelectMenu = ({
    items = [],
    message,
    accentColor = "cyan",
    onSelect,
    onCancel,
    isFocused = true,
    ...props
}) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [canceled, setCanceled] = React.useState(false);

    ink.useInput((input, key) => {
        if(key.upArrow || key.leftArrow){
            let newIndex = selectedIndex - 1;
            if(newIndex < 0) newIndex = items.length-1;
            setSelectedIndex(newIndex);
            return;
        }
        if(key.downArrow || key.rightArrow){
            let newIndex = selectedIndex + 1;
            if(newIndex >= items.length) newIndex = 0;
            setSelectedIndex(newIndex);
            return;
        }
        if(key.return){
            if(typeof onSelect === "function") onSelect(items[selectedIndex]);
            return;
        }
        if(key.escape || (key.ctrl && input === "c")){
            setCanceled(true);
            if(typeof onCancel === "function") onCancel(items[selectedIndex]);
            return;
        }
    }, {isActive: isFocused});

    const dimColor = canceled ? true : false;

    return e(ink.Box, props,
        items.map((value, index)=>{
            var isSelected = (selectedIndex === index);
            return e(ItemComponent, {
                label: value,
                key: index,
                dimColor: dimColor,
                accentColor: accentColor,
                isSelected: isSelected,
            });
        })
    );
};

module.exports = {
    SelectMenu,
    ItemComponent
};
