# ts-units

A lightweight, type-safe library for physical unit calculations in
TypeScript/Deno.

## Installation

### NPM (Node.js)

```bash
npm install @eng-tools/ts-units
```

### Deno

```bash
deno add jsr:@eng-tools/ts-units
```

Or import directly:

```typescript
import { Length, m } from "https://deno.land/x/ts_units/mod.ts";
```

## Motivation

Working with physical quantities in software can be error-prone. Mixing up units
(adding meters to seconds, or treating kilograms as pounds) leads to bugs that
are often hard to catch until runtime—or worse, in production logic.

`ts-units` solves this by leveraging TypeScript's type system to ensure
correctness at compile time. It treats units not just as numbers, but as
**quantities** with dimensions. This ensures that:

- **You cannot add incompatible units** (e.g., Length + Time is a compile-time
  error).
- **Operations produce the correct derived units** (e.g., Length / Time
  automatically becomes Speed).
- **Conversions are handled safely** and explicitly.

This library is helpful for engineers and developers working on scientific,
engineering, or simulation software who need to guarantee dimensional
consistency in their calculations.

## How it Works

The library is built around a core `Quantity` class that tracks both a numerical
`value` and a **Dimension Signature**.

### Dimensions & Units

A **Dimension** (like Length, Time, Mass) is defined by a signature. A **Unit**
(like meter, second, kilogram) is a specific scale for that dimension.

When you create a quantity, you are instantiating the `Quantity` class with a
specific unit. The TypeScript compiler tracks the dimensions of this quantity
via a generic type parameter.

### Arithmetic & Type Safety

The library provides methods for `add`, `subtract`, `multiply`, and `divide`.

- **Add/Subtract**: Require both operands to have the exact same dimension
  signature.
- **Multiply/Divide**: combining dimensions (e.g., `Length` * `Length` = `Area`)
  is calculated at the type level, so the result is typed correctly.

## Examples

### 1. Basic Quantity Creation

You can create quantities using the exported factory functions.

```typescript
import { kg, m, s } from "ts-units";

const length = m(10); // 10 meters
const mass = kg(5); // 5 kilograms
const time = s(20); // 20 seconds
```

### 2. Type-Safe Arithmetic

Operations are checked by TypeScript.

```typescript
import { m, s } from "ts-units";

const d1 = m(100);
const d2 = m(50);

// Safe addition
const totalDistance = d1.add(d2); // 150 m

// Type Error: Argument of type 'Time' is not assignable to parameter of type 'Quantity<{ Length: 1; }>'
// const invalid = d1.add(s(10));
```

### 3. Derived Units (Complex Calculations)

The library automatically infers complex unit types like Speed, Area, and Force.

```typescript
import { Force, kg, m, s, Speed } from "ts-units";

const distance = m(100);
const time = s(5);

// Division creates Speed (Length / Time)
const speed: Speed = distance.divide(time);
console.log(speed.toString()); // "20 m/s" (derived or base unit representation)

// Force = Mass * Acceleration
const acc = speed.divide(time); // Acceleration (Length / Time^2)
const mass = kg(10);

const force: Force = mass.multiply(acc);
console.log(force.toString()); // "40 kg.m/s^2" (or "40 N" if standard units are used)
```

### 4. Unit Conversions

You can convert between compatible units using `.convertTo()`.

```typescript
import { ft, km, m } from "ts-units";

const len = m(1000);

const asKm = len.convertTo("km");
console.log(asKm.value); // 1

const asFeet = len.convertTo("ft");
console.log(asFeet.value); // 3280.84...
```

### 5. Interoperability

You can access the raw number value or serialize the object.

```typescript
import { m } from "./src/index.ts";

const dist = m(10);

console.log(dist.value); // 10
console.log(dist.unitSymbol); // "m"
console.log(dist.toJSON()); // { value: 10, unit: "m" }
```

### 6. Custom Dimensions and Units

Define a dimension to receive a typed factory for its declared unit symbols.

```typescript
import { defineDimension, m, s } from "ts-units";

const Angle = defineDimension({
  name: "Angle",
  baseUnitSymbol: "rad",
  units: {
    rad: { factor: 1 },
    deg: { factor: Math.PI / 180 },
  },
} as const);

const angle = Angle.quantity(180, "deg");
const radians = angle.convertTo("rad");
const distancePerAngle = m(2).divide(angle);
const anglePerSecond = angle.divide(s(2));
```

The compiler accepts only `rad` and `deg` for this dimension. Passing an
undeclared symbol or converting to a unit from another dimension is a type
error, and the registry performs the same checks at runtime. Dimension names
and unit symbols must be unique; built-in dimension names are reserved.

## Supported Dimensions

- Length (m, km, ft, mi, etc.)
- Mass (kg, g, lb, ton, etc.)
- Time (s, min, hr, day, etc.)
- Electric Current (A, mA, etc.)
- Temperature (K, degC, degF, etc.)
- Amount of Substance (mol)
- Luminous Intensity (cd)
