# ts-units API reference

This document describes the implementation and the contracts that matter when building an application with `ts-units`. The package is a registry-driven engine: it supplies dimensional behavior, while the application supplies dimensions, units, symbols, and conversion factors.

## 1. Package boundary

Importing `@eng-tools/ts-units` registers nothing. `getAllDimensions()` starts empty, and `new Q(1, "m")` fails until some definition registers `m`. There are no built-in SI dimensions, aliases, unit factories, or reserved dimension names. The application should register its catalog once during startup.

The README contains a guided introduction. This file focuses on signatures, runtime rules, and edge cases.

## 2. Registering simple dimensions

```typescript
import { defineDimension } from "@eng-tools/ts-units";

const Length = defineDimension({
  name: "Length",
  baseUnitSymbol: "m",
  units: {
    m: { factor: 1 },
    km: { factor: 1000 },
    cm: { factor: 0.01 },
  },
} as const);

const distance = Length.quantity(5, "km");
const meters = distance.convertTo("m");
const localMeters = Length.factory("m");

console.log(meters.value); // 5000
console.log(localMeters(12).unitSymbol); // "m"
```

The definition shape is:

```typescript
type UnitSpec = {
  factor: number;
  offset?: number;
};

type DimensionDefinition<Name extends string, Units extends UnitMap> = {
  name: Name;
  baseUnitSymbol: keyof Units & string;
  units: Units;
};
```

The returned `DefinedDimension<Name, Units>` exposes `name`, `baseUnitSymbol`, `units`, `quantity(value, unit)`, and `factory(unit)`. Use `as const` on the definition when the unit names should remain literal types. The unit union then flows through `quantity`, `factory`, and `convertTo`:

```typescript
const centimeters = Length.quantity(25, "cm");
const inMeters = centimeters.convertTo("m");

// Compile-time errors:
// Length.quantity(25, "yards");
// centimeters.convertTo("s");
```

### Validation and replacement

Validation runs before registry mutation. Names and symbols must be non-empty, factors must be finite and positive, and the base unit must be declared with factor `1` and offset `0` or omitted. Dimension names and unit symbols are unique by default. `{ overwrite: true }` replaces a dimension and removes its previous units:

```typescript
const RevisedLength = defineDimension({
  name: "Length",
  baseUnitSymbol: "m",
  units: {
    m: { factor: 1 },
    mm: { factor: 0.001 },
  },
} as const, { overwrite: true });

console.log(RevisedLength.quantity(1, "m").convertTo("mm").value); // 1000
```

Definitions expose their original unit objects and are not frozen at runtime. Mutating them can make an inspected definition differ from the already registered unit lookup; treat them as immutable configuration.

## 3. Complex dimensions

```typescript
const Time = defineDimension({
  name: "Time",
  baseUnitSymbol: "s",
  units: {
    s: { factor: 1 },
    min: { factor: 60 },
    h: { factor: 3600 },
  },
} as const);

const Speed = defineComplexDimension("Speed", () => "Length / Time");
const Area = defineComplexDimension("Area", () => "Length ^ 2");
const Acceleration = defineComplexDimension(
  "Acceleration",
  () => "Length / Time ^ 2",
);

console.log(Speed.quantity(10, "m/s").convertTo("cm/h").value);
console.log(Area.quantity(2, "m^2").convertTo("cm^2").value);
console.log(Acceleration.quantity(1, "m/s^2").convertTo("cm/min^2").value);
```

The expression is evaluated against dimensions that already exist. Supported syntax is an identifier, followed by zero or more `*` or `/` operators, with an optional positive integer exponent after each identifier:

```text
Length
Length * Time
Length / Time
Length / Time ^ 2
$CustomDimension * Length ^ 3
```

The parser does not support `+` or `-`, despite an outdated comment in the implementation. Negative and zero exponents are also rejected. Every combination of component units is generated. For example, `Length / Time` generates `m/s`, `m/min`, `cm/s`, and `cm/min`, with factors calculated relative to `m/s`.

The generated base symbol uses the base unit of every component. Composite symbols use `*` between numerator terms, `/` before denominator terms, and `^N` for powers. A complex dimension cannot include a unit with a non-zero offset; defining `Length * Temperature` fails if `Temperature` includes Celsius.

