
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
