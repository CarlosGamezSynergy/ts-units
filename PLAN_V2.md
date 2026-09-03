# PLAN V2: Remove Default Units and Dimensions

## Objective

Refactor the library so it provides only the generic dimension-and-unit engine. No dimensions or units are registered automatically by the package.

The import-time invariant is: **no dimensions and no units exist in the registry before the consumer calls `defineDimension(...)`.**

After this change:

- Importing the package does not register any dimensions.
- Importing the package does not register any units.
- `getAllDimensions()` returns an empty array until the caller registers a dimension.
- `getUnitDefinition("...")` fails until the caller registers a dimension containing that unit.
- `new Q(...)` fails for every unit symbol that has not been registered.
- Every usable unit is introduced through `defineDimension(...)`.
- Built-in convenience factories such as `m`, `kg`, and `s` are removed from the public package API.
- Built-in dimension aliases such as `Length`, `Mass`, and `Time` are removed unless they are retained only as test fixtures or examples outside the runtime package.
- The arithmetic, conversion, registry, and type-level signature engine remains available for user-defined dimensions.

This plan builds on the custom-dimension design in `PLAN.md`, but changes the product boundary: the library will no longer ship a pre-registered unit catalog.

## Intended User Experience

A consumer must explicitly define every dimension and unit they use:

```ts
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
  units: {
    s: { factor: 1 },
    min: { factor: 60 },
  },
} as const);

const distance = Length.quantity(2, "km");
const duration = Time.quantity(30, "s");
const speed = distance.divide(duration);
```

A package import alone must not make the following valid:

```ts
import {
  getAllDimensions,
  getUnitDefinition,
  Q,
} from "@eng-tools/ts-units";

getAllDimensions(); // []
getUnitDefinition("m"); // throws: Unit "m" is not defined
new Q(1, "m"); // throws: Unit "m" is not defined
```

After explicit registration, the same unit becomes available through the returned typed dimension:

```ts
const meters = Length.quantity(1, "m");
const kilometers = meters.convertTo("km");
```

## Scope and Non-Goals

### In scope

- Remove automatic standard-unit registration.
- Remove the built-in unit catalog from the runtime initialization path.
- Make `defineDimension` the only supported registration entry point.
- Preserve the generic registry and quantity engine.
- Preserve type-safe custom unit symbols through the returned dimension object.
- Update exports, tests, documentation, and build metadata to reflect the engine-only package.
- Ensure package imports are side-effect free with respect to registry contents.

### Out of scope

- Adding a replacement default unit set.
- Automatically loading units based on imports or environment variables.
- Making runtime registration globally visible to TypeScript after the fact.
- Adding a parser for unit expressions.
- Adding named derived-unit registration such as automatically mapping a pressure signature to `Pa`.
- Changing affine-unit arithmetic semantics unless required to preserve existing engine behavior.
- Preserving source compatibility for imports of removed built-in factories and aliases in the same major API.

## Current Registration Path

The current initialization path must be removed:

1. `src/index.ts` imports `registerStandardUnits` from `src/units/index.ts`.
2. `src/index.ts` invokes `registerStandardUnits()` at module load time.
3. `registerStandardUnits()` calls `defineDimension()` for the standard configurations.
4. The global registries are populated before a consumer explicitly defines anything.

The controlling change is to remove both the import and invocation from `src/index.ts`. The standard-unit module must also stop being part of the package's default dependency graph.

The desired invariant is:

```ts
import { getAllDimensions } from "./src/index.ts";

assertEquals(getAllDimensions(), []);
```

## Phase 1: Establish the Engine-Only Public Boundary

### File: `src/index.ts`

Remove:

```ts
import { registerStandardUnits } from "./units/index.ts";
```

and:

```ts
registerStandardUnits();
```

The entrypoint should export only the generic engine API, including:

- `Q`
- `Quantity`
- `defineDimension`
- `getAllDimensions`, if registry introspection is public
- `getDimensionDefinition`, if consumers need dimension introspection
- `getUnitDefinition`, if consumers need unit introspection
- generic definition and signature types

The entrypoint must not import `src/units/index.ts` for side effects or type values that cause runtime module initialization.

