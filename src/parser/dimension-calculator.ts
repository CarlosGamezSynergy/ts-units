import type { DimensionDefinition, UnitSpec } from "../types/dimension.ts";
import { cartesianProduct } from "../utils/data.ts";
import { removeWhitespace } from "../utils/string.ts";
import type { DimensionExpression } from "./ast.ts";
import { Interpreter } from "./interpreter.ts";
import Parser from "./parser.ts";
import { extractIdentifiers } from "./reducer.ts";
import serialiseDimensionExpression from "./serialiser.ts";

export type DimensionCalculatorContext = Record<string, DimensionDefinition>;

export class DimensionCalculator {
    private context: DimensionCalculatorContext;

    constructor(context: DimensionCalculatorContext = {}) {
        this.context = context;
    }

    calculateUnitCombinations(expression: DimensionExpression): [string, UnitSpec][][] {
        const identifiers = extractIdentifiers(expression);
        const dimensions = Array.from(identifiers).map((identifier) => {
            const dimension = this.context[identifier];
            if (!dimension) {
                throw new Error(
                    `The identifier "${identifier}" is not a defined dimension in the provided context.`,
                );
            }
            return dimension;
        });

        dimensions.forEach((dim) => {
            for (const unit of Object.entries(dim.units)) {
                if(unit[1].offset !== undefined && unit[1].offset !== 0) {
                    throw new Error(`"Cannot compose unit "${unit[0]}" with a non-zero offset."`);
                }
            }
        });

        const units = dimensions.map((dim) => Object.entries(dim.units));

        return cartesianProduct(units);
    }

    buildComplexUnitSpec(unitCombinations: [string, UnitSpec][][], dimensionExpression: DimensionExpression): Record<string, UnitSpec> {
        const complexUnitSpec: Record<string, UnitSpec> = {};
        const interpreter = new Interpreter();

        for (const combination of unitCombinations) {
            const dimensionToUnitMap = combination.map(([unit]) => [this.findUnitDimensionInContext(unit), unit]).filter(([dimension, _]) => dimension !== undefined) as [string, string][];

            const substitutedUnitExpression = Parser.replaceIdentifiersWithDimensions(dimensionExpression, dimensionToUnitMap) as DimensionExpression;
            const substitutedUnitExpressionString = removeWhitespace(serialiseDimensionExpression(substitutedUnitExpression));
            const interpreterContext: Record<string, number> = {};

            for (const [unit, unitSpec] of combination) {
                interpreterContext[unit] = unitSpec.factor;
            }

            interpreter.assignContext(interpreterContext);

            const combinedFactor = interpreter.evaluateDimensionExpression(substitutedUnitExpression);

            if (combinedFactor === null) {
                throw new Error(`Failed to evaluate the combined factor for the expression: ${substitutedUnitExpressionString}`);
            }

            complexUnitSpec[substitutedUnitExpressionString] = { factor: combinedFactor };
        }

        return complexUnitSpec;
    }

    findUnitDimensionInContext(unit: string): string | undefined {
        for (const [dimensionName, dimensionDef] of Object.entries(this.context)) {
            if (unit in dimensionDef.units) {
                return dimensionName;
            }
        }
        return undefined;
    }

    findFirstUnitSpecWithFactorEqualToOne(unitCombinations: [string, UnitSpec][]): [string, UnitSpec] | undefined {
        for (const [unit, unitSpec] of unitCombinations) {
            if (unitSpec.factor === 1) {
                return [unit, unitSpec];
            }
        }

        return undefined;
    }
}