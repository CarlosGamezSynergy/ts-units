import { assertEquals, assertThrows } from "@std/assert";
import { Interpreter, type Context } from "./interpreter.ts";
import Parser from "./parser.ts";

const parser = new Parser();

Deno.test("Interpreter evaluates a simple dimension expression", () => {
  const dimensionExpression = "(Mass * Length / Time) ^ 2";
  const parsedExpression = parser.parseDimensionExpression(dimensionExpression);
  const context: Context = {
    Mass: 10,
    Length: 5,
    Time: 2,
  };

  const interpreter = new Interpreter(context);
  const result = interpreter.evaluate(parsedExpression);

  assertEquals(result, 625);
});

Deno.test("Interpreter evaluates a complex dimension expression", () => {
  const dimensionExpression = "((Mass * Length) / Time) ^ 2";
  const parsedExpression = parser.parseDimensionExpression(dimensionExpression);
  const context: Context = {
    Mass: 10,
    Length: 5,
    Time: 2,
  };

  const interpreter = new Interpreter(context);
  const result = interpreter.evaluate(parsedExpression);

  assertEquals(result, 625);
});

Deno.test("Interpreter evaluates a dimension expression with missing identifiers", () => {
  const dimensionExpression = "(Mass * Length / Time) ^ 2";
  const parsedExpression = parser.parseDimensionExpression(dimensionExpression);
  const context: Context = {
    Mass: 10,
    Length: 5,
    // Time is missing
  };

  const interpreter = new Interpreter(context);

  assertThrows(() => {
    interpreter.evaluate(parsedExpression);
  }, Error, 'The expression "(Mass * Length / Time) ^ 2" is missing these variables: "Time" to be evaluated. Please provide them in the context.');
});

Deno.test("Interpreter evaluates a dimension expression with non-numeric identifier", () => {
  const dimensionExpression = "(Mass * Length / Time) ^ 2";
  const parsedExpression = parser.parseDimensionExpression(dimensionExpression);
  const context: Context = {
    Mass: 10,
    Length: 5,
    Time: "not a number", // Non-numeric value
  };

  const interpreter = new Interpreter(context);

  assertThrows(() => {
    interpreter.evaluate(parsedExpression);
  }, Error, 'The identifier "Time" is not a number in the provided context.');
});