A possible public surface is:

```ts
export {
  Q,
} from "./quantity.ts";

export type {
  Quantity,
} from "./quantity.ts";

export {
  defineDimension,
  getAllDimensions,
  getDimensionDefinition,
  getUnitDefinition,
} from "./utils/registry.ts";

export type {
  DefinedDimension,
  DimensionDefinition,
  DimensionUnitSymbols,
  UnitDefinition,
  UnitMap,
  UnitSpec,
} from "./types/dimension.ts";

export * from "./types/signature.ts";
```

Use type-only exports where a symbol is needed only at compile time. This makes it easier to verify that importing the package has no registration side effects.

### Public API decision

Decide explicitly whether the low-level registry getters are public:

- Keep them public if consumers need diagnostics, serialization, introspection, or custom tooling.
- Keep them internal if the intended abstraction is only `defineDimension` plus typed dimension objects.

Regardless of that decision, `defineDimension` must be public and must be the only function that adds entries to the registries.

## Phase 2: Remove Built-In Runtime Definitions and Factories

### File: `src/units/index.ts`

The built-in configuration objects and `registerStandardUnits()` function currently represent the default catalog. Remove them from the main engine implementation.

There are two acceptable repository-level approaches:

### Preferred approach: delete the module

Delete `src/units/index.ts` if no engine code requires it after the entrypoint cleanup.

This makes the package boundary unambiguous: there is no bundled standard-unit catalog available through the main source tree.

### Alternative approach: move fixtures out of the package API

If the configurations are useful for examples or regression fixtures, move them to a test-only or example-only location such as:

- `tests/fixtures/standard_dimensions.ts`
- `examples/standard_dimensions.ts`

They must not be imported by `src/index.ts`, `src/quantity.ts`, or `src/utils/registry.ts`.

If they remain in `src/`, they must be clearly non-public and must not expose `registerStandardUnits()` as a supported registration mechanism. The preferred implementation is still to remove the module entirely and define test dimensions locally in tests.

### Remove built-in exports

Remove from `src/index.ts`:

- `m`, `km`, `cm`, `mm`, and other length factories
- `kg`, `g`, `lb`, and other mass factories
- `s`, `ms`, `min`, `h`, and other time factories
- current, temperature, substance, and luminous-intensity factories
- `Length`, `Mass`, `Time`, `Temperature`, and other built-in aliases
- built-in derived aliases such as `Speed`, `Force`, `Energy`, and `Voltage`

Derived signatures remain supported by the generic `Quantity` and signature utilities. Consumers can define their own aliases locally:

```ts
type Length = Quantity<{ Length: 1 }, "m" | "km">;
type Time = Quantity<{ Time: 1 }, "s" | "min">;
type Speed = Quantity<{ Length: 1; Time: -1 }, string>;
```

Do not retain aliases that suggest the package still owns or registers those dimensions by default.

## Phase 3: Ensure `defineDimension` Is the Only Registration Mechanism

### File: `src/utils/registry.ts`

Keep `defineDimension(...)` as the sole public registration function.

The function must continue to:

1. Validate the dimension definition.
2. Add the dimension to the dimension registry.
3. Add each declared unit to the unit registry.
4. Return a typed dimension object whose unit symbols are inferred from the definition.

The function must not be called during module initialization anywhere in `src/`.

Search the source tree for every call to `defineDimension` and classify it as one of:

- explicit consumer/test call, which is allowed
- built-in initialization, which must be removed
- internal helper behavior, which must be eliminated or made explicit

The implementation should not expose a second public function such as `registerStandardUnits`, `registerUnit`, or `registerBuiltIns` that bypasses the new model.

### Runtime invariant

Add or preserve a registry reset mechanism only for tests if it is necessary. Do not expose a public reset that could let application code accidentally invalidate live quantities.

A test-only reset can be implemented through a non-exported helper, a dedicated test module, or isolated test processes. The production registry must start empty exactly once per module instance.

## Phase 4: Review Generic Type Boundaries

The engine-only change depends on the custom-dimension type design. Complete or verify the following from `PLAN.md`.

### `src/types/dimension.ts`

Use generic definitions:

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

### `src/types/signature.ts`

