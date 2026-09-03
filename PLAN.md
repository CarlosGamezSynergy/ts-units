# Custom Dimensions and Units Implementation Plan

## Goal

Add a public, type-safe API that allows consumers to define dimensions and units that are not included in the built-in set.

The implementation should preserve the existing runtime registry and arithmetic behavior while making custom unit symbols available to TypeScript. It should use Option A from the design review: a `Quantity` carries both its dimension signature and the set of unit symbols valid for that dimension.

The central constraint is that TypeScript cannot dynamically update a global union after `defineDimension(...)` executes. Custom unit information therefore needs to flow through the typed value returned by `defineDimension`, rather than through a global `AllowedUnit` conditional type.

## Current Architecture

The relevant implementation surfaces are:

- `src/types/dimension.ts`: currently contains a closed `DimensionName` union and runtime definition types.
- `src/types/signature.ts`: contains `DimensionSignature`, `AllowedUnit`, and type-level signature arithmetic.
- `src/utils/registry.ts`: contains the global dimension and unit registries and `defineDimension`.
- `src/quantity.ts`: contains `Quantity`, `Q`, conversion, arithmetic, and composite-unit formatting.
- `src/units/index.ts`: contains built-in dimension configurations, built-in unit unions, and standard registration.
- `src/index.ts`: contains the public exports, built-in quantity aliases, and built-in factory functions.

The runtime registry already accepts arbitrary dimension names and units. The main limitations are in the type layer:

- `DimensionName` only contains built-in names.
- `RegistryUnit` is manually enumerated.
- `AllowedUnit<DS>` only maps built-in signatures to built-in unit unions.
- `defineDimension` returns `void`, so the compiler cannot associate a custom definition with a typed factory.
- `Quantity` does not carry a unit-symbol generic.
- `add` and `subtract` currently accept an unconstrained dimension generic, which does not fully enforce the documented compile-time compatibility behavior.

## Target Public API

A consumer should be able to define a dimension and immediately receive a typed factory:

```ts
import { defineDimension } from "@eng-tools/ts-units";

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
```

The following should be compile-time errors:

```ts
// @ts-expect-error "m" is not an angle unit
angle.convertTo("m");

// @ts-expect-error "invalid" was not declared for Angle
Angle.quantity(1, "invalid");
```

Custom quantities should also participate in arithmetic:

```ts
import { m, s } from "@eng-tools/ts-units";

const distance = m(2);
const angle = Angle.quantity(3, "rad");

const product = distance.multiply(angle);
const rate = angle.divide(s(2));
```

The resulting signatures should contain the custom dimension name:

```ts
// product: Quantity<{ Length: 1; Angle: 1 }, string>
// rate: Quantity<{ Angle: 1; Time: -1 }, string>
```

## Phase 1: Generalize Definition Types

### File: `src/types/dimension.ts`

Replace the closed `DimensionName` union with generic definition types.

Suggested shape:

```ts
export type UnitSpec = {
  factor: number;
  offset?: number;
};

export type UnitMap = Record<string, UnitSpec>;

export type DimensionDefinition<
  Name extends string = string,
  Units extends UnitMap = UnitMap,
> = {
  name: Name;
  baseUnitSymbol: keyof Units & string;
  units: Units;
};

export type UnitDefinition<
  DimensionName extends string = string,
> = {
  symbol: string;
  factor: number;
  offset: number;
  dimensionName: DimensionName;
};
```

Requirements:

- `baseUnitSymbol` must be a key of the configured `units` object.
- `Units` must preserve literal keys when a configuration is passed with `as const`.
- Existing built-in configurations must continue to satisfy the definition type.
- Runtime `UnitDefinition` should remain normalized, with a required numeric offset.

Use `readonly`-compatible input types if necessary so that `as const` configuration objects do not need to be copied or widened before registration.

## Phase 2: Add Type Helpers

### File: `src/types/signature.ts`

Add reusable helpers for simple custom dimensions and their unit symbols:

```ts
export type SimpleDimensionSignature<Name extends string> = {
  [K in Name]: 1;
};

export type DimensionUnitSymbols<
  Definition extends DimensionDefinition,
> = keyof Definition["units"] & string;
```

Continue using generic string-keyed signatures for the arithmetic types:

- `CombineDimensionSignatures`
- `DivideDimensionSignatures`

The existing `AllowedUnit<DS>` conditional type cannot represent arbitrary custom dimensions. Choose one of the following compatibility policies:

1. Keep `AllowedUnit` as a legacy helper for built-in dimensions only and document its limitation.
2. Deprecate and remove it in a later breaking release.
3. Replace it with a generic helper that operates on a definition rather than only on a signature.

Do not attempt to make `AllowedUnit` dynamically include units registered at runtime; TypeScript cannot do that.

## Phase 3: Extend `Quantity` With Unit Metadata

### File: `src/quantity.ts`

Change the interface from one generic parameter to two, with a default for compatibility:

```ts
export interface Quantity<
  DS extends DimensionSignature,
  Units extends string = string,
> {
  // existing members
}
```

The default `string` allows raw quantities and existing internal paths to continue working while typed factories are migrated.

### Conversion

Change conversion to restrict the target to the quantity's unit set:

```ts
convertTo<TargetUnit extends Units>(
  targetUnitSymbol: TargetUnit,
): Quantity<DS, TargetUnit>;
```

A custom quantity created from `"deg" | "rad"` should therefore allow either symbol but reject symbols belonging to unrelated dimensions.

Keep the runtime lookup and dimension-signature validation. Runtime validation is still required for JavaScript callers, deserialized values, explicit type assertions, and raw `Q` instances.

### Addition and subtraction

Allow quantities with compatible dimensions but different unit sets, and return the receiver's unit set:

```ts
add<OtherUnits extends string>(
  other: Quantity<DS, OtherUnits>,
): Quantity<DS, Units>;

subtract<OtherUnits extends string>(
  other: Quantity<DS, OtherUnits>,
): Quantity<DS, Units>;
```

This should allow a meter quantity to add a kilometer quantity while rejecting a time quantity. The existing runtime signature comparison remains necessary.

This change also fixes the current method declaration, whose unconstrained `OtherDS` generic does not fully enforce same-dimension addition at compile time.

### Multiplication and division

Composite unit symbols are generated at runtime and are not necessarily registered simple units. Use `string` for the result unit set:

```ts
multiply<
  OtherDS extends DimensionSignature,
  OtherUnits extends string,
>(
  other: Quantity<OtherDS, OtherUnits>,
): Quantity<CombineDimensionSignatures<DS, OtherDS>, string>;

divide<
  OtherDS extends DimensionSignature,
  OtherUnits extends string,
>(
  other: Quantity<OtherDS, OtherUnits>,
): Quantity<DivideDimensionSignatures<DS, OtherDS>, string>;
```

The custom dimension key must be retained in the resulting type-level signature.

## Phase 4: Update the `Q` Class

### File: `src/quantity.ts`

Extend `Q` with a third generic parameter:

```ts
export class Q<
  CurrentUnitSymbol extends string,
  DS extends DimensionSignature,
  Units extends string = CurrentUnitSymbol,
> implements Quantity<DS, Units> {
  // existing implementation
}
```

The constructor may continue to accept a generic string because it performs runtime registry validation. The typed public dimension factory will provide compile-time unit restrictions.

Update internal helper signatures where appropriate:

- `Q.create(...)` should preserve the new unit generic for simple quantities.
- `Q.fromValueInBaseUnits(...)` should use `string` for derived composite quantities.
- `add` and `subtract` should return the receiver's unit type.
- `multiply` and `divide` should return `string` as the unit set.

Keep type assertions localized to implementation boundaries where runtime registry results cannot prove the generic relationship.

## Phase 5: Add `DefinedDimension`

### Suggested location: `src/types/dimension.ts` or a new public `src/dimension.ts`

Add a type representing the object returned by `defineDimension`:

