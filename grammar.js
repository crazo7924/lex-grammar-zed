export default grammar({
  name: "lex",

  extras: ($) => [
    /\s+/, // Skip whitespace naturally
    $.comment,
  ],

  rules: {
    // A lex file consists of definitions, a rule section, and an optional user code section
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
      repeat1(choice($.c_code_block, $.macro_definition)),

    c_code_block: ($) =>
      seq(
        "%{",
        repeat(choice(/[^%]/, /%[^}]/)), // Match anything except %}
        "%}",
      ),

    macro_definition: $ => seq(
        $.macro_name,
        $.macro_value
    ),

    macro_name: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    macro_value: $ => /[^\n]+/ ,

    // --- Rules Section ---
    rules_section: ($) => repeat1($.rule),

    rule: ($) => seq($.pattern, $.action),

    // A simple regex pattern or macro expansion like {DIGIT}
    pattern: ($) =>
      choice(
        /[^\s{}]+/, // Simple regex chars
        seq("{", /[a-zA-Z_][a-zA-Z0-9_]*/, "}"), // Macro usage
      ),

    // Action is usually a C block { return TOKEN; } or a single statement
    action: ($) =>
      choice(
        seq("{", repeat(choice(/[^}]/, /\{[^}]*\}/)), "}"), // Handles simple nested braces
        /[^\n]+/, // Or a single line statement
      ),

    // --- User Code Section ---
    user_code_section: ($) => /(.|\n)*/,

    // --- Comments ---
    comment: ($) =>
      choice(
        seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"), // Multi-line C comment
        seq("//", /[^\n]*/), // Single-line comment
      ),
  },
});
