import { DimensionCalculator } from "../parser/dimension-calculator.ts";
import Parser from "../parser/parser.ts";
import {
  dimensionExpressionToSignature,
  extractIdentifiers,
} from "../parser/reducer.ts";
import { Q } from "../quantity.ts";
import type {
  DefinedDimension,
  DimensionDefinition,
  UnitDefinition,
  UnitMap,
} from "../types/dimension.ts";
import type { SimpleDimensionSignature } from "../types/signature.ts";
import {
  areSignaturesEquivalent,
  canonicalizeSignature,
  getRawEquivalence,
  registerEquivalence,
} from "./equivalence.ts";

const DIMENSIONS_REGISTRY: Map<string, DimensionDefinition> = new Map();
const UNITS_REGISTRY: Map<string, UnitDefinition> = new Map();
export type DefineDimensionOptions = { overwrite?: boolean };
export type ComplexDimensionExpression = () => string;

export function addQuantityAndFactoryToDefinition<
  const Name extends string,
  const Units extends UnitMap,
>(
  definition: DimensionDefinition<Name, Units>,
): DefinedDimension<Name, Units> {
  type Unit = keyof Units & string;

  const quantity = (value: number, unit: Unit) =>
    new Q<Unit, SimpleDimensionSignature<Name>, Unit>(value, unit);

  const factory = (unit: Unit) => (value: number) => quantity(value, unit);

  return {
    ...definition,
    quantity,
    factory,
  };
}

/**
 * Registers a new dimension and its units.
 * @param definition The definition of the dimension.
 */
export function defineDimension<
  const Name extends string,
  const Units extends UnitMap,
>(
  definition: DimensionDefinition<Name, Units>,
  options: DefineDimensionOptions = {},
): DefinedDimension<Name, Units> {
  validateDefinition(
    definition as unknown as DimensionDefinition,
    options.overwrite === true,
  );

  if (options.overwrite && DIMENSIONS_REGISTRY.has(definition.name)) {
    for (const [symbol, unit] of UNITS_REGISTRY) {
      if (unit.dimensionName === definition.name) UNITS_REGISTRY.delete(symbol);
    }
  }

  DIMENSIONS_REGISTRY.set(
    definition.name,
    definition as unknown as DimensionDefinition,
  );

  for (const [unitSymbol, unitSpec] of Object.entries(definition.units)) {
    UNITS_REGISTRY.set(unitSymbol, {
      symbol: unitSymbol,
      factor: unitSpec.factor,
      offset: unitSpec.offset ?? 0,
      dimensionName: definition.name,
    });
  }

  return addQuantityAndFactoryToDefinition(definition);
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
  const dimensionExpression = parser.parseDimensionExpression(
    dimensionExpressionString,
  );

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

  const dimensionCalculator = new DimensionCalculator(
    dimensionsCalculatorContext,
  );
  const unitCombinations = dimensionCalculator.calculateUnitCombinations(
    dimensionExpression,
  );

  const units = dimensionCalculator.buildComplexUnitSpec(
    unitCombinations,
    dimensionExpression,
  );

  //========= COMPLEX DIMENSION DEFINITION =========
  const baseUnitSymbol =
    dimensionCalculator.findFirstUnitSpecWithFactorEqualToOne(
      Object.entries(units),
    )?.[0] ?? Object.keys(units)[0];

  const complexDimension = defineDimension(
    { name, baseUnitSymbol, units },
    options,
  );


  // Remember how this dimension was derived so that equivalence resolution
  // (see `defineEquivalence`) can transparently unify it with other dimensions
  // that reduce to the same canonical signature, even transitively.
  const { signature, coefficient } = dimensionExpressionToSignature(
    dimensionExpression,
  );
  if (coefficient !== 1) {
    throw new Error(
      `Complex dimension "${name}" expression must not include a numeric coefficient (found ${coefficient}).`,
    );
  }
  registerEquivalence(name, signature);

  return complexDimension;
}

/**
 * Declares that a dimension (typically one previously defined with
 * `defineDimension`) is equivalent to a combination of other dimensions,
 * such as `defineEquivalence("Force", () => "Mass * Length / Time ^ 2")`.
 *
 * Equivalences are symmetric and transitive: once declared, quantities of
 * `name` and quantities of the expanded expression (and anything else that
 * transitively reduces to the same canonical signature) can be freely
 * combined, compared, and converted between.
 *
 * The expression must reduce to a pure combination of dimension identifiers
 * (no numeric coefficient), and must not create a contradiction with any
 * equivalence already registered for `name` or the dimensions it references.
 */
