function makeRequire(source, specifiers){
    var requireString = "require(" + source.raw + ");";
    var lines = [];
    var objectSpecifierStrings = [];


    if(specifiers.length > 0){
        for(var s of specifiers){
            let line;
            if(s.type === "ImportDefaultSpecifier"){
                line = "const " + s.local.name + " = " + requireString;
                lines.push(line);
            }
            if(s.type === "ImportSpecifier"){
                var string;
                var imported = s.imported.name;
                var local = s.local.name;
                if(imported === local) string = local;
                else{
                    string = imported + ":" + local;
                }
                objectSpecifierStrings.push(string);
            }
            if(s.type === "ImportNamespaceSpecifier"){
                line = "const " + s.local.name + " = " + requireString;
                lines.push(line);
            }
        }
    }
    else{
        return requireString;
    }

    if(objectSpecifierStrings.length > 0){
        let line = "const {" + objectSpecifierStrings.join(", ") + "} = " + requireString;
        lines.push(line);
    }

    return lines.join("\n");
}

/**
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: "problem",
        docs: {
        },
        schema: [],
        fixable: "code"
    },
    create: function(context) {
        return {
            ImportDeclaration(node) {
                context.report({
                    node,
                    message: "Import Statement",
                    fix: function(fixer) {
                        //the source, package or file -> import 'source'
                        var source = node.source;
                        //specifiers
                        var specifiers = node.specifiers;

                        return fixer.replaceText(node, makeRequire(source, specifiers));
                    }
                });
            }
        };
    }
};
