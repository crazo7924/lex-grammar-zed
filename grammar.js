export default grammar({
  name: "lex",

  extras: ($) => [
    /[ \t\r]+/, // Only skip horizontal spaces; newlines matter structurally!
  ],

  rules: {
    source_file: ($) =>
      seq(
        optional($.definitions_section),
        $.delimiter,
        optional($.rules_section),
        optional(seq($.delimiter, optional($.user_code_section))),
      ),

    delimiter: ($) => "%%",

    // --- Definitions Section ---
    definitions_section: ($) =>
      repeat1(
        choice(
          $.c_code_block,
          $.option_definition,
          $.macro_definition,
          $.newline,
        ),
      ),

    c_code_block: ($) =>
      seq(
        "%{",
        repeat(/[^\n]*\n/), // Safely capture entire lines of C code including preprocessors
        "%}",
      ),

    // Explicitly capture %option as a unified token so it doesn't split
    option_definition: ($) => seq(/%option/, /[^\n]+/),

    macro_definition: ($) => seq($.macro_name, $.macro_value),

    macro_name: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    macro_value: ($) => /[^\n]+/,

    // --- Rules Section ---
    rules_section: ($) => repeat1(choice($.rule, $.newline)),

    rule: ($) => seq($.pattern, $.action, $.newline),

    // Matches any text inside quotes explicitly before anything else can touch it
    pattern: ($) =>
      choice(
        seq('"', repeat(/[^"\n]/), '"'), // Safely captures "//" and "/*" as strings
        /[^\s{}%%/\"]+/, // Standard regex characters
        seq("{", /[a-zA-Z_][a-zA-Z0-9_]*/, "}"), // Macro usage
      ),

    action: ($) => choice($.braced_action, $.inline_action),

    // Captures everything between matching outer braces safely
    braced_action: ($) => seq("{", repeat(choice(/[^}]/, /\{[^}]*\}/)), "}"),

    inline_action: ($) => /[^\n]+/,

    user_code_section: ($) => /(.|\n)*/,

    newline: ($) => "\n",
  },
});
