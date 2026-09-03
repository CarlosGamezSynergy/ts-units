# ts-units

`ts-units` is an engine for type-safe dimensional arithmetic and unit conversion. It intentionally ships with no pre-registered dimensions or units. Applications own their unit catalog and register it explicitly at startup.

## Define Dimensions

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

const Time = defineDimension({
  name: "Time",
  baseUnitSymbol: "s",
  units: { s: { factor: 1 }, min: { factor: 60 } },
} as const);

const distance = Length.quantity(5, "km");
console.log(distance.convertTo("m").value); // 5000
const speed = distance.divide(Time.quantity(30, "s"));
```

`Length.factory("m")` creates a local `value => quantity` helper. The returned dimension retains its exact unit-symbol union, so undeclared units and incompatible conversions fail at compile time. Raw `Q` construction remains available and performs the same registry validation at runtime.

## Registry Behavior

Importing the package does not register anything. `getAllDimensions()` is empty until `defineDimension()` is called, and `getUnitDefinition("m")` throws unless an application has declared `m`. Dimension names and unit symbols must be non-empty and unique. Factors must be finite and positive; a base unit must have factor `1` and no offset. Duplicate definitions are rejected unless `{ overwrite: true }` is supplied, which removes the old units first.

Offsets use `value * factor + offset` when converting to base units. Affine conversion is supported, but arithmetic does not distinguish absolute quantities from differences.

## API

The public package exports `Q`, `Quantity`, `defineDimension`, registry introspection functions, generic definition types, and generic signature arithmetic utilities. It does not export standard-unit factories, built-in dimension aliases, or a default unit catalog.

## Development

```bash
deno check --quiet $(find . -maxdepth 2 -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path './node_modules/*' | sort)
deno task test
deno task build_npm
```
