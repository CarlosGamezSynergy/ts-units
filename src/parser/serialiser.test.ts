import { assertEquals } from "@std/assert";
import type {
    DimensionExpression
} from "./ast.ts";
import Parser from "./parser.ts";
import serialiseDimensionExpression from './serialiser.ts'

const parser = new Parser();

Deno.test("serialiseDimensionExpression correctly serialises empty expression", () => {
    const expression: DimensionExpression = {
        kind: "DimensionExpression",
        body: []
    };
    const serialised = serialiseDimensionExpression(expression);
    assertEquals(serialised, "");
});

Deno.test("serialiseDimensionExpression correctly serialises expression with binary operations", () => {
    const expression: DimensionExpression = parser.parseDimensionExpression("Length * Width ^ 2");
    const serialised = serialiseDimensionExpression(expression);
    assertEquals(serialised, "Length * Width ^ 2");
});

Deno.test("serialiseDimensionExpression correctly serialises a complex expression", () => {
    const expressionString = "Length * Width ^ 2 / Height * Length ^ 2";
    const expression: DimensionExpression = parser.parseDimensionExpression(expressionString);
    const serialised = serialiseDimensionExpression(expression);
    assertEquals(serialised, "Length * Width ^ 2 / (Height * Length ^ 2)");
});

Deno.test("serialiseDimensionExpression serialises the correct level of precedence and adds parentheses where necessary", () => {
    const expressionString = "Length - Width ^ 2 / (Height * Length ^ 2)";
    const expression: DimensionExpression = parser.parseDimensionExpression(expressionString);
    const serialised = serialiseDimensionExpression(expression);
    assertEquals(serialised, expressionString);
});