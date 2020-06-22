const Linter = require("eslint").Linter;

/**
 * We need some alternative to Java compiler errors. This is currently just testing out how to get this.
 * Will likely rename the class.
 */

class Compiler {
  constructor() {}

  async compile(code) {
    var linter = new Linter();
    var rules = [...linter.getRules().entries()];
    rules = rules.filter((data) => data[1].meta.docs.recommended);
    rules = rules.map((data) => data[0]);
    var config = { rules: {} };
    rules.forEach(function (value, index) {
        var severity = "error";
        switch (value) {
            case "no-unused-vars":
                severity = "warn";
                break;
            case "no-extra-semi":
                severity = "warn";
                break;
            default:
                severity = "error";
                break;
        }
      config.rules[value] = severity;
    });

    config.rules["semi"] = "warn";
    

    var messages = linter.verify(code, config, { filename: "main.js" });
    console.log(messages);
  }
}

new Compiler().compile("var foo = bar;");