```ts
export type DefinedDimension<
  Name extends string,
  Units extends UnitMap,
> = {
  readonly name: Name;
  readonly baseUnitSymbol: keyof Units & string;
  readonly units: Units;

  quantity(
    value: number,
    unit: keyof Units & string,
  ): Quantity<
    SimpleDimensionSignature<Name>,
    keyof Units & string
  >;

  factory(
    unit: keyof Units & string,
  ): (
    value: number,
  ) => Quantity<
    SimpleDimensionSignature<Name>,
    keyof Units & string
  >;
};
```

The minimum API should include `quantity(value, unit)`. The `factory(unit)` helper is optional for the first release but would make custom definitions easier to use in the same style as built-in factories such as `m(10)`.

If both are implemented, examples become:

```ts
const angle = Angle.quantity(90, "deg");
const deg = Angle.factory("deg");
const anotherAngle = deg(45);
```

## Phase 6: Make `defineDimension` Generic

### File: `src/utils/registry.ts`

Change `defineDimension` to infer and return the literal dimension name and unit symbols:

```ts
export function defineDimension<
  const Name extends string,
  const Units extends UnitMap,
>(
  definition: DimensionDefinition<Name, Units>,
): DefinedDimension<Name, Units> {
  // validate definition
  // register definition
  // return typed factory object
}
```

The returned factory should:

1. Validate the selected unit through the normal registry lookup.
2. Construct a `Q` instance.
3. Return it with the dimension signature `{ [Name]: 1 }` and unit set `keyof Units & string`.

The runtime implementation will likely need a localized assertion when creating the generic `Q`. Keep this assertion inside `defineDimension`; consumers should not need `as`, `any`, or `@ts-ignore`.

The existing built-in registrations should continue to call `defineDimension`, but the return values do not need to be exported unless built-in factory generation is migrated to use them.

## Phase 7: Strengthen Registry Validation

### File: `src/utils/registry.ts`

Validate definitions before mutating either registry.

Required validation:

- Dimension name is non-empty.
- Base-unit symbol is non-empty.
- Base-unit symbol exists in `definition.units`.
- Every unit symbol is non-empty.
- Every conversion factor is finite.
- Every conversion factor is positive.
- Base-unit factor is exactly `1`.
- Base-unit offset is absent or `0`.

Suggested error messages should identify the dimension, unit, and invalid field.

### Collision policy

Change the current warning-and-overwrite behavior to rejection by default:

- Reject duplicate dimension names.
- Reject unit symbols already registered by another dimension.
- Reject a base-unit symbol that belongs to another dimension.

If redefinition is needed, make it explicit with an option such as:

```ts
defineDimension(definition, { overwrite: true });
```

When overwriting is supported, remove all units owned by the old dimension before registering the new definition. Otherwise, old unit symbols remain in the global unit registry and become stale or misleading.

Use unique names and symbols in tests because the registry is process-global.

## Phase 8: Handle Dimension Identity

Dimension signatures are currently structural string-keyed objects. A custom definition named `"Length"` would therefore be indistinguishable from the built-in `Length` type.

For the first implementation, reserve built-in dimension names and reject custom definitions that reuse them. This is the smallest change compatible with the current runtime model.

Reserved names:

- `Length`
- `Mass`
- `Time`
- `Temperature`
- `ElectricCurrent`
- `AmountOfSubstance`
- `LuminousIntensity`

A future major version could use unique type-level brands for each dimension, but that would require broader changes to signature arithmetic, runtime formatting, and serialization.

## Phase 9: Export the Public API

### File: `src/index.ts`

Export the public definition types and factory:

```ts
export {
  defineDimension,
  getAllDimensions,
} from "./utils/registry.ts";

export type {
  DimensionDefinition,
  DefinedDimension,
  UnitDefinition,
  UnitSpec,
  UnitMap,
} from "./types/dimension.ts";
```

Keep low-level registry lookup functions internal unless consumers require registry introspection.

Update built-in aliases to carry their unit unions:

```ts
export type Length = Quantity<{ Length: 1 }, LengthUnit>;
export type Mass = Quantity<{ Mass: 1 }, MassUnit>;
export type Time = Quantity<{ Time: 1 }, TimeUnit>;
```