Keep signatures generic over string keys:

```ts
export type DimensionSignature = Record<string, number>;

export type SimpleDimensionSignature<Name extends string> = {
  [K in Name]: 1;
};
```

Do not reintroduce a closed `DimensionName` union. The engine must support names supplied by users.

### `src/quantity.ts`

Use a unit-symbol generic with a default for compatibility:

```ts
export interface Quantity<
  DS extends DimensionSignature,
  Units extends string = string,
> {
  // existing members
}
```

`convertTo` must be restricted to the quantity's unit set:

```ts
convertTo<TargetUnit extends Units>(
  targetUnitSymbol: TargetUnit,
): Quantity<DS, TargetUnit>;
```

Addition and subtraction should accept another quantity with the same dimension signature but potentially a different unit set:

```ts
add<OtherUnits extends string>(
  other: Quantity<DS, OtherUnits>,
): Quantity<DS, Units>;

subtract<OtherUnits extends string>(
  other: Quantity<DS, OtherUnits>,
): Quantity<DS, Units>;
```

Multiplication and division should preserve arbitrary custom dimension keys and use `string` for generated composite unit symbols:

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

### `Q`

Keep raw `Q` construction available as the low-level engine API:

```ts
new Q(value, unitSymbol);
```

It must perform runtime registry lookup and fail for unregistered symbols. It should not claim compile-time knowledge of unit sets unless a caller supplies a narrower type through the typed dimension factory.

## Phase 5: Define the Typed Dimension Factory

### File: `src/utils/registry.ts` and public type definitions

`defineDimension` should return a typed `DefinedDimension`:

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

The minimum required method is `quantity(value, unit)`. `factory(unit)` is recommended because it provides a convenient way to construct named local factories without placing them in the library:

```ts
const m = Length.factory("m");
const distance = m(10);
```

The returned object must retain the exact literal unit union. This is what replaces the removed global built-in unit unions.

## Phase 6: Registry Initialization and Import Isolation

Add an explicit test that imports the public package and checks the initial registry state before any test-defined dimension is registered.

Because test files can share a Deno process and registry state, use one of these approaches:

1. A dedicated subprocess test that imports the package in a fresh process.
2. A test-only registry reset helper.
3. A dedicated module-level initialization test that runs before all registration tests and is isolated by test organization.

The subprocess approach gives the strongest guarantee that package import itself is clean:

```ts
// Conceptual test behavior
const dimensions = getAllDimensions();
assertEquals(dimensions, []);
```

Also assert that common former defaults are absent:

```ts
assertThrows(() => getUnitDefinition("m"));
assertThrows(() => getUnitDefinition("kg"));
assertThrows(() => getUnitDefinition("s"));
assertThrows(() => getDimensionDefinition("Length"));
```

Do not use `m`, `kg`, or `s` through library exports in this test because those exports must no longer exist.

## Test Plan

The test suite must prove both halves of the new contract: the registry starts with no dimensions and no units, and explicit calls to `defineDimension(...)` create the expected typed and runtime behavior.

## Phase 7: Rewrite Existing Tests Around Explicit Registration

The current tests depend heavily on automatic registration and built-in factories. They must be converted to explicit test fixtures.

### `tests/core.test.ts`

Replace imports such as:

```ts
import { m, km, cm, s } from "../src/index.ts";
```

with local definitions:

```ts
import { defineDimension } from "../src/index.ts";

const Length = defineDimension({
  name: "TestLength",
  baseUnitSymbol: "test_m",
  units: {
    test_m: { factor: 1 },
    test_km: { factor: 1000 },
    test_cm: { factor: 0.01 },
  },
} as const);

const Time = defineDimension({
  name: "TestTime",
  baseUnitSymbol: "test_s",
  units: {
    test_s: { factor: 1 },
    test_min: { factor: 60 },
  },
} as const);
```

Use `Length.quantity(...)` and `Time.quantity(...)` in place of built-in factories.

Use unique `Test...` names and symbols so tests do not depend on production defaults or collide with other test definitions.

### `tests/factory.test.ts`

This test currently iterates over the built-in factory exports. Replace it with tests for the returned custom factory API:

