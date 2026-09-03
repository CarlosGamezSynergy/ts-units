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
export function defineDimension<
  const Name extends string,
  const Units extends UnitMap,
>(
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
  const components = parseComplexExpression(expression());
  const dimensions = components.map(({ name: dimensionName }) => getDimensionDefinition(dimensionName));
  const units: UnitMap = {};

  const addUnits = (index: number, symbolParts: string[], factor: number): void => {
    if (index === dimensions.length) {
      units[formatComplexUnitSymbol(symbolParts, components)] = { factor };
      return;
    }

    const component = components[index];
    for (const [symbol, unit] of Object.entries(dimensions[index].units)) {
      if ((unit.offset ?? 0) !== 0) {
        throw new Error(`Cannot compose unit "${symbol}" with a non-zero offset.`);
      }
      addUnits(
        index + 1,
        [...symbolParts, unitSymbolWithExponent(symbol, component.exponent)],
        isNumerator(component)
          ? factor * unit.factor ** component.exponent
          : factor / unit.factor ** component.exponent,
      );
    }
  };

  addUnits(0, [], 1);

  const baseUnitSymbol = formatComplexUnitSymbol(
    components.map((component) => unitSymbolWithExponent(
      getDimensionDefinition(component.name).baseUnitSymbol,
      component.exponent,
    )),
    components,
  );

  return defineDimension({ name, baseUnitSymbol, units }, options);
}

type ComplexExpressionComponent = {
  name: string;
  operator: "*" | "/";
  exponent: number;
};

function parseComplexExpression(expression: string): ComplexExpressionComponent[] {
  const tokens = expression.match(/[A-Za-z_$][\w$]*|\d+|[+\-*/^]/g) ?? [];
  if (!expression.trim() || tokens.join("") !== expression.replace(/\s+/g, "")) {
    throw new Error(`Invalid complex dimension expression "${expression}".`);
  }
  if (tokens.length === 0) {
    throw new Error(`Invalid complex dimension expression "${expression}".`);
  }

  const components: ComplexExpressionComponent[] = [];
  let index = 0;
  let operator: ComplexExpressionComponent["operator"] = "*";
  while (index < tokens.length) {
    const name = tokens[index++];
    if (!name || !/^[A-Za-z_$]/.test(name)) {
      throw new Error(`Invalid complex dimension expression "${expression}".`);
    }
    let exponent = 1;
    if (tokens[index] === "^") {
      const exponentToken = tokens[index + 1];
      exponent = Number(exponentToken);
      if (!Number.isSafeInteger(exponent) || exponent < 1) {
        throw new Error(`Complex dimension exponents must be positive integers.`);
      }
      index += 2;
    }
    components.push({ name, operator, exponent });
    if (index === tokens.length) break;
    const nextOperator = tokens[index++];
    if (nextOperator !== "*" && nextOperator !== "/") {
      throw new Error(`Invalid complex dimension expression "${expression}".`);
    }
    operator = nextOperator;
  }

  return components;
}

function isNumerator(component: ComplexExpressionComponent): boolean {
  return component.operator === "*";
}

function unitSymbolWithExponent(symbol: string, exponent: number): string {
  return exponent === 1 ? symbol : `${symbol}^${exponent}`;
}

function formatComplexUnitSymbol(
  symbolParts: string[],
  components: ComplexExpressionComponent[],
): string {
  const numerator = symbolParts.filter((_, index) => isNumerator(components[index]));
  const denominator = symbolParts.filter((_, index) => !isNumerator(components[index]));
  return denominator.length === 0
    ? numerator.join("*")
    : `${numerator.join("*") || "1"}/${denominator.join("*")}`;
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

// For accessing the registry deeply if needed (e.g. for listing all dimensions)
export function getAllDimensions(): DimensionDefinition[] {
  return Array.from(DIMENSIONS_REGISTRY.values());
}