Apply the same change to all built-in dimensions.

## Phase 10: Update Built-In Configuration Types

### File: `src/units/index.ts`

Preserve the literal unit keys while validating each configuration with the generalized definition type.

Prefer a `satisfies` declaration where appropriate:

```ts
export const LENGTH_CONFIG = {
  name: "Length",
  baseUnitSymbol: "m",
  units: {
    m: { factor: 1 },
    km: { factor: 1000 },
    cm: { factor: 0.01 },
  },
} as const satisfies DimensionDefinition<"Length">;
```

Continue deriving unit unions from the configuration:

```ts
export type LengthUnit = keyof typeof LENGTH_CONFIG.units & string;
```

The long-term implementation should use the same definition and factory path for built-in and custom dimensions. The existing named exports (`m`, `km`, `kg`, and so on) may remain as compatibility aliases during the first migration.

## Phase 11: Composite Unit Behavior

Verify that custom dimensions compose correctly with built-in dimensions at both runtime and compile time.

Expected examples:

```ts
const distance = m(2);
const angle = Angle.quantity(3, "rad");

const product = distance.multiply(angle);
// Quantity<{ Length: 1; Angle: 1 }, string>

const rate = angle.divide(s(2));
// Quantity<{ Angle: 1; Time: -1 }, string>
```

The existing runtime methods `combineSignatures` and `divideSignatures` already operate on arbitrary string keys. Confirm that they preserve the custom key and remove zero exponents.

Named derived units, such as registering a custom `"Pa"` for a pressure signature, should be treated as a separate future feature. The first implementation should continue to represent derived quantities using generated composite symbols such as `"m/s"`.

## Phase 12: Affine Unit Semantics

The existing conversion model supports offsets using:

```ts
baseValue = value * factor + offset;
```

Retain this behavior for custom units, but document that offset conversion does not automatically make arithmetic on absolute quantities physically valid.

Add a future-compatible field only if needed:

```ts
type UnitSpec = {
  factor: number;
  offset?: number;
  kind?: "absolute" | "difference";
};
```

Do not introduce absolute-versus-difference arithmetic rules in the first custom-dimension release unless the project specifically requires them. At minimum, document the current behavior and test custom affine conversion.

## Test Plan

### New file: `tests/custom_dimension.test.ts`

Add runtime tests for a custom angle dimension:

```ts
const Angle = defineDimension({
  name: "Angle",
  baseUnitSymbol: "rad",
  units: {
    rad: { factor: 1 },
    deg: { factor: Math.PI / 180 },
  },
} as const);
```

Test:

- Custom quantity creation.
- Unit symbol preservation.
- Degrees-to-radians conversion.
- Radians-to-degrees conversion.
- Equality across custom units.
- Addition and subtraction across custom units.
- Runtime rejection of unknown symbols.
- Runtime rejection of conversion to a different dimension.

Use tolerance-based assertions for floating-point conversion results.

### Custom arithmetic tests

Test custom dimensions combined with built-in dimensions:

- custom dimension multiplied by `Length`
- custom dimension divided by `Time`
- custom dimension divided by itself
- custom dimension multiplied by another custom dimension
- zero-exponent cleanup after cancellation
- generated composite unit symbols

Check both numeric values and `_dimensionSignature` at runtime.

### New file: `tests/custom_dimension_types.test.ts`

Add compile-time checks using `@ts-expect-error`:

```ts
const angle = Angle.quantity(90, "deg");

angle.convertTo("rad");
angle.convertTo("deg");

// @ts-expect-error "m" is not an Angle unit
angle.convertTo("m");

// @ts-expect-error this symbol was not declared
Angle.quantity(1, "invalid");
```

Check incompatible addition:

```ts
// @ts-expect-error Angle and Length are different dimensions
angle.add(m(1));
```

Check compatible addition with different unit sets:

```ts
const angleInRadians = Angle.quantity(Math.PI / 2, "rad");
angle.add(angleInRadians);
```

Check inferred result types:

```ts
const radians = angle.convertTo("rad");

const expected: Quantity<{ Angle: 1 }, "rad"> = radians;
```

