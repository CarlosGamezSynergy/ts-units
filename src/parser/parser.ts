import type {
    BinaryExpression,
    DimensionExpression,
    Expression,
    IdentifierExpression,
    NumericLiteral,
    Statement
} from "./ast.ts";
import { tokenise, type Token } from "./lexer.ts";

export default class Parser {
    private tokens: Token[] = [];

    private notAtEOF(): boolean {
        return this.tokens[0] !== undefined
            && this.tokens[0].type !== "EOFTk";
    }

    private at(): Token {
        return this.tokens[0]!;
    }

    private consume(): Token {
        const token = this.tokens.shift()!;
        return token;
    }

    private peek(offset: number = 0): Token {
        return this.tokens[offset]!;
    }

    private expect(type: string): Token {
        const token = this.consume();
        if (token.type !== type) {
            throw new Error(`Expected token of type ${type}, but got ${token.value} at line ${token.line}, column ${token.column}`);
        }
        return token;
    }

    public parseDimensionExpression(sourceCode: string): DimensionExpression {
        this.tokens = tokenise(sourceCode);

        const program: DimensionExpression = {
            kind: "DimensionExpression",
            body: []
        };

        while (this.notAtEOF()) {
            program.body.push(this.parseStatement());
        }

        return program;
    }

    private parseStatement(): Statement {
        switch (this.at().type) {
            default:
                return this.parseExpression();
        }
    }

    // EXPRESSIONS

    private parseExpression(): Expression {
        return this.parseSubtractionExpression();
    }

    private parseSubtractionExpression(): Expression {
        let left = this.parseAdditionExpression();

        while (this.at().type === "BinaryOperatorTk" && this.at().value === "-") {
            const operatorToken = this.consume();
            const right = this.parseAdditionExpression();
            left = {
                kind: "BinaryExpression",
                operator: operatorToken.value,
                left: left,
                right: right
            } as BinaryExpression;
        }

        return left;
    }

    private parseAdditionExpression(): Expression {
        let left = this.parseDivisionExpression();

        while (this.at().type === "BinaryOperatorTk" && this.at().value === "+") {
            const operatorToken = this.consume();
            const right = this.parseDivisionExpression();
            left = {
                kind: "BinaryExpression",
                operator: operatorToken.value,
                left: left,
                right: right
            } as BinaryExpression;
        }

        return left;
    }

    private parseDivisionExpression(): Expression {
        let left = this.parseMultiplicationExpression();

        while (this.at().type === "BinaryOperatorTk" && this.at().value === "/") {
            const operatorToken = this.consume();
            const right = this.parseMultiplicationExpression();
            left = {
                kind: "BinaryExpression",
                operator: operatorToken.value,
                left: left,
                right: right
            } as BinaryExpression;
        }

        return left;
    }

    private parseMultiplicationExpression(): Expression {
        let left = this.parseExponentiationExpression();

        while (this.at().type === "BinaryOperatorTk" && this.at().value === "*") {
            const operatorToken = this.consume();
            const right = this.parseExponentiationExpression();
            left = {
                kind: "BinaryExpression",
                operator: operatorToken.value,
                left: left,
                right: right
            } as BinaryExpression;
        }

        return left;
    }

    private parseExponentiationExpression(): Expression {
        let left = this.parsePrimaryExpression();

        while (this.at().type === "BinaryOperatorTk" && this.at().value === "^") {
            const operatorToken = this.consume();
            const right = this.parsePrimaryExpression();
            left = {
                kind: "BinaryExpression",
                operator: operatorToken.value,
                left: left,
                right: right
            } as BinaryExpression;
        }

        return left;
    }

    private parsePrimaryExpression(): Expression {
        const tk = this.at();

        switch (tk.type) {
            case "NumberTk": {
                this.consume();
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(tk.value)
                } as NumericLiteral;
            }
            case "IdentifierTk": {
                this.consume();
                return {
                    kind: "Identifier",
                    symbol: tk.value
                } as IdentifierExpression;
            }
            case "OpenParenTk": {
                this.consume(); // consume '('
                const expr = this.parseExpression();
                this.expect("CloseParenTk"); // expect ')'
                return expr;
            }
            default:
                throw new Error(`Unexpected token type: ${tk.type} at line ${tk.line}, column ${tk.column}`);
        }
    }
}