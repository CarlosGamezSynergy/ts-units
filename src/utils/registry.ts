import { DimensionCalculator } from "../parser/dimension-calculator.ts";
import Parser from "../parser/parser.ts";
import { extractIdentifiers } from "../parser/reducer.ts";
import { Q } from "../quantity.ts";
import type { DefinedDimension, DimensionDefinition, UnitDefinition, UnitMap } from "../types/dimension.ts";

const DIMENSIONS_REGISTRY: Map<string, DimensionDefinition> = new Map();
const UNITS_REGISTRY: Map<string, UnitDefinition> = new Map();

export type DefineDimensionOptions = { overwrite?: boolean };

export type ComplexDimensionExpression = () => string;

/**
 * Registers a new dimension and its units.
 * @param definition The definition of the dimension.
 */
export function defineDimension<const Name extends string, const Units extends UnitMap,>(
  definition: DimensionDefinition<Name, Units>,
  options: DefineDimensionOptions = {},
): DefinedDimension<Name, Units> {
  validateDefinition(definition as unknown as DimensionDefinition, options.overwrite === true);
  if (options.overwrite && DIMENSIONS_REGISTRY.has(definition.name)) {
    for (const [symbol, unit] of UNITS_REGISTRY) {
      if (unit.dimensionName === definition.name) UNITS_REGISTRY.delete(symbol);
    }
  }
  DIMENSIONS_REGISTRY.set(definition.name, definition as unknown as DimensionDefinition);
  for (const [unitSymbol, unitSpec] of Object.entries(definition.units)) {
    UNITS_REGISTRY.set(unitSymbol, {
      symbol: unitSymbol,
      factor: unitSpec.factor,
      offset: unitSpec.offset ?? 0,
      dimensionName: definition.name,
    });
  }

  const quantity = (value: number, unit: keyof Units & string) =>
    new Q(value, unit) as Q<keyof Units & string, { [K in Name]: 1 }, keyof Units & string>;
  return {
    name: definition.name,
    baseUnitSymbol: definition.baseUnitSymbol,
    units: definition.units,
    quantity,
    factory: (unit: keyof Units & string) => (value: number) => quantity(value, unit),
  };
}

/**
 * Registers a dimension whose units are composed from units of existing dimensions.
 * The expression supports dimension names joined by `*`, `/`, `+`, and `-`,
 * with positive integer powers, such as `() => "Length / Time ^ 2"`
 */
export function defineComplexDimension<const Name extends string>(
  name: Name,
  expression: ComplexDimensionExpression,
  options: DefineDimensionOptions = {},
): DefinedDimension<Name, UnitMap> {
  //========= COMPLEX DIMENSION PARSER & INTERPRETER =========

  const dimensionExpressionString = expression();

  // PARSING
  const parser = new Parser();
  const dimensionExpression = parser.parseDimensionExpression(dimensionExpressionString);

  // COMBINE BASE DIMENSIONS INTO A COMPLEX DIMENSION
  // Use the parsed expression to define all possible combinations of units for the complex dimension
  const dimensionsInExpression = extractIdentifiers(dimensionExpression);
  const dimensionsCalculatorContext: Record<string, DimensionDefinition> = {};
  for (const dimensionName of dimensionsInExpression) {
    const dimensionDef = getDimensionDefinition(dimensionName);
    if (!dimensionDef) {
      throw new Error(`Dimension "${dimensionName}" is not defined.`);
    }
    dimensionsCalculatorContext[dimensionName] = dimensionDef;
  }

  const dimensionCalculator = new DimensionCalculator(dimensionsCalculatorContext);
  const unitCombinations = dimensionCalculator.calculateUnitCombinations(dimensionExpression);

  const units = dimensionCalculator.buildComplexUnitSpec(unitCombinations, dimensionExpression);

  //========= COMPLEX DIMENSION DEFINITION =========
  const baseUnitSymbol = dimensionCalculator.findFirstUnitSpecWithFactorEqualToOne(Object.entries(units))?.[0] ?? Object.keys(units)[0];
  const complexDimension = defineDimension({ name, baseUnitSymbol, units }, options);

  return complexDimension;
}

function validateDefinition(definition: DimensionDefinition, overwrite: boolean): void {
  if (!definition.name.trim()) throw new Error("Dimension name must be non-empty.");

  if (DIMENSIONS_REGISTRY.has(definition.name) && !overwrite) {
    throw new Error(`Dimension name "${definition.name}" is already defined and overwrite is not allowed.`);
  }

  if (!definition.baseUnitSymbol.trim()) throw new Error(`Base unit symbol for dimension "${definition.name}" must be non-empty.`);
  if (!(definition.baseUnitSymbol in definition.units)) {
    throw new Error(`Base unit "${definition.baseUnitSymbol}" is not declared for dimension "${definition.name}".`);
  }
  if (DIMENSIONS_REGISTRY.has(definition.name) && !overwrite) {
    throw new Error(`Dimension "${definition.name}" is already defined.`);
  }
  for (const [symbol, unit] of Object.entries(definition.units)) {
    if (!symbol.trim()) throw new Error(`Unit symbol for dimension "${definition.name}" must be non-empty.`);
    if (!Number.isFinite(unit.factor)) throw new Error(`Unit "${symbol}" has a non-finite conversion factor.`);
    if (unit.factor <= 0) throw new Error(`Unit "${symbol}" must have a positive conversion factor.`);
    if (symbol === definition.baseUnitSymbol && (unit.factor !== 1 || (unit.offset ?? 0) !== 0)) {
      throw new Error(`Base unit "${symbol}" for dimension "${definition.name}" must have a conversion factor of 1 and offset of 0.`);
    }
    const existing = UNITS_REGISTRY.get(symbol);
    if (existing && !(overwrite && existing.dimensionName === definition.name)) {
      throw new Error(`Unit symbol "${symbol}" is already registered to dimension "${existing.dimensionName}".`);
    }
  }
}

export function getUnitDefinition(unitSymbol: string): UnitDefinition {
  const unitDef = UNITS_REGISTRY.get(unitSymbol);
  if (!unitDef) {
    throw new Error(`Unit "${unitSymbol}" is not defined.`);
  }
  return unitDef;
}

export function getDimensionDefinition(dimensionName: string): DimensionDefinition {
  const dimDef = DIMENSIONS_REGISTRY.get(dimensionName);
  if (!dimDef) {
    throw new Error(`Dimension "${dimensionName}" is not defined.`);
  }
  return dimDef;
}

export function getAllDimensions(): DimensionDefinition[] {
  return Array.from(DIMENSIONS_REGISTRY.values());
}
