export default grammar({
  name: "lex",

  extras: ($) => [
    /\s+/, // Skip whitespace naturally
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
      repeat1(choice(
          $.c_code_block,
          $.macro_definition,
          $.comment
      )
    ),

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
    rules_section: $ => repeat1(seq($.rule, $.comment)),

    rule: $ => seq(
      $.pattern,
      $.action
    ),

    pattern: $ => choice(
      seq('"', repeat(/[^"\n]/), '"'),
      /[^\s{}]+/,
      seq('{', /[a-zA-Z_][a-zA-Z0-9_]*/, '}')
    ),

    // Differentiate between a braced block action and a naked inline action
    action: $ => choice(
      $.braced_action,
      $.inline_action
    ),

    braced_action: $ => seq('{', repeat(choice(/[^}]/, /\{[^}]*\}/)), '}'),

    // Grabs everything until the end of the line, excluding trailing spaces or comments
    inline_action: $ => /[^\n;\/]+;?/,

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
