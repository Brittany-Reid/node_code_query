

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
        const sourceCode = context.getSourceCode();

        function comment(node){
            var nodeCode = sourceCode.text.slice(node.range[0], node.range[1]);
            var lines = nodeCode.split("\n");
            if(lines.length === 1) return "//" + nodeCode;
            //console.log(node);
            return "/*\n" + nodeCode + "*/\n";
        }

        const report = (node) => {
            return {
                node,
                message: "Export Statment",
                fix: function(fixer) {
                    return fixer.replaceText(node, comment(node));
                }
            };
        };

        return {
            ExportNamedDeclaration(node) {
                context.report(report(node));
            },
            ExportDefaultDeclaration(node) {
                context.report(report(node));
            },
            ExportAllDeclaration(node) {
                context.report(report(node));
            }
        };
    }
};