## 4. Quantity interface and operations

```typescript
interface Quantity<DS extends DimensionSignature, Units extends string = string> {
  readonly _dimensionSignature: DS;
  readonly _valueInBaseUnits: number;
  value: number;
  unitSymbol: string;
  add<OtherUnits extends string>(other: Quantity<DS, OtherUnits>): Quantity<DS, Units>;
  subtract<OtherUnits extends string>(other: Quantity<DS, OtherUnits>): Quantity<DS, Units>;
  multiply<OtherDS extends DimensionSignature, OtherUnits extends string>(
    other: Quantity<OtherDS, OtherUnits>,
  ): Quantity<CombineDimensionSignatures<DS, OtherDS>, string>;
  divide<OtherDS extends DimensionSignature, OtherUnits extends string>(
    other: Quantity<OtherDS, OtherUnits>,
  ): Quantity<DivideDimensionSignatures<DS, OtherDS>, string>;
  convertTo<TargetUnit extends Units>(targetUnitSymbol: TargetUnit): Quantity<DS, TargetUnit>;
  equals(other: Quantity<DS, string>): boolean;
  isLessThan(other: Quantity<DS, string>): boolean;
  isGreaterThan(other: Quantity<DS, string>): boolean;
  valueOf(): number;
  toString(): string;
  toJSON(): { value: number; unit: string };
}
```

### Addition and subtraction

The receiver controls the result unit. Both values are converted through base units before the operation:

```typescript
const oneMeter = Length.quantity(1, "m");
const oneHundredCentimeters = Length.quantity(100, "cm");

const sum = oneMeter.add(oneHundredCentimeters);
const difference = oneMeter.subtract(oneHundredCentimeters);

console.log(sum.value, sum.unitSymbol); // 2, "m"
console.log(difference.value); // 0
```

Different runtime signatures throw an error such as `Dimension mismatch: cannot add Time^1 to Length^1`.

### Multiplication and division

```typescript
const rectangle = Length.quantity(4, "m").multiply(Length.quantity(3, "m"));
console.log(rectangle.value, rectangle.unitSymbol); // 12, "m^2"

const speed = Length.quantity(120, "m").divide(Time.quantity(10, "s"));
console.log(speed.value, speed.unitSymbol); // 12, "m/s"

const ratio = Length.quantity(1, "m").divide(Length.quantity(100, "cm"));
console.log(ratio.value, ratio.unitSymbol); // 1, "dimensionless"
```

Runtime signatures add exponents for multiplication and subtract them for division, removing dimensions whose exponent becomes zero. Division by a zero base-unit value throws `Division by zero`. Composite operation results have `string` as their unit set because their symbols are generated at runtime.

### Conversion and comparison

```typescript
const distance = Length.quantity(1, "m");
console.log(distance.convertTo("cm").value); // 100

const sameDistance = Length.quantity(100, "cm");
console.log(distance.equals(sameDistance)); // true
console.log(distance.isLessThan(Length.quantity(2, "m"))); // true
console.log(distance.isGreaterThan(sameDistance)); // false
```

`convertTo` requires a registered unit from the same runtime dimension. `equals` returns `false` for different dimensions and uses an absolute base-value tolerance of `1e-9`. Ordering methods throw `Dimension mismatch` for different dimensions.

## 5. Affine units

```typescript
const Temperature = defineDimension({
  name: "Temperature",
  baseUnitSymbol: "K",
  units: {
    K: { factor: 1 },
    C: { factor: 1, offset: 273.15 },
  },
} as const);

const room = Temperature.quantity(20, "C");
console.log(room.convertTo("K").value); // 293.15
```

The stored base value is `value * factor + offset`. Arithmetic does not distinguish absolute values from differences, so callers must choose the intended semantics for temperature subtraction and addition. Non-zero-offset units cannot be used when generating a complex dimension.

## 6. Serialization and interop

