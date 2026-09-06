import { DimensionCalculator } from "./src/parser/dimension-calculator.ts";
import Parser from "./src/parser/parser.ts";
import { extractIdentifiers } from "./src/parser/reducer.ts";
import { DimensionDefinition } from "./src/types/dimension.ts";
import { defineComplexDimension, defineDimension, getDimensionDefinition } from "./src/utils/registry.ts";

// PREREQUISITES: DEFINE BASE DIMENSIONS
defineDimension({
    name: "Length",
    baseUnitSymbol: "m",
    units: {
        m: { factor: 1 },
        cm: { factor: 0.01 },
        mm: { factor: 0.001 },
        km: { factor: 1000 },
        in: { factor: 0.0254 },
        ft: { factor: 0.3048 },
        yd: { factor: 0.9144 },
        mi: { factor: 1609.34 }
    }
});

defineDimension({
    name: "Time",
    baseUnitSymbol: "s",
    units: {
        s: { factor: 1 },
        min: { factor: 60 },
        h: { factor: 3600 },
        d: { factor: 86400 }
    }
});

defineDimension({
    name: "Mass",
    baseUnitSymbol: "kg",
    units: {
        kg: { factor: 1 },
        g: { factor: 0.001 },
        mg: { factor: 0.000001 },
        lb: { factor: 0.453592 },
        oz: { factor: 0.0283495 }
    }
});

console.log("========= COMPLEX DIMENSION PARSER & INTERPRETER =========");
const dimensionExpressionString = "(Mass * Length / Time) ^ 2";
console.log(`Dimension Expression: ${dimensionExpressionString}`);

// PARSING
console.log("\n========= PARSING =========");
const parser = new Parser();
const dimensionExpression = parser.parseDimensionExpression(dimensionExpressionString);
console.dir(dimensionExpression, { depth: null, colors: true });

// COMBINE BASE DIMENSIONS INTO A COMPLEX DIMENSION
console.log("\n========= COMPLEX DIMENSION DEFINITION =========");

// Use the parsed expression to define all possible combinations of units for the complex dimension

const dimensionsInExpression = extractIdentifiers(dimensionExpression);
console.log(`Dimensions in Expression: ${Array.from(dimensionsInExpression).join(", ")}`);

const dimensionsCalculatorContext: Record<string, DimensionDefinition> = {};
for (const dimensionName of dimensionsInExpression) {
    const dimensionDef = getDimensionDefinition(dimensionName);
    if (!dimensionDef) {
        throw new Error(`Dimension "${dimensionName}" is not defined.`);
    }
    dimensionsCalculatorContext[dimensionName] = dimensionDef;
}
console.log("Dimensions Calculator Context:");
console.dir(dimensionsCalculatorContext, { depth: null, colors: true });

const dimensionCalculator = new DimensionCalculator(dimensionsCalculatorContext);
const unitCombinations = dimensionCalculator.calculateUnitCombinations(dimensionExpression);
console.dir(unitCombinations, { depth: null, colors: true });

const complexUnitSpec = dimensionCalculator.buildComplexUnitSpec(unitCombinations, dimensionExpression);
console.log("Complex Unit Specification:");
console.dir(complexUnitSpec, { depth: null, colors: true });

console.log("\n========= COMPLEX DIMENSION DEFINITION =========");
const baseUnitSymbol = dimensionCalculator.findFirstUnitSpecWithFactorEqualToOne(Object.entries(complexUnitSpec))?.[0] ?? Object.keys(complexUnitSpec)[0];
const complexDimension = defineDimension({ name: "ComplexDimension", baseUnitSymbol, units: complexUnitSpec }, { overwrite: true });
console.dir(complexDimension, { depth: null, colors: true });

// // EVALUATION
// console.log("\n========= EVALUATION =========");
// const context: Context = {
//     Mass: 10,
//     Length: 5,
//     Time: 2,
// };
// const interpreter = new Interpreter(context);
// const result = interpreter.evaluate(parsedExpression);
// console.dir(result, { depth: null, colors: true });