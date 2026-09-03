import type {
	BinaryExpression,
	DimensionExpression,
	Expression,
	IdentifierExpression,
	NumericLiteral,
	Statement
} from "./ast.ts";

function precedence(expression: Expression): number {
	switch (expression.kind) {
		case "BinaryExpression": {
			const operator = (expression as BinaryExpression).operator;
			if (operator === "+" || operator === "-") {
					return 1;
			}
			if (operator === "*" || operator === "/") {
					return 2;
			}
			return operator === "^" ? 3 : 0;
		}
		case "Identifier":
		case "NumericLiteral":
			return 4;
		default:
			return 0;
	}
}

function serialiseExpression(expression: Expression, parentPrecedence = 0): string {
	let result: string;

	switch (expression.kind) {
		case "Identifier":
			result = (expression as IdentifierExpression).symbol;
			break;
		case "NumericLiteral":
			result = String((expression as NumericLiteral).value);
			break;
		case "BinaryExpression": {
			const binaryExpression = expression as BinaryExpression;
			const currentPrecedence = precedence(expression);
			const left = serialiseExpression(binaryExpression.left, currentPrecedence);
			const rightExpression = serialiseExpression(binaryExpression.right);
			const right = precedence(binaryExpression.right) <= currentPrecedence
				? `(${rightExpression})`
				: rightExpression;
			result = `${left} ${binaryExpression.operator} ${right}`;
			break;
		}
		default:
			throw new Error(`Unsupported expression kind: ${(expression as Statement).kind}`);
	}

	return precedence(expression) < parentPrecedence ? `(${result})` : result;
}

export function serialiseDimensionExpression(expression: DimensionExpression): string {
	return expression.body
		.map(statement => serialiseExpression(statement as Expression))
		.join(" ");
}

export default serialiseDimensionExpression;
