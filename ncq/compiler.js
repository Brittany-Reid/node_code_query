const Linter = require("eslint").Linter;

/**
 * We need some alternative to Java compiler errors. This is currently just testing out how to get this.
 * Will likely rename the class.
 */


class Compiler {
  constructor() {
  }

  async compile(code){
  }

  async compile(code) {
    var linter = new Linter();
    var rules = [...linter.getRules().entries()];
    rules = rules.filter((data) => data[1].meta.docs.recommended);
    rules = rules.map((data) => data[0]);
    var config = { rules: {} };
    rules.forEach(function (value, index) {
        var severity = "error";
        switch (value) {
            /*
             * Allowed Patterns
             * These don't cause runtime errors.
             * And they aren't likely to create other errors.
             * For example, style errors.
             */
            case "no-class-assign":
            case "require-yield":
            case "no-mixed-spaces-and-tabs":
            case "no-case-declarations":
                break;
            /*
             * Warnings
             * These don't cause fatal errors, but can
             * have unintended effects and should generally be avoided.
             */
            case "no-dupe-class-members":
            case "no-unused-vars":
            case "no-extra-semi":
            case "no-shadow-restricted-names":
            case "no-useless-escape":
            case "no-useless-catch":
            case "no-unused-labels":
            case "no-self-assign":
            case "no-redeclare":
            case "no-octal":
            case "no-global-assign":
            case "no-fallthrough":
            case "no-empty-pattern":
                severity = "warn";
                break;
            /*
             * Errors
             * Cause fatal error during runtime
             */
            default:
                severity = "error";
                break;
        }
      config.rules[value] = severity;
    });

    config.rules["semi"] = "warn";
    config.rules["no-useless-constructor"] =  "warn";
    

    var messages = linter.verify(code, config, { filename: "main.js" });
    console.log(messages);
  }
}

new Compiler().compile("var foo = bar; bar+1");
