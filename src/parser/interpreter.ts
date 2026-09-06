import { isAdditionExpression, isBinaryExpression, isDimensionExpression, isDivisionExpression, isExponentiationExpression, isIdentifierExpression, isMultiplicationExpression, isNumericLiteral, isSubtractionExpression, type BinaryExpression, type DimensionExpression, type Statement } from "./ast.ts";
import { extractIdentifiers } from "./reducer.ts";
import { serialiseDimensionExpression } from "./serialiser.ts";

export type Context = Record<string, unknown>;

export class Interpreter {
  private context: Context;

  constructor(context: Context = {}) {
    this.context = context;
  }

  assignContext(context: Context): void {
    this.context = context;
  }

  evaluate(expression: Statement): number | null {
    let result = null;

    if (isDimensionExpression(expression)) {
      // Check that context contains all identifiers used in the expression
      const identifiersInExpression = extractIdentifiers(expression);
      const identifiersInContext = new Set(Object.keys(this.context));
      const missingIdentifiers = [...identifiersInExpression].filter(
        (identifier) => !identifiersInContext.has(identifier),
      );

      if (missingIdentifiers.length > 0) {
        const expressionString = serialiseDimensionExpression(expression);
        throw new Error(
          `The expression "${expressionString}" is missing these variables: "${missingIdentifiers.join(", ")}" to be evaluated. Please provide them in the context.`,
        );
      }

      result = this.evaluateDimensionExpression(expression);
    } else if (isBinaryExpression(expression)) {
      result = this.evaluateBinaryExpression(expression);
    } else if (isNumericLiteral(expression)) {
      result = expression.value;
    } else if (isIdentifierExpression(expression)) {
      const value = this.context[expression.symbol];
      if (typeof value === "number") {
        result = value;
      } else {
        throw new Error(
          `The identifier "${expression.symbol}" is not a number in the provided context.`,
        );
      }
    }

    return result;
  }

  evaluateDimensionExpression(node: DimensionExpression): number | null {
    let result = null;

    node.body.forEach((statement) => {
      if (isBinaryExpression(statement)) {
        const value = this.evaluateBinaryExpression(statement);
        if (value !== null) {
          result = value;
        }
      }
    });

    return result;
  }

  evaluateBinaryExpression(node: BinaryExpression): number | null {
    const leftValue = this.evaluate(node.left);
    const rightValue = this.evaluate(node.right);

    if (leftValue === null || rightValue === null) {
      return null;
    }

    if (isMultiplicationExpression(node)) {
      return leftValue * rightValue;
    } else if (isDivisionExpression(node)) {
      return leftValue / rightValue;
    } else if (isAdditionExpression(node)) {
      return leftValue + rightValue;
    } else if (isSubtractionExpression(node)) {
      return leftValue - rightValue;
    } else if (isExponentiationExpression(node)) {
      return leftValue ** rightValue;
    }

    return null;
  }
}