export function defineEquivalence<const Name extends string>(
  name: Name,
  expression: ComplexDimensionExpression,
): void {
  // Ensures `name` itself is a known dimension before relating it to others.
  getDimensionDefinition(name);

  const dimensionExpressionString = expression();
  const parser = new Parser();
  const dimensionExpression = parser.parseDimensionExpression(
    dimensionExpressionString,
  );

  const dimensionsInExpression = extractIdentifiers(dimensionExpression);
  for (const dimensionName of dimensionsInExpression) {
    getDimensionDefinition(dimensionName); // Throws if not defined.
  }

  const { signature, coefficient } = dimensionExpressionToSignature(
    dimensionExpression,
  );
  if (coefficient !== 1) {
    throw new Error(
      `Equivalence expression for "${name}" must not include a numeric coefficient (found ${coefficient}).`,
    );
  }

  // If `name` already has a registered equivalence, verify the new expression
  // resolves to the exact same canonical dimension before accepting it -
  // this catches contradictory/mismatched-scale declarations.
  const existingRawEquivalence = getRawEquivalence(name);
  if (existingRawEquivalence !== undefined) {
    const existingCanonical = canonicalizeSignature(existingRawEquivalence);
    const newCanonical = canonicalizeSignature(signature);
    if (!areSignaturesEquivalent(existingCanonical, newCanonical)) {
      throw new Error(
        `Equivalence for "${name}" ("${dimensionExpressionString}") is inconsistent with its existing equivalence.`,
      );
    }
  }

  registerEquivalence(name, signature);

  // Re-validate that no circular/contradictory equivalence was introduced.
  canonicalizeSignature({ [name]: 1 });
}

function validateDefinition(
  definition: DimensionDefinition,
  overwrite: boolean,
): void {
  if (!definition.name.trim()) {
    throw new Error("Dimension name must be non-empty.");
  }

  if (DIMENSIONS_REGISTRY.has(definition.name) && !overwrite) {
    throw new Error(
      `Dimension name "${definition.name}" is already defined and overwrite is not allowed.`,
    );
  }

  if (!definition.baseUnitSymbol.trim()) {
    throw new Error(
      `Base unit symbol for dimension "${definition.name}" must be non-empty.`,
    );
  }
  if (!(definition.baseUnitSymbol in definition.units)) {
    throw new Error(
      `Base unit "${definition.baseUnitSymbol}" is not declared for dimension "${definition.name}".`,
    );
  }
  if (DIMENSIONS_REGISTRY.has(definition.name) && !overwrite) {
    throw new Error(`Dimension "${definition.name}" is already defined.`);
  }
  for (const [symbol, unit] of Object.entries(definition.units)) {
    if (!symbol.trim()) {
      throw new Error(
        `Unit symbol for dimension "${definition.name}" must be non-empty.`,
      );
    }
    if (!Number.isFinite(unit.factor)) {
      throw new Error(`Unit "${symbol}" has a non-finite conversion factor.`);
    }
    if (unit.factor <= 0) {
      throw new Error(
        `Unit "${symbol}" must have a positive conversion factor.`,
      );
    }
    if (
      symbol === definition.baseUnitSymbol &&
      (unit.factor !== 1 || (unit.offset ?? 0) !== 0)
    ) {
      throw new Error(
        `Base unit "${symbol}" for dimension "${definition.name}" must have a conversion factor of 1 and offset of 0.`,
      );
    }
    const existing = UNITS_REGISTRY.get(symbol);
    if (
      existing && !(overwrite && existing.dimensionName === definition.name)
    ) {
      throw new Error(
        `Unit symbol "${symbol}" is already registered to dimension "${existing.dimensionName}".`,
      );
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

export function getDimensionDefinition(dimensionName: string) {
  const dimDef = DIMENSIONS_REGISTRY.get(dimensionName);
  if (!dimDef) {
    throw new Error(`Dimension "${dimensionName}" is not defined.`);
  }

  return addQuantityAndFactoryToDefinition(dimDef);
}

export function getAllDimensions(): DimensionDefinition[] {
  return Array.from(DIMENSIONS_REGISTRY.values());
}