- `Dimension.quantity(value, unit)`
- `Dimension.factory(unit)(value)`
- inferred unit symbols
- rejection of undeclared unit symbols at compile time
- runtime construction after explicit registration

Remove all assumptions that the public entrypoint exports a factory for every standard unit.

### `tests/index.test.ts`

Replace built-in export tests with public-surface tests:

- `defineDimension` is exported.
- `Q` is exported.
- generic type utilities are exported as intended.
- built-in factory names are absent from the runtime module namespace.
- built-in aliases are absent if the API removal is intentional.
- importing the package does not populate the registry.

Avoid using dynamic `any` checks as the only assertion for removed exports. Where possible, use a runtime namespace import and explicit `undefined` checks, plus compile-time API checks in a separate type test.

### `tests/allowed_unit.test.ts`

Rewrite or remove tests that expect `AllowedUnit` to map built-in dimension names to built-in unit unions.

Preferred replacement:

- Test that custom unit symbols are inferred through `DefinedDimension`.
- Test that `convertTo` accepts only the unit symbols in the returned dimension definition.
- Retain `AllowedUnit` only if it remains intentionally public as a legacy helper, and document that it is not the mechanism for custom definitions.

### `tests/unit_conversions.test.ts`

Create local dimensions explicitly at the beginning of the test fixture and use their typed quantities. Confirm conversion still works after registration and fails before registration.

### `tests/temperature.test.ts`

Define a test-only temperature dimension explicitly. Do not rely on a built-in temperature configuration. Keep tests for scale and offset behavior if affine conversion remains supported.

### `tests/unit_coverage.test.ts`

Remove the expectation that the package contains a fixed list of units. Replace it with coverage for the generic registration process:

- every declared unit is retrievable after registration
- every declared unit converts to the base unit
- invalid definitions are rejected

### `tests/registry.test.ts`

Ensure the registry tests explicitly call `defineDimension` and verify:

- no entries exist before registration in an isolated test process
- custom dimensions are retrievable after registration
- custom units are retrievable after registration
- duplicate dimensions follow the documented policy
- duplicate unit symbols follow the documented policy
- overwrite behavior, if retained, removes stale units

### `tests/quantity_methods.test.ts`

Replace ad hoc string units with explicit local test definitions. Continue testing arithmetic and comparison behavior through `Q` or the returned dimension factories.

### `tests/signature_safety.test.ts`

Keep type-level tests for arbitrary custom dimension names. Remove assumptions that the set of dimensions is fixed to SI dimensions.

## Phase 8: Add Dedicated No-Defaults Tests

### New file: `tests/no_default_registration.test.ts`

This suite should be isolated from tests that register fixtures, or should launch a fresh Deno subprocess for each initial-state assertion.

Required runtime assertions:

```ts
assertEquals(getAllDimensions(), []);
assertThrows(() => getDimensionDefinition("Length"));
assertThrows(() => getUnitDefinition("m"));
assertThrows(() => getUnitDefinition("kg"));
assertThrows(() => getUnitDefinition("s"));
assertThrows(() => new Q(1, "m"));
```

Also verify that the registry remains empty after importing type-only symbols and `Q`:

```ts
import { Q } from "../src/index.ts";
import type { DimensionSignature, Quantity } from "../src/index.ts";
```

The test should not define a dimension until all no-default assertions have completed.

### Public export assertions

Assert that removed built-in runtime exports are no longer present:

```ts
import * as UnitsEngine from "../src/index.ts";

assertEquals("m" in UnitsEngine, false);
assertEquals("kg" in UnitsEngine, false);
assertEquals("s" in UnitsEngine, false);
assertEquals("registerStandardUnits" in UnitsEngine, false);
```

If built-in aliases are removed, verify the type API separately rather than relying only on runtime reflection because type aliases do not exist at runtime.

## Phase 9: Add Custom-Dimension Runtime and Type Tests

### New file: `tests/custom_dimension.test.ts`

Define an `Angle` or `TestLength` dimension locally and test:

- explicit registration
- creation through `quantity`
- creation through `factory`
- conversion between custom units
- equality across units
- addition and subtraction across units
- multiplication with another custom dimension
- multiplication with a dimension defined by another fixture
- division and zero-exponent cleanup
- runtime failure for unknown symbols
- runtime failure for cross-dimension conversion

