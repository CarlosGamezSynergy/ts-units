import { assertEquals } from "@std/assert";
import { buildToken, tokenise } from './lexer.ts';

const eofToken = (line: number, col: number) => buildToken("EOFTk", '<EndOfFile>', line, col)

Deno.test('Tokenize empty input', () => {
    const input = '';
    const tokens = tokenise(input);
    assertEquals(tokens, [eofToken(1, 1)]);
});

Deno.test('Tokenize whitespace only', () => {
    const input = '   \n\t  ';
    const tokens = tokenise(input);
    assertEquals(tokens, [eofToken(2, 4)]);
});

Deno.test('Tokenize single identifier', () => {
    const input = 'Length';
    const tokens = tokenise(input);
    assertEquals(tokens, [
        { type: "IdentifierTk", value: "Length", line: 1, column: 1 },
        eofToken(1, 7)
    ]);
});

Deno.test('Tokenize single number', () => {
    const input = '12345';
    const tokens = tokenise(input);
    assertEquals(tokens, [
        { type: "NumberTk", value: "12345", line: 1, column: 1 },
        eofToken(1, 6)
    ]);
});

Deno.test('Tokenize single operator', () => {
    const input = '+';
    const tokens = tokenise(input);
    assertEquals(tokens, [
        { type: "BinaryOperatorTk", value: "+", line: 1, column: 1 },
        eofToken(1, 2)
    ]);
});

Deno.test('Tokenize single parenthesis', () => {
    const input = '(';
    const tokens = tokenise(input);
    assertEquals(tokens, [
        { type: "OpenParenTk", value: "(", line: 1, column: 1 },
        eofToken(1, 2)
    ]);
});

Deno.test('Tokenize complex input', () => {
    const input = 'Length + 5 * (Width - 2)';
    const tokens = tokenise(input);
    assertEquals(tokens, [
        { type: "IdentifierTk", value: "Length", line: 1, column: 1 },
        { type: "BinaryOperatorTk", value: "+", line: 1, column: 8 },
        { type: "NumberTk", value: "5", line: 1, column: 10 },
        { type: "BinaryOperatorTk", value: "*", line: 1, column: 12 },
        { type: "OpenParenTk", value: "(", line: 1, column: 14 },
        { type: "IdentifierTk", value: "Width", line: 1, column: 15 },
        { type: "BinaryOperatorTk", value: "-", line: 1, column: 21 },
        { type: "NumberTk", value: "2", line: 1, column: 23 },
        { type: "CloseParenTk", value: ")", line: 1, column: 24 },
        eofToken(1, 25)
    ]);
});