# API Documentation

## Package Boundary

The package is an engine only. Importing `@eng-tools/ts-units` has no registry side effects: no dimensions or units exist until the consumer calls `defineDimension`. Standard factories such as `m`, `kg`, and `s`, standard dimension aliases, and a default catalog are not part of the public API.

## `defineDimension`

```typescript
function defineDimension<Name extends string, Units extends UnitMap>(
  definition: DimensionDefinition<Name, Units>,
  options?: { overwrite?: boolean },
): DefinedDimension<Name, Units>;
```

A definition contains a name, a base-unit symbol, and a map of unit specifications:

```typescript
const Length = defineDimension({
  name: "Length",
  baseUnitSymbol: "m",
  units: { m: { factor: 1 }, km: { factor: 1000 } },
} as const);

const distance = Length.quantity(5, "km");
const meters = distance.convertTo("m");
const localMeters = Length.factory("m");
```

`DefinedDimension` exposes `name`, `baseUnitSymbol`, `units`, `quantity(value, unit)`, and `factory(unit)`. Literal unit keys are retained in the returned quantity type.

Definitions are validated before either registry is changed. Names and symbols must be non-empty. Factors must be finite and positive. The base unit must be declared with factor `1` and offset `0` or omitted. Duplicate dimension names and unit symbols are rejected. `{ overwrite: true }` explicitly replaces a dimension and removes its previous units first. The built-in names `Length`, `Mass`, `Time`, `Temperature`, `ElectricCurrent`, `AmountOfSubstance`, and `LuminousIntensity` are reserved.

## `Quantity<DS, Units>`

```typescript
interface Quantity<DS extends DimensionSignature, Units extends string = string> {
  value: number;
  unitSymbol: string;
  add<OtherUnits extends string>(other: Quantity<DS, OtherUnits>): Quantity<DS, Units>;
  subtract<OtherUnits extends string>(other: Quantity<DS, OtherUnits>): Quantity<DS, Units>;
  convertTo<TargetUnit extends Units>(targetUnitSymbol: TargetUnit): Quantity<DS, TargetUnit>;
  multiply<OtherDS extends DimensionSignature, OtherUnits extends string>(other: Quantity<OtherDS, OtherUnits>): Quantity<CombineDimensionSignatures<DS, OtherDS>, string>;
  divide<OtherDS extends DimensionSignature, OtherUnits extends string>(other: Quantity<OtherDS, OtherUnits>): Quantity<DivideDimensionSignatures<DS, OtherDS>, string>;
}
```

The dimension signature controls compatibility; the second generic controls the valid simple-unit symbols. Composite symbols are generated at runtime, so multiplication and division return `string` for their unit set. Custom dimension names remain keys in the resulting signatures.

## `Q`

`Q` is the low-level concrete implementation:

```typescript
new Q(value: number, unitSymbol: string);
```

Construction always looks up the symbol in the registry. For example, `new Q(1, "m")` throws until a caller registers a dimension containing `m`. The class also provides value conversion, comparisons, serialization, and runtime dimensional checks.

## Registry Introspection

`getAllDimensions()` returns the explicitly registered definitions. `getDimensionDefinition(name)` and `getUnitDefinition(symbol)` throw when the requested entry is absent. These functions are useful for diagnostics and application-controlled tooling.

## Affine Units

A unit's base value is calculated as `value * factor + offset`. This supports custom temperature-like units. The engine intentionally does not distinguish absolute quantities from differences during arithmetic.

## Signature Utilities

`DimensionSignature`, `SimpleDimensionSignature`, `CombineDimensionSignatures`, and `DivideDimensionSignatures` are generic over string dimension names. They do not contain a fixed SI dimension list. `DimensionUnitSymbols<Definition>` extracts the declared unit-symbol union from a dimension definition. The old signature-only `AllowedUnit` helper is deprecated because a signature alone cannot identify a custom unit set.
