# ts-units

`ts-units` is a small TypeScript engine for unit conversion and dimensional arithmetic. It helps an application prevent accidental operations such as adding a distance to a duration, while still allowing the application to define the vocabulary it actually needs.

The library deliberately has **no built-in units**. There is no implicit SI catalog and importing the package does not change global state. Your application registers dimensions and units, then receives typed quantity factories for that catalog. This makes custom domains, symbols, and conversion systems possible without pretending that every project uses the same units.

## Quick start

```typescript
import { defineDimension } from "@eng-tools/ts-units";

const Length = defineDimension({
  name: "Length",
  baseUnitSymbol: "m",
  units: {
    m: { factor: 1 },
    km: { factor: 1_000 },
    cm: { factor: 0.01 },
  },
} as const);

const distance = Length.quantity(5, "km");
const meters = distance.convertTo("m");

console.log(meters.value);      // 5000
console.log(meters.unitSymbol); // "m"
console.log(meters.toString()); // "5000.00 m"
```

The `as const` assertion preserves the unit keys as the literal type `"m" | "km" | "cm"`. Consequently, `Length.quantity(1, "yards")` and `distance.convertTo("seconds")` are rejected by TypeScript, as well as being invalid at runtime if a value reaches the API dynamically.

## Installation and runtime

The repository is configured as a Deno module:

```bash
deno add jsr:@eng-tools/ts-units
```

For a local checkout, the package tasks are:

```bash
deno task test
deno task build_npm
```

The package also publishes an npm-compatible build. Use the package name shown in `deno.json` when installing a published release:

```bash
npm install @eng-tools/ts-units
```

## The core model

There are three related concepts:

- A **dimension** is a physical or domain quantity such as `Length` or `Time`.
- A **unit** belongs to one dimension and has a positive conversion factor relative to that dimension's base unit.
- A **quantity** is a number paired with a unit, such as `5 km`.

For a unit with factor `f` and offset `o`, the engine stores its base-unit value as:

```text
baseValue = value * f + o
```

Addition, subtraction, multiplication, division, comparisons, and equality use those stored base-unit values. Simple conversions return the result in the receiver's requested unit.

## Register a dimension

```typescript
const Time = defineDimension({
  name: "Time",
  baseUnitSymbol: "s",
  units: {
    s: { factor: 1 },
    ms: { factor: 0.001 },
    min: { factor: 60 },
    h: { factor: 3_600 },
  },
} as const);

const elapsed = Time.quantity(2, "min");
console.log(elapsed.convertTo("s").value); // 120
```

The base unit must be included in `units`, have a factor of `1`, and have no offset. Every other factor must be finite and greater than zero. Dimension names and unit symbols must be non-empty.

### Factories

`factory` is useful when one unit is used repeatedly in a domain API:

```typescript
const meters = Length.factory("m");
const start = meters(12);
const end = meters(18);
const traveled = end.subtract(start);

console.log(traveled.value); // 6
```

The returned dimension object also exposes `name`, `baseUnitSymbol`, and the original `units` map.

### Overwriting a definition

Duplicate dimension names and unit symbols are rejected by default. An explicit overwrite replaces a dimension and removes its old units from the global registry first:

```typescript
const UpdatedLength = defineDimension({
  name: "Length",
  baseUnitSymbol: "m",
  units: {
    m: { factor: 1 },
    mm: { factor: 0.001 },
  },
} as const, { overwrite: true });

console.log(UpdatedLength.quantity(1, "m").convertTo("mm").value); // 1000
```

Use overwriting deliberately: quantities created before the replacement retain their existing values and signatures, while the global unit lookup now reflects the replacement definition.

## Derived dimensions

`defineComplexDimension` builds a new dimension from dimensions already registered. The expression syntax supports identifiers, `*`, `/`, whitespace, and positive integer powers:

```typescript
const Speed = defineComplexDimension("Speed", () => "Length / Time");
const Area = defineComplexDimension("Area", () => "Length ^ 2");
const Acceleration = defineComplexDimension(
  "Acceleration",
  () => "Length / Time ^ 2",
);

const speed = Speed.quantity(10, "m/s");
console.log(speed.convertTo("km/h").value); // 36

const area = Area.quantity(2, "m^2");
console.log(area.convertTo("cm^2").value); // 20000

const acceleration = Acceleration.quantity(1, "m/s^2");
console.log(acceleration.convertTo("cm/min^2").value); // 360000
```

The derived definition contains every combination of component units. For `Length / Time`, symbols include `m/s`, `m/min`, `cm/s`, and `cm/min`; the generated base unit is `m/s`. Factors are calculated from the component factors, so `1 m/s` converts to `3.6 km/h` when those units exist.

Only `*` and `/` are supported as operators. Despite an old source comment, `+` and `-` are not valid complex-dimension operators. Exponents must be positive safe integers. Component dimensions must already exist, and a complex dimension cannot include a unit with a non-zero offset.

## Arithmetic

### Add and subtract compatible quantities

Operands can use different units from the same dimension. The result uses the receiver's unit:

```typescript
const oneMeter = Length.quantity(1, "m");
const oneHundredCentimeters = Length.quantity(100, "cm");

const total = oneMeter.add(oneHundredCentimeters);
const difference = oneMeter.subtract(oneHundredCentimeters);

console.log(total.value, total.unitSymbol);           // 2, "m"
console.log(difference.value, difference.unitSymbol); // 0, "m"
```

Adding or subtracting different dimensions throws a dimension mismatch error at runtime, and the quantity type prevents normal statically typed calls from mixing incompatible signatures.

### Multiply and divide

Multiplication adds dimension exponents; division subtracts them:

```typescript
const width = Length.quantity(4, "m");
const height = Length.quantity(3, "m");
const rectangleArea = width.multiply(height);

console.log(rectangleArea.value);      // 12
console.log(rectangleArea.unitSymbol); // "m^2"

const distance = Length.quantity(120, "m");
const duration = Time.quantity(10, "s");
const velocity = distance.divide(duration);

console.log(velocity.value);      // 12
console.log(velocity.unitSymbol); // "m/s"
```

Dividing two quantities with the same dimension can produce the unit symbol `dimensionless`:

```typescript
const ratio = Length.quantity(1, "m").divide(Length.quantity(100, "cm"));
console.log(ratio.value, ratio.unitSymbol); // 1, "dimensionless"
```

Division by a quantity whose base-unit value is zero throws `Division by zero`. Composite results use generated symbols based on registered base units and are not registered as new definitions automatically.

## Compare quantities

```typescript
const first = Length.quantity(1, "m");
const second = Length.quantity(100, "cm");
const third = Length.quantity(2, "m");

console.log(first.equals(second));       // true
console.log(first.equals(third));        // false
console.log(first.isLessThan(third));    // true
console.log(third.isGreaterThan(first)); // true
```

`equals` compares base-unit values with a tolerance of `1e-9`. It returns `false` for different dimensions. `isLessThan` and `isGreaterThan` throw `Dimension mismatch` when dimensions differ.

## Serialization and JavaScript interop

Quantities serialize as a small `{ value, unit }` object:

```typescript
const original = Length.quantity(1.5, "km");
const json = JSON.stringify(original);
console.log(json); // {"value":1.5,"unit":"km"}

const stored = JSON.parse(json) as { value: number; unit: string };
const restored = Length.quantity(
  stored.value,
  stored.unit as keyof typeof Length.units,
);
console.log(restored.value, restored.unitSymbol); // 1.5, "km"
```

`valueOf()` returns the displayed value in the current unit, so JavaScript numeric coercion uses that value. `toString()` formats the displayed value with six significant digits followed by the unit symbol. `toJSON()` returns `{ value: number, unit: string }`. Validate the unit before reconstructing data received from an untrusted or external source.

## Offset units

Offsets support affine systems such as Celsius relative to Kelvin:

```typescript
const Temperature = defineDimension({
  name: "Temperature",
  baseUnitSymbol: "K",
  units: {
    K: { factor: 1 },
    C: { factor: 1, offset: 273.15 },
  },
} as const);

const boiling = Temperature.quantity(100, "C");
console.log(boiling.convertTo("K").value); // 373.15
```

The engine applies offsets during conversion, but it does not model the distinction between absolute temperatures and temperature differences. Offset units also cannot participate in a complex dimension, so composing `Temperature` with `Length` fails when the generated combinations reach `C`.

## Registry introspection

The registry functions are useful for diagnostics, editors, and application-controlled catalogs:

```typescript
import {
  getAllDimensions,
  getDimensionDefinition,
  getUnitDefinition,
} from "@eng-tools/ts-units";

console.log(getAllDimensions().map((dimension) => dimension.name));

const lengthDefinition = getDimensionDefinition("Length");
console.log(lengthDefinition.baseUnitSymbol); // "m"

const centimeter = getUnitDefinition("cm");
console.log(centimeter);
// { symbol: "cm", factor: 0.01, offset: 0, dimensionName: "Length" }
```

`getAllDimensions()` returns only definitions registered by the application. The returned definitions and unit maps are not frozen at runtime, so treat them as configuration rather than mutation points.

## Low-level `Q` and type utilities

The package exports `Q` for code that needs a direct constructor. It still requires the unit symbol to have been registered:

```typescript
import { Q } from "@eng-tools/ts-units";

const quantity = new Q(12, "m"); // succeeds only after "m" is registered
console.log(quantity.value, quantity.unitSymbol);
```

Most application code should prefer `Dimension.quantity` or `Dimension.factory`, because those preserve the dimension and unit literal types. The package also exports these type helpers:

```typescript
import type {
  DimensionSignature,
  SimpleDimensionSignature,
  CombineDimensionSignatures,
  DivideDimensionSignatures,
  DimensionUnitSymbols,
} from "@eng-tools/ts-units";

type LengthSignature = SimpleDimensionSignature<"Length">;
type LengthAndTime = CombineDimensionSignatures<
  { Length: 1 },
  { Time: -1 }
>; // { Length: 1; Time: -1 }
type AreaSignature = CombineDimensionSignatures<
  { Length: 1 },
  { Length: 1 }
>; // { Length: 2 }
type SpeedSignature = DivideDimensionSignatures<
  { Length: 1 },
  { Time: 1 }
>; // { Length: 1; Time: -1 }
type RegisteredLengthUnit = DimensionUnitSymbols<typeof Length>;
const signature: DimensionSignature = { Length: 1 };
```

Signature arithmetic is intended for the small integer exponents used by dimensional formulas. The current type-level implementation is bounded and should not be treated as a general-purpose numeric type calculator. Runtime signatures are normalized by removing zero exponents.

## Public API at a glance

- `defineDimension(definition, options?)` registers a simple dimension and returns typed quantity helpers.
- `defineComplexDimension(name, expression, options?)` generates a dimension from existing dimensions.
- `Q` and `Quantity` provide the concrete quantity implementation and interface.
- `getAllDimensions()`, `getDimensionDefinition(name)`, and `getUnitDefinition(symbol)` inspect the registry.
- `DimensionDefinition`, `UnitDefinition`, `UnitSpec`, `UnitMap`, and related signature types describe catalogs and results.

There are no built-in aliases, standard factories, or default dimensions. The application owns the catalog and should register it once during startup before creating quantities.
