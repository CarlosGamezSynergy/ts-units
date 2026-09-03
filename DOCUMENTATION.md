# API Documentation

This document provides detailed documentation for the symbols exported by the
`@eng-tools/ts-units` package.

## Core

### `Q` Class

The `Q` (Quantity) class is the main building block of this library. It
represents a physical quantity with a magnitude and a dimension.

**Signature:**

```typescript
class Q<CurrentUnitSymbol extends string, DS extends DimensionSignature, Units extends string = CurrentUnitSymbol> implements Quantity<DS, Units>
```

**Constructor:**

```typescript
new Q(value: number, unitSymbol: CurrentUnitSymbol)
```

- `value`: The numerical value of the quantity.
- `unitSymbol`: The string symbol of the unit (e.g., "m", "kg").

**Methods:**

- **`add(other: Quantity<DS, OtherUnits>): Q<CurrentUnitSymbol, DS, Units>`** Adds another quantity
  to this one. Throws details if dimensions do not match.

- **`subtract(other: Quantity<DS, OtherUnits>): Q<CurrentUnitSymbol, DS, Units>`** Subtracts
  another quantity from this one. Throws details if dimensions do not match.

- **`multiply<OtherDS>(other: Quantity<OtherDS>): Q<string, CombineDimensionSignatures<DS, OtherDS>>`**
  Multiplies this quantity by another, resulting in a new quantity with combined
  dimensions.

- **`divide<OtherDS>(other: Quantity<OtherDS>): Q<string, DivideDimensionSignatures<DS, OtherDS>>`**
  Divides this quantity by another.

- **`convertTo<TargetUnit extends Units>(targetUnitSymbol: TargetUnit): Quantity<DS, TargetUnit>`** Converts the
  quantity to a different unit of the same dimension.

- **`equals(other: Quantity<DS>): boolean`** Checks if two quantities are equal
  (within a small tolerance).

- **`isLessThan(other: Quantity<DS>): boolean`** Checks if this quantity is less
  than the other.

- **`isGreaterThan(other: Quantity<DS>): boolean`** Checks if this quantity is
  greater than the other.

- **`valueOf(): number`** Returns the raw value of the quantity.

- **`toString(): string`** Returns a string representation (e.g., "10.5 m").

- **`toJSON(): { value: number; unit: string }`** Returns a JSON-serializable
  object.

### `Quantity` Interface

The `Quantity` type defines the shape of a descriptor-aware quantity.

```typescript
interface Quantity<DS extends DimensionSignature, Units extends string = string> {
  value: number;
  unitSymbol: string;
  // ... arithmetic and comparison methods
}
```

The second generic parameter is the set of registered symbols valid for the
quantity. Built-in aliases provide their corresponding unit unions, while
derived quantities use `string` because their composite symbols are generated
at runtime.

### Custom Dimensions

`defineDimension` validates and registers a simple dimension, then returns a
typed object with `quantity(value, unit)` and `factory(unit)` helpers.

```typescript
const Angle = defineDimension({
  name: "Angle",
  baseUnitSymbol: "rad",
  units: { rad: { factor: 1 }, deg: { factor: Math.PI / 180 } },
} as const);

const angle = Angle.quantity(90, "deg");
const radians = angle.convertTo("rad");
```

Definitions require a non-empty name and symbols, a finite positive factor
for every unit, and a base unit with factor `1` and no offset. Duplicate
dimensions and unit symbols are rejected. `defineDimension(definition,
{ overwrite: true })` explicitly replaces an existing dimension and removes
its old units first. Built-in dimension names are reserved.

Unit offsets use `value * factor + offset` when converting to base units. This
supports affine units such as temperatures, but arithmetic does not distinguish
absolute quantities from differences.

## Factory Functions

These functions provide a concise way to create `Q` instances for standard
units.

### Length

