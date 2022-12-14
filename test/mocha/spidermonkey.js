var assert = require("assert");
var fs = require("fs");
var acorn = require("acorn");
var escodegen = require("escodegen");
var UglifyJS = require("../..");

describe("spidermonkey export/import sanity test", function() {
    it("Should judge between directives and strings correctly on import", function() {
        var tests = [
            {
                input: '"use strict";;"use sloppy"',
                directives: 1,
                strings: 1
            },
            {
                input: ';"use strict"',
                directives: 0,
                strings: 1
            },
            {
                input: '"use strict"; "use something else";',
                directives: 2,
                strings: 0
            },
            {
                input: 'function foo() {"use strict";;"use sloppy" }',
                directives: 1,
                strings: 1
            },
            {
                input: 'function foo() {;"use strict" }',
                directives: 0,
                strings: 1
            },
            {
                input: 'function foo() {"use strict"; "use something else"; }',
                directives: 2,
                strings: 0
            },
            {
                input: 'var foo = function() {"use strict";;"use sloppy" }',
                directives: 1,
                strings: 1
            },
            {
                input: 'var foo = function() {;"use strict" }',
                directives: 0,
                strings: 1
            },
            {
                input: 'var foo = function() {"use strict"; "use something else"; }',
                directives: 2,
                strings: 0
            },
            {
                input: '{"use strict";;"use sloppy" }',
                directives: 0,
                strings: 2
            },
            {
                input: '{;"use strict" }',
                directives: 0,
                strings: 1
            },
            {
                input: '{"use strict"; "use something else"; }',
                directives: 0,
                strings: 2
            }
        ];

        var counter_directives;
        var counter_strings;

        var checkWalker = new UglifyJS.TreeWalker(function(node, descend) {
            if (node instanceof UglifyJS.AST_String) {
                counter_strings++;
            } else if (node instanceof UglifyJS.AST_Directive) {
                counter_directives++;
            }
        });

        for (var i = 0; i < tests.length; i++) {
            counter_directives = 0;
            counter_strings = 0;

            var ast = UglifyJS.parse(tests[i].input);
            var moz_ast = ast.to_mozilla_ast();
            var from_moz_ast = UglifyJS.AST_Node.from_mozilla_ast(moz_ast);

            from_moz_ast.walk(checkWalker);

            assert.strictEqual(counter_directives, tests[i].directives, "Directives count mismatch for test " + tests[i].input);
            assert.strictEqual(counter_strings, tests[i].strings, "String count mismatch for test " + tests[i].input);
        }
    });

    it("should output and parse ES6 code correctly", function() {
        var code = fs.readFileSync("test/input/spidermonkey/input.js", "utf-8");
        var uglify_ast = UglifyJS.parse(code);
        var moz_ast = uglify_ast.to_mozilla_ast();
        var from_moz_ast = UglifyJS.AST_Node.from_mozilla_ast(moz_ast);
        assert.strictEqual(
            from_moz_ast.print_to_string(),
            uglify_ast.print_to_string()
        );
    });

    it("should be capable of importing from acorn", function() {
        var code = fs.readFileSync("test/input/spidermonkey/input.js", "utf-8");
        var uglify_ast = UglifyJS.parse(code);
        var moz_ast = acorn.parse(code, {sourceType: 'module', ecmaVersion: 9});
        var from_moz_ast = UglifyJS.AST_Node.from_mozilla_ast(moz_ast);
        assert.strictEqual(
            from_moz_ast.print_to_string(),
            uglify_ast.print_to_string()
        );
    });

    it("should correctly minify AST from from_moz_ast with default function parameter", () => {
        const code = "function run(x = 2){}";
        const acornAst = acorn.parse(code, { locations: true });
        const terserAst = UglifyJS.AST_Node.from_mozilla_ast(acornAst);
        const result = UglifyJS.minify(terserAst);
        assert.strictEqual(
            result.code,
            "function run(x=2){}"
        );
    });

    it("should produce an AST compatible with escodegen", function() {
        var code = fs.readFileSync("test/input/spidermonkey/input.js", "utf-8");
        var uglify_ast = UglifyJS.parse(code);
        var moz_ast = uglify_ast.to_mozilla_ast();
        var generated = escodegen.generate(moz_ast)
            .replace(/\[object Object\].\[object Object\]/g, "new.target");  // escodegen issue
        var parsed = acorn.parse(generated, {
            sourceType: "module",
            ecmaVersion: 9
        });
        assert.strictEqual(
            UglifyJS.AST_Node.from_mozilla_ast(parsed).print_to_string(),
            uglify_ast.print_to_string()
        );
    });
});
