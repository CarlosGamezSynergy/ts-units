
export type NodeType =
    | "DimensionExpression"

    | "Identifier"
    | "BinaryExpression"
    | "NumericLiteral";

export interface Statement {
    kind: NodeType;
}

export interface DimensionExpression extends Statement {
    kind: "DimensionExpression";
    body: Statement[];
}

export interface Expression extends Statement { }

// COMPOUND EXPRESSIONS

export interface BinaryExpression extends Expression {
    kind: "BinaryExpression";
    operator: string;
    left: Expression;
    right: Expression;
}

// PRIMARY EXPRESSIONS

export interface IdentifierExpression extends Expression {
    kind: "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expression {
    kind: "NumericLiteral";
    value: number;
}

// TYPE CHECKS

export function isDimensionExpression(node: Statement): node is DimensionExpression {
    return node.kind === "DimensionExpression";
}

export function isBinaryExpression(node: Statement): node is BinaryExpression {
    return node.kind === "BinaryExpression";
}

export function isIdentifierExpression(node: Statement): node is IdentifierExpression {
    return node.kind === "Identifier";
}

export function isNumericLiteral(node: Statement): node is NumericLiteral {
    return node.kind === "NumericLiteral";
}

export function isMultiplicationExpression(node: Statement): boolean {
    return isBinaryExpression(node) && node.operator === "*";
}

export function isDivisionExpression(node: Statement): boolean {
    return isBinaryExpression(node) && node.operator === "/";
}

export function isAdditionExpression(node: Statement): boolean {
    return isBinaryExpression(node) && node.operator === "+";
}

export function isSubtractionExpression(node: Statement): boolean {
    return isBinaryExpression(node) && node.operator === "-";
}

export function isExponentiationExpression(node: Statement): boolean {
    return isBinaryExpression(node) && node.operator === "^";
}