```typescript
const original = Length.quantity(1.5, "km");
const serialized = original.toJSON();
// { value: 1.5, unit: "km" }

const restored = Length.quantity(
  serialized.value,
  serialized.unit as keyof typeof Length.units,
);

console.log(String(restored)); // "1.50000 km"
console.log(Number(restored)); // 1.5
```

`valueOf()` returns the value in the current unit, not the base unit. `toString()` uses `toPrecision(6)`. `toJSON()` returns `{ value: number, unit: string }`; validate external unit strings before passing them to a dimension's typed `quantity` helper.

## 7. Registry introspection

```typescript
import {
  getAllDimensions,
  getDimensionDefinition,
  getUnitDefinition,
} from "@eng-tools/ts-units";

const names = getAllDimensions().map(({ name }) => name);
const lengthDefinition = getDimensionDefinition("Length");
const centimeter = getUnitDefinition("cm");

console.log(names);
console.log(lengthDefinition.baseUnitSymbol); // "m"
console.log(centimeter);
// { symbol: "cm", factor: 0.01, offset: 0, dimensionName: "Length" }
```

Missing lookups throw `Dimension "..." is not defined.` or `Unit "..." is not defined.`. `getAllDimensions()` returns only explicitly registered definitions.

## 8. `Q` and signature types

`Q` is the exported concrete implementation and accepts a value plus a registered symbol:

```typescript
import { Q } from "@eng-tools/ts-units";

const rawQuantity = new Q(12, "m");
console.log(rawQuantity.value, rawQuantity.unitSymbol);
```

Direct construction validates the symbol at runtime, but it cannot infer the same precise dimension and unit unions as a `DefinedDimension` helper. Prefer `Length.quantity` in application code.

The exported signature types describe dimensional exponents without a fixed SI list:

```typescript
import type {
  DimensionSignature,
  SimpleDimensionSignature,
  CombineDimensionSignatures,
  DivideDimensionSignatures,
  DimensionUnitSymbols,
} from "@eng-tools/ts-units";

type LengthSignature = SimpleDimensionSignature<"Length">;
type AreaSignature = CombineDimensionSignatures<
  { Length: 1 },
  { Length: 1 }
>; // { Length: 2 }
type SpeedSignature = DivideDimensionSignatures<
  { Length: 1 },
  { Time: 1 }
>; // { Length: 1; Time: -1 }
type Unit = DimensionUnitSymbols<typeof Length>;
const signature: DimensionSignature = { Length: 1 };
```

`CombineDimensionSignatures` adds exponents and `DivideDimensionSignatures` subtracts them. Runtime signatures remove zero exponents. Type-level arithmetic is designed for small dimensional exponents, not arbitrary numeric computation. `AllowedUnit` is deprecated and resolves to `never`; a signature alone cannot identify an application's custom unit-symbol set.

## 9. Exported functions and types

Runtime exports from the package entry point:

```typescript
import {
  Q,
  defineDimension,
  defineComplexDimension,
  getAllDimensions,
  getDimensionDefinition,
  getUnitDefinition,
} from "@eng-tools/ts-units";
```

The entry point also exports `Quantity` as a type, all types from `types/signature.ts`, and these dimension types: `DefinedDimension`, `DimensionDefinition`, `DimensionUnitSymbols`, `UnitDefinition`, `UnitMap`, and `UnitSpec`.

The public `Q` class also exposes static runtime helpers for signature comparison, combination, division, composite-symbol derivation, and construction from a base-unit value. They are useful for infrastructure code, but normal application code should use registered dimension helpers and quantity instance methods.

## 10. Error reference

Common validation and operation failures include:

```text
Dimension name must be non-empty.
Base unit "kg" is not declared for dimension "Mass".
Base unit "m" for dimension "Length" must have a conversion factor of 1 and offset of 0.
Unit "m" is not defined.
Unit symbol "m" is already registered to dimension "Length".
Dimension "Unknown" is not defined.
Invalid complex dimension expression "Length + Time".
Complex dimension exponents must be positive integers.
Cannot compose unit "C" with a non-zero offset.
Division by zero
```

Exact addition and subtraction mismatch messages include the two signatures; comparison mismatch messages use the shorter `Dimension mismatch` form. Definitions are validated before mutation, so a failed registration does not partially add its units.