Ensure these tests are included in `deno check`, not only in runtime test execution.

### Custom composition type tests

Verify inferred arithmetic types:

```ts
const product = m(2).multiply(Angle.quantity(3, "rad"));

const expectedProduct: Quantity<
  { Length: 1; Angle: 1 },
  string
> = product;
```

And:

```ts
const rate = Angle.quantity(3, "rad").divide(s(2));

const expectedRate: Quantity<
  { Angle: 1; Time: -1 },
  string
> = rate;
```

### Registry validation tests

Add runtime tests for:

- missing base unit
- base unit with a factor other than `1`
- base unit with an offset
- non-finite factors
- zero factors
- negative factors
- empty dimension names
- empty unit symbols
- duplicate dimension names
- duplicate unit symbols
- reserved built-in dimension names
- stale units after replacement, if overwrite is supported

Use unique test dimension and unit names to avoid interference from other tests.

### Affine conversion tests

Add a custom temperature-like definition and verify:

- zero offset-unit value converts to the expected base value
- base value converts back to the offset unit
- scale and offset are applied in the correct order
- invalid cross-dimension conversion is rejected

### Built-in regression tests

Update or extend existing tests to confirm that:

- built-in conversions still accept all valid built-in units
- incompatible conversions are rejected at compile time and runtime
- built-in addition remains dimension-safe
- built-in aliases now carry their unit unions
- derived built-in arithmetic retains its current signatures and values
- raw `Q` construction still performs runtime validation

## Documentation Updates

### File: `README.md`

Add a `Custom Dimensions and Units` section covering:

1. Defining a dimension.
2. Creating a quantity.
3. Converting between custom units.
4. Combining custom quantities with built-in quantities.
5. Compile-time rejection of undeclared units.

Use a complete example based on `Angle`, `Rotation`, or another domain-neutral dimension.

### File: `DOCUMENTATION.md`

Document:

- `defineDimension`
- `DimensionDefinition`
- `DefinedDimension`
- `UnitSpec`
- `UnitMap`
- the second `Quantity` generic parameter
- typed `convertTo`
- collision and redefinition behavior
- runtime validation behavior
- simple registered units versus generated composite units
- affine-unit offset semantics

Update the documented `Q` and `convertTo` signatures so they match the implementation after the generic changes.

## Compatibility Considerations

- Give the new `Quantity` unit generic a default of `string` so existing direct uses of `Quantity<DS>` remain valid.
- Keep raw `new Q(value, symbol)` available, with runtime validation.
- Preserve existing built-in factory names and return types.
- Avoid changing generated composite unit strings unless required by a failing test.
- Do not expose mutable registry maps.
- Decide whether duplicate registration is a breaking behavior change. Rejection is safer, but the release notes should call it out if existing callers rely on overwriting.

## Implementation Order

1. Generalize `DimensionDefinition`, `UnitSpec`, `UnitMap`, and `UnitDefinition`.
2. Add simple-signature and unit-symbol helper types.
3. Add the second `Quantity` generic with a default of `string`.
4. Update `Q`, conversion, addition, subtraction, multiplication, and division signatures.
5. Add `DefinedDimension`.
6. Make `defineDimension` generic and return a typed factory.
7. Add registry validation and collision handling.
8. Decide and implement reserved-name behavior.
9. Export the custom-dimension API.
10. Update built-in aliases and configuration declarations.
11. Add runtime custom-dimension tests.
12. Add compile-time custom-dimension tests.
13. Add registry validation and affine conversion tests.
14. Update `README.md` and `DOCUMENTATION.md`.
15. Run the full type check and test suite.

## Verification Commands

Run the full source and test type check:

```bash
deno check --quiet $(find . -maxdepth 2 -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path './node_modules/*' | sort)
```

Run the existing and new tests:

```bash
deno task test
```

The implementation is complete when custom definitions require no consumer-side type assertions, invalid custom units fail at compile time, runtime registration and conversion remain validated, custom dimensions compose correctly with built-in dimensions, and all existing built-in tests continue to pass.
