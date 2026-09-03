import { assertEquals } from "@std/assert";
import type { BinaryExpression, IdentifierExpression, NumericLiteral } from "./ast.ts";
import Parser from "./parser.ts";


Deno.test("should parse an empty DimensionExpression", () => {
    const sourceCode = '';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: []
    });
});

Deno.test("should parse a simple numeric (integer) literal", () => {
    const sourceCode = '42';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "NumericLiteral",
                value: 42
            } as NumericLiteral
        ]
    });
});

Deno.test("should parse a simple numeric (floating-point) literal", () => {
    const sourceCode = '3.14';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "NumericLiteral",
                value: 3.14
            } as NumericLiteral
        ]
    });
});

Deno.test("should parse a simple identifier", () => {
    const sourceCode = 'Length';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "Identifier",
                symbol: "Length"
            } as IdentifierExpression
        ]
    });
});

Deno.test("should parse a simple additive expression", () => {
    const sourceCode = '1 - 2 + 3';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "BinaryExpression",
                operator: "-",
                left: { kind: "NumericLiteral", value: 1 },
                right: {
                    kind: "BinaryExpression",
                    operator: "+",
                    left: { kind: "NumericLiteral", value: 2 },
                    right: { kind: "NumericLiteral", value: 3 }
                }
            } as BinaryExpression
        ]
    });
});

Deno.test("should parse a complex additive expression with parentheses", () => {
    const sourceCode = '1 + (2 - 3)';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "BinaryExpression",
                operator: "+",
                left: { kind: "NumericLiteral", value: 1 },
                right: {
                    kind: "BinaryExpression",
                    operator: "-",
                    left: { kind: "NumericLiteral", value: 2 },
                    right: { kind: "NumericLiteral", value: 3 }
                }
            } as BinaryExpression
        ]
    });
});

Deno.test("should parse a simple multiplicative expression", () => {
    const sourceCode = '4 * 5 / 2';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);
    
    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "BinaryExpression",
                operator: "/",
                left: {
                    kind: "BinaryExpression",
                    operator: "*",
                    left: { kind: "NumericLiteral", value: 4 },
                    right: { kind: "NumericLiteral", value: 5 }
                },
                right: { kind: "NumericLiteral", value: 2 }
            } as BinaryExpression
        ]
    });
});

Deno.test("should parse a complex multiplicative expression with parentheses", () => {
    const sourceCode = '4 * (5 / 2)';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "BinaryExpression",
                operator: "*",
                left: { kind: "NumericLiteral", value: 4 },
                right: {
                    kind: "BinaryExpression",
                    operator: "/",
                    left: { kind: "NumericLiteral", value: 5 },
                    right: { kind: "NumericLiteral", value: 2 }
                }
            } as BinaryExpression
        ]
    });
});

Deno.test("should parse a simple exponentiation expression", () => {
    const sourceCode = '2 ^ 3';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "BinaryExpression",
                operator: "^",
                left: { kind: "NumericLiteral", value: 2 },
                right: { kind: "NumericLiteral", value: 3 }
            } as BinaryExpression
        ]
    });
});

Deno.test("should parse a complex expression with mixed operators", () => {
    const sourceCode = '1^3 + 2 * 3 - 4 / 5';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "BinaryExpression",
                operator: "-",
                left: {
                    kind: "BinaryExpression",
                    operator: "+",
                    left: {
                        kind: "BinaryExpression",
                        operator: "^",
                        left: { kind: "NumericLiteral", value: 1 },
                        right: { kind: "NumericLiteral", value: 3 }
                    },
                    right: {
                        kind: "BinaryExpression",
                        operator: "*",
                        left: { kind: "NumericLiteral", value: 2 },
                        right: { kind: "NumericLiteral", value: 3 }
                    }
                },
                right: {
                    kind: "BinaryExpression",
                    operator: "/",
                    left: { kind: "NumericLiteral", value: 4 },
                    right: { kind: "NumericLiteral", value: 5 }
                }
            } as BinaryExpression
        ]
    });
});

Deno.test("should parse a complex expression with parentheses and mixed operators", () => {
    const sourceCode = '(1 + 2) * (3 - 4) / 5';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "BinaryExpression",
                operator: "/",
                left: {
                    kind: "BinaryExpression",
                    operator: "*",
                    left: {
                        kind: "BinaryExpression",
                        operator: "+",
                        left: { kind: "NumericLiteral", value: 1 },
                        right: { kind: "NumericLiteral", value: 2 }
                    },
                    right: {
                        kind: "BinaryExpression",
                        operator: "-",
                        left: { kind: "NumericLiteral", value: 3 },
                        right: { kind: "NumericLiteral", value: 4 }
                    }
                },
                right: { kind: "NumericLiteral", value: 5 }
            } as BinaryExpression
        ]
    });
});

Deno.test("should parse a complex expression with nested parentheses and mixed operators", () => {
    const sourceCode = '((1 + 2) * (3 - 4)) / (5 ^ 6)';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "BinaryExpression",
                operator: "/",
                left: {
                    kind: "BinaryExpression",
                    operator: "*",
                    left: {
                        kind: "BinaryExpression",
                        operator: "+",
                        left: { kind: "NumericLiteral", value: 1 },
                        right: { kind: "NumericLiteral", value: 2 }
                    },
                    right: {
                        kind: "BinaryExpression",
                        operator: "-",
                        left: { kind: "NumericLiteral", value: 3 },
                        right: { kind: "NumericLiteral", value: 4 }
                    }
                },
                right: {
                    kind: "BinaryExpression",
                    operator: "^",
                    left: { kind: "NumericLiteral", value: 5 },
                    right: { kind: "NumericLiteral", value: 6 }
                }
            } as BinaryExpression
        ]
    });
});

Deno.test("should parse a complex expression with identifiers, literals, and mixed operators", () => {
    const sourceCode = 'Length + 2 * (Width - 3) / Height ^ 4';
    const parser = new Parser();
    const ast = parser.parseDimensionExpression(sourceCode);

    assertEquals(ast, {
        kind: "DimensionExpression",
        body: [
            {
                kind: "BinaryExpression",
                operator: "+",
                left: { kind: "Identifier", symbol: "Length" } as IdentifierExpression,
                right: {
                    kind: "BinaryExpression",
                    operator: "/",
                    left: {
                        kind: "BinaryExpression",
                        operator: "*",
                        left: { kind: "NumericLiteral", value: 2 },
                        right: {
                            kind: "BinaryExpression",
                            operator: "-",
                            left: { kind: "Identifier", symbol: "Width" } as IdentifierExpression,
                            right: { kind: "NumericLiteral", value: 3 }
                        }
                    },
                    right: {
                        kind: "BinaryExpression",
                        operator: "^",
                        left: { kind: "Identifier", symbol: "Height" } as IdentifierExpression,
                        right: { kind: "NumericLiteral", value: 4 }
                    }
                }
            } as BinaryExpression
        ]
    });
});