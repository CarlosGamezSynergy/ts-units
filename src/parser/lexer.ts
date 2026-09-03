export type TokenType =
    | "BinaryOperatorTk"
    | "CloseParenTk"
    | "EOFTk"
    | "IdentifierTk"
    | "NumberTk"
    | "OpenParenTk";

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}

export function buildToken(type: TokenType, value: string, line: number, column: number): Token {
    return { type, value, line, column };
}

export function tokenise(input: string): Token[] {
    const tokens: Token[] = [];
    let currentLine = 1;
    let currentColumn = 1;
    let currentIndex = 0;

    while (currentIndex < input.length) {
        const char = input[currentIndex]!;

        if (char === ' ' || char === '\t') {
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char === '\n') {
            currentLine++;
            currentColumn = 1;
            currentIndex++;
            continue;
        }

        if (char === '(') {
            tokens.push(buildToken("OpenParenTk", '(', currentLine, currentColumn));
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char === ')') {
            tokens.push(buildToken("CloseParenTk", ')', currentLine, currentColumn));
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char === '+' || char === '-' || char === '*' || char === '/' || char === '^') {
            tokens.push(buildToken("BinaryOperatorTk", char, currentLine, currentColumn));
            currentColumn++;
            currentIndex++;
            continue;
        }

        if (char >= '0' && char <= '9' || (char === '.' && currentIndex + 1 < input.length && input[currentIndex + 1]! >= '0' && input[currentIndex + 1]! <= '9')) {
            let numberValue = '';
            while (currentIndex < input.length && ((input[currentIndex]! >= '0' && input[currentIndex]! <= '9') || input[currentIndex]! === '.')) {
                numberValue += input[currentIndex];
                currentIndex++;
                currentColumn++;
            }
            tokens.push(buildToken("NumberTk", numberValue, currentLine, currentColumn - numberValue.length));
            continue;
        }

        if (/[a-zA-Z_]/.test(char)) {
            let identifierValue = '';
            while (currentIndex < input.length && /[a-zA-Z0-9_]/.test(input[currentIndex]!)) {
                identifierValue += input[currentIndex];
                currentIndex++;
                currentColumn++;
            }
            
            tokens.push(buildToken("IdentifierTk", identifierValue, currentLine, currentColumn - identifierValue.length));
            continue;
        }

        throw new Error(`Unexpected character '${char}' at line ${currentLine}, column ${currentColumn}`);
    }

    tokens.push(buildToken("EOFTk", '<EndOfFile>', currentLine, currentColumn));
    return tokens;
}