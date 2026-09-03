import type {
	BinaryExpression,
	DimensionExpression,
	Expression,
	IdentifierExpression,
	NumericLiteral,
	Statement
} from "./ast.ts";

type Reduction = {
	coefficient: number;
	exponents: Map<string, number>;
};

function numericValue(expression: Expression): number {
	if (expression.kind !== "NumericLiteral") {
		throw new Error("An exponent must be a numeric literal");
	}

	return (expression as NumericLiteral).value;
}

function collect(expression: Expression, sign: number, reduction: Reduction): void {
	switch (expression.kind) {
		case "Identifier": {
			const identifierExpression = expression as IdentifierExpression;
			reduction.exponents.set(
				identifierExpression.symbol,
				(reduction.exponents.get(identifierExpression.symbol) ?? 0) + sign
			);
			return;
		}
		case "NumericLiteral": {
			const numericExpression = expression as NumericLiteral;
			if (numericExpression.value === 0 && sign < 0) {
				throw new Error("Division by zero");
			}
			reduction.coefficient *= numericExpression.value ** sign;
			return;
		}
		case "BinaryExpression":
			break;
		default:
			throw new Error(`Unsupported expression kind: ${(expression as Statement).kind}`);
	}

	const binaryExpression = expression as BinaryExpression;
	switch (binaryExpression.operator) {
		case "*":
			collect(binaryExpression.left, sign, reduction);
			collect(binaryExpression.right, sign, reduction);
			return;
		case "/":
			collect(binaryExpression.left, sign, reduction);
			collect(binaryExpression.right, -sign, reduction);
			return;
		case "^": {
			const exponent = numericValue(binaryExpression.right);
			collect(binaryExpression.left, sign * exponent, reduction);
			return;
		}
		default:
			throw new Error(`Unsupported operator: ${binaryExpression.operator}`);
	}
}

function identifier(symbol: string): IdentifierExpression {
	return { kind: "Identifier", symbol };
}

function power(symbol: string, exponent: number): Expression {
	const base = identifier(symbol);
	return exponent === 1
		? base
		: {
			kind: "BinaryExpression",
			operator: "^",
			left: base,
			right: { kind: "NumericLiteral", value: exponent } as NumericLiteral
		} as BinaryExpression;
}

function multiply(expressions: Expression[]): Expression | undefined {
	return expressions.reduce<Expression | undefined>((left, right) => {
		if (left === undefined) {
			return right;
		}
		return {
			kind: "BinaryExpression",
			operator: "*",
			left,
			right
		} as BinaryExpression;
	}, undefined);
}

export function reduceDimensionExpression(expression: DimensionExpression): DimensionExpression {
	if (expression.body.length === 0) {
		return { kind: "DimensionExpression", body: [] };
	}

	const reduction: Reduction = {
		coefficient: 1,
		exponents: new Map()
	};

	for (const statement of expression.body) {
		collect(statement as Expression, 1, reduction);
	}

	const numerator: Expression[] = [];
	const denominator: Expression[] = [];

	if (reduction.coefficient !== 1 || reduction.exponents.size === 0) {
		numerator.push({ kind: "NumericLiteral", value: reduction.coefficient } as NumericLiteral);
	}

	for (const [symbol, exponent] of reduction.exponents) {
		if (exponent > 0) {
			numerator.push(power(symbol, exponent));
		} else if (exponent < 0) {
			denominator.push(power(symbol, -exponent));
		}
	}

	const numeratorExpression = multiply(numerator);
	const denominatorExpression = multiply(denominator);
	const body: Expression[] = [];

	if (numeratorExpression !== undefined) {
		body.push(numeratorExpression);
	}
	if (denominatorExpression !== undefined) {
		body[0] = {
			kind: "BinaryExpression",
			operator: "/",
			left: body[0] ?? { kind: "NumericLiteral", value: 1 },
			right: denominatorExpression
		} as BinaryExpression;
	}

	return {
		kind: "DimensionExpression",
		body
	};
}

export default reduceDimensionExpression;
