import { AST_Binary, AST_Conditional, AST_Dot, AST_Sequence, AST_Statement, AST_Sub, AST_UnaryPostfix } from "../ast.js";

// return true if the node at the top of the stack (that means the
// innermost node in the current output) is lexically the first in
// a statement.
function first_in_statement(stack) {
    let node = stack.parent(-1);
    for (let i = 0, p; p = stack.parent(i); i++) {
        if (p instanceof AST_Statement && p.body === node)
            return true;
        if ((p instanceof AST_Sequence && p.expressions[0] === node) ||
            (p.TYPE === "Call" && p.expression === node) ||
            (p instanceof AST_Dot && p.expression === node) ||
            (p instanceof AST_Sub && p.expression === node) ||
            (p instanceof AST_Conditional && p.condition === node) ||
            (p instanceof AST_Binary && p.left === node) ||
            (p instanceof AST_UnaryPostfix && p.expression === node)
        ) {
            node = p;
        } else {
            return false;
        }
    }
}

export { first_in_statement };