- `m(val: number): Length` - Meters
- `km(val: number): Length` - Kilometers
- `cm(val: number): Length` - Centimeters
- `mm(val: number): Length` - Millimeters
- `µm(val: number): Length` - Micrometers
- `nm(val: number): Length` - Nanometers
- `pm(val: number): Length` - Picometers
- `ft(val: number): Length` - Feet
- `inch(val: number): Length` - Inches
- `yd(val: number): Length` - Yards
- `mi(val: number): Length` - Miles
- `nmi(val: number): Length` - Nautical Miles
- `au(val: number): Length` - Astronomical Units
- `ly(val: number): Length` - Light Years
- `pc(val: number): Length` - Parsecs

### Mass

- `kg(val: number): Mass` - Kilograms (Base Unit)
- `g(val: number): Mass` - Grams
- `mg(val: number): Mass` - Milligrams
- `µg(val: number): Mass` - Micrograms
- `t(val: number): Mass` - Metric Tonnes
- `lb(val: number): Mass` - Pounds
- `oz(val: number): Mass` - Ounces
- `st(val: number): Mass` - Stones
- `ton(val: number): Mass` - US Tons
- `lton(val: number): Mass` - Imperial (Long) Tons

### Time

- `s(val: number): Time` - Seconds
- `ms(val: number): Time` - Milliseconds
- `µs(val: number): Time` - Microseconds
- `ns(val: number): Time` - Nanoseconds
- `min(val: number): Time` - Minutes
- `h(val: number): Time` - Hours
- `d(val: number): Time` - Days
- `wk(val: number): Time` - Weeks
- `yr(val: number): Time` - Julian Years (365.25 days)

### Electric Current

- `A(val: number): ElectricCurrent` - Amperes
- `mA(val: number): ElectricCurrent` - Milliamperes
- `kA(val: number): ElectricCurrent` - Kiloamperes
- `µA(val: number): ElectricCurrent` - Microamperes

### Temperature

- `K(val: number): Temperature` - Kelvin
- `degC(val: number): Temperature` - Degrees Celsius
- `degF(val: number): Temperature` - Degrees Fahrenheit
- `degR(val: number): Temperature` - Degrees Rankine

### Amount of Substance

- `mol(val: number): AmountOfSubstance` - Moles
- `mmol(val: number): AmountOfSubstance` - Millimoles
- `kmol(val: number): AmountOfSubstance` - Kilomoles
- `µmol(val: number): AmountOfSubstance` - Micromoles

### Luminous Intensity

- `cd(val: number): LuminousIntensity` - Candelas
- `mcd(val: number): LuminousIntensity` - Millicandelas
- `kcd(val: number): LuminousIntensity` - Kilocandelas

## Dimension Types

These types represent specific physical dimensions.

### Fundamental

- `Length`
- `Mass`
- `Time`
- `ElectricCurrent`
- `Temperature`
- `AmountOfSubstance`
- `LuminousIntensity`

### Derived

- `Area` (`Length^2`)
- `Volume` (`Length^3`)
- `Frequency` (`Time^-1`)
- `Speed` (`Length * Time^-1`)
- `Acceleration` (`Length * Time^-2`)
- `Force` (`Mass * Length * Time^-2`)
- `Pressure` (`Mass * Length^-1 * Time^-2`)
- `Energy` (`Mass * Length^2 * Time^-2`)
- `Power` (`Mass * Length^2 * Time^-3`)
- `ElectricCharge` (`ElectricCurrent * Time`)
- `Voltage` (`Mass * Length^2 * Time^-3 * ElectricCurrent^-1`)

## Type Utilities

### `DimensionSignature`

Describes the composition of a unit in terms of base dimensions.

```typescript
type DimensionSignature = Record<string, number>;
```

Key is the dimension name (e.g., 'Length', 'Mass'), value is the exponent.

### `AllowedUnit<DS>`

A utility type that extracts the valid unit string unions for a given dimension
signature. For example, `AllowedUnit<{ Length: 1 }>` equates to
`"m" | "km" | "cm" ...`.

### `CombineDimensionSignatures<DS1, DS2>`

Computes the resulting dimension signature when multiplying `DS1` by `DS2`. Sums
the exponents.

### `DivideDimensionSignatures<DS1, DS2>`

Computes the resulting dimension signature when dividing `DS1` by `DS2`.
Subtracts the exponents of `DS2` from `DS1`.