Example:

```ts
const Angle = defineDimension({
  name: "TestAngle",
  baseUnitSymbol: "test_rad",
  units: {
    test_rad: { factor: 1 },
    test_deg: { factor: Math.PI / 180 },
  },
} as const);

const angle = Angle.quantity(180, "test_deg");
const radians = angle.convertTo("test_rad");
```

### New file: `tests/custom_dimension_types.test.ts`

Use `@ts-expect-error` to verify:

```ts
const angle = Angle.quantity(90, "test_deg");
angle.convertTo("test_rad");

// @ts-expect-error unrelated unit
angle.convertTo("test_m");

// @ts-expect-error undeclared unit
Angle.quantity(1, "test_invalid");
```

Also verify that:

- two quantities from the same custom dimension can be added even if their unit sets differ
- quantities from different dimensions cannot be added
- custom dimension names survive multiplication and division
- the resulting unit set for composite quantities is `string`
- a custom quantity is assignable to the expected `Quantity<Signature, Units>` type

## Phase 10: Registry Validation and Collision Policy

The removal of defaults makes registration order and ownership more important. Complete the validation rules from `PLAN.md` before removing the default catalog.

Validate before mutating the registries:

- dimension name is non-empty
- base-unit symbol is non-empty
- base-unit symbol exists in `units`
- every unit symbol is non-empty
- every conversion factor is finite
- every conversion factor is positive
- base-unit factor is `1`
- base-unit offset is `0` or absent
- duplicate dimension names are rejected by default
- duplicate unit symbols are rejected by default

Do not retain warning-and-overwrite behavior unless explicitly requested through an option.

If overwrite is supported, remove all units owned by the old dimension before adding the replacement. Add a test that confirms an old unit symbol cannot still be resolved after replacement.

The registry must never be populated as a side effect of importing a definition type, a signature type, or the quantity implementation.

## Phase 11: Remove or Replace Built-In Type Utilities

Review all public types that encode the former catalog:

- `DimensionName`
- `RegistryUnit`
- `LengthUnit`
- `MassUnit`
- `TimeUnit`
- `ElectricCurrentUnit`
- `TemperatureUnit`
- `AmountOfSubstanceUnit`
- `LuminousIntensityUnit`
- `AllowedUnit` branches for built-in dimensions

Recommended result:

- Remove `DimensionName` as a closed union.
- Remove `RegistryUnit` as a fixed union.
- Remove built-in unit aliases from the public engine API.
- Retain generic `DimensionUnitSymbols<Definition>` and `AllowedUnits<Definition>` helpers if useful.
- Deprecate or remove the old signature-only `AllowedUnit<DS>` because a signature alone cannot identify a custom unit set.

A dimension signature describes compatibility, not the complete set of symbols registered for that dimension. Unit metadata must remain attached to the typed quantity or returned dimension object.

## Phase 12: Documentation Changes

### File: `README.md`

Rewrite the introductory examples so they do not import `m`, `kg`, or `s` from the package.

The first working example should explicitly register dimensions:

```ts
import { defineDimension } from "@eng-tools/ts-units";

const Length = defineDimension({
  name: "Length",
  baseUnitSymbol: "m",
  units: {
    m: { factor: 1 },
    km: { factor: 1000 },
  },
} as const);

const distance = Length.quantity(5, "km");
console.log(distance.convertTo("m").value); // 5000
```

Add a clear statement that the library intentionally contains no pre-registered units or dimensions. Consumers own the catalog for their application.

Explain that this supports:

- domain-specific units
- avoiding accidental symbol collisions between applications
- explicit startup configuration
- smaller bundles or application-controlled registration
- type-safe unit sets per dimension

Remove the existing supported-dimensions list if it implies those dimensions are installed by default. It may be replaced with an example catalog section clearly labeled as user-defined.

### File: `DOCUMENTATION.md`

Update the API documentation to describe:

