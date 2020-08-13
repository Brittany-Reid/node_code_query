const Linter = require("eslint").Linter;

/**
 * Handles linting with ESLint. Constructs linter with our settings.
 */


class LinterHandler {
  constructor() {
    this.linter = new Linter();
    //get rules list
    var rules = [...this.linter.getRules().entries()];
    //filter to recommended
    rules = rules.filter((data) => data[1].meta.docs.recommended);

    //filter severity 
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

    this.config = config;

    this.config.rules["semi"] = "warn";
    this.config.rules["no-useless-constructor"] =  "warn";
  }

  /**
   * Lints string code.
   */
  lint(code) {

    var messages = this.linter.verify(code, this.config, { filename: "main.js" });

    return messages;
  }

  /**
   * Filters an array of messages to error severity only.
   */
  static errors(messages){
    var errors = messages.filter(function(message){
      if(message.severity == 2) return true;
    })
    return errors;
  }
}

module.exports = LinterHandler;
