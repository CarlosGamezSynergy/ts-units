import { assertEquals } from "@std/assert";
import type {
    DimensionExpression
} from "./ast.ts";
import Parser from "./parser.ts";
import reduceDimensionExpression from "./reducer.ts";

const parser = new Parser();

Deno.test("reduceDimensionExpression correctly processes empty expression", () => {
    const expression: DimensionExpression = {
        kind: "DimensionExpression",
        body: []
    };
    const reduced = reduceDimensionExpression(expression);
    assertEquals(reduced.body, expression.body);
});

Deno.test("reduceDimensionExpression correctly processes expression with binary operations", () => {
    const expression: DimensionExpression = parser.parseDimensionExpression("Length * Width ^ 2");
    const reduced = reduceDimensionExpression(expression);
    assertEquals(reduced.body, expression.body);
});

Deno.test("reducedDimensionExpression correctly reduces a complex expression", () => {
    const expression: DimensionExpression = parser.parseDimensionExpression("(Height ^ 4) * (Length * Width ^ 2 / Height * Length ^ 2)");
    const reduced = reduceDimensionExpression(expression);
    const reducedShouldBe = parser.parseDimensionExpression("Height ^ 3 * Width ^ 2 / Length");

    assertEquals(reduced.body, reducedShouldBe.body);
});