- engine-only package behavior
- empty initial registry
- `defineDimension`
- `DefinedDimension`
- `DimensionDefinition`
- `UnitSpec`
- `Quantity<DS, Units>`
- typed conversion
- raw `Q` runtime validation
- explicit registration requirements
- collision and duplicate-definition policies
- custom arithmetic and composite symbols
- the absence of built-in factories and aliases

Document failure behavior:

```ts
getUnitDefinition("m");
// throws until a caller registers a dimension containing "m"
```

Do not present any dimension or unit as supported by default. Examples may use familiar names such as `Length`, `m`, and `km`, but must define them first.

### Package metadata and examples

Search `deno.json`, `README.md`, `DOCUMENTATION.md`, scripts, and any generated-package configuration for references to:

- `registerStandardUnits`
- built-in factory exports
- built-in dimension aliases
- standard unit coverage
- `mod.ts` or other stale entrypoint names

Update any package-generation or declaration-generation workflow so the generated package exposes only the engine API.

## Phase 13: Build and Packaging Verification

After removing `src/units/index.ts` or moving it to test fixtures:

- verify no production source import references the removed module
- verify `scripts/build_npm.ts` still builds the package
- inspect generated declarations if the build emits them
- confirm the package entrypoint has no registration side effects
- confirm type-only exports do not cause runtime imports
- confirm the package can be imported in a clean process before any explicit registration

The build must not accidentally include a test fixture module that registers dimensions on import.

## Compatibility and Release Policy

This is an intentional breaking API change if the package currently documents or exports built-in factories and aliases.

The release should clearly state:

- `m`, `kg`, `s`, and other built-in factories are removed.
- built-in dimension aliases are removed or are no longer part of the public API.
- callers must define their dimensions before constructing quantities.
- importing the package no longer registers anything.
- previous applications must move their unit definitions into application startup code.

A compatibility layer should not silently reintroduce defaults. If migration helpers are needed, they should live in a separate opt-in package or example module that explicitly calls `defineDimension`.

## Definition of Done

The work is complete when all of the following are true:

- `src/index.ts` performs no standard registration at import time.
- No production module calls `defineDimension` automatically.
- The initial registry contains zero dimensions and zero units.
- `new Q(1, "m")` fails before a caller registers `m`.
- `defineDimension` registers all and only the units in its supplied definition.
- Custom unit symbols are available through typed dimension factories.
- Custom dimensions compose correctly in arithmetic.
- Invalid conversion targets fail both at compile time where possible and at runtime.
- Built-in factories and aliases no longer appear in the public API.
- Existing engine behavior passes after tests are rewritten around explicit registration.
- A clean package build succeeds.
- README and API documentation no longer imply that any default units exist.

## Implementation Sequence

1. Remove the `registerStandardUnits` import and invocation from `src/index.ts`.
2. Remove built-in dimension aliases and factory exports from `src/index.ts`.
3. Delete or relocate `src/units/index.ts` so it cannot participate in production initialization.
4. Search all production imports and remove stale references to the built-in catalog.
5. Confirm that `defineDimension` is the only registration entry point.
6. Complete the generic `DimensionDefinition`, `DefinedDimension`, and `Quantity<DS, Units>` type design.
7. Ensure raw `Q` construction fails for unregistered symbols.
8. Add or verify registry validation and collision behavior.
9. Rewrite existing tests to define local dimensions explicitly.
10. Add isolated no-default-registration tests.
11. Add custom runtime and compile-time tests.
12. Update public exports and remove fixed built-in type utilities.
13. Update README, API documentation, and package-build references.
14. Run type checking, tests, and package build in a clean process.
15. Inspect the final public API and confirm that no default registration path remains.

## Verification Commands

Run the full type check:

```bash
deno check --quiet $(find . -maxdepth 2 -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path './node_modules/*' | sort)
```

Run all tests:

```bash
deno task test
```

Run the package build:

```bash
deno task build_npm
```

For the no-default behavior, run an isolated entrypoint check in a fresh process if the test suite cannot guarantee registry isolation:

```bash
deno eval 'import { getAllDimensions, getUnitDefinition } from "./src/index.ts"; console.log(getAllDimensions().length); try { getUnitDefinition("m"); } catch (error) { console.log(error.message); }'
```

Expected initial output must indicate zero dimensions, followed by an error that `m` is not defined.
