import { assertAlmostEquals, assertEquals, assertThrows } from "@std/assert";
import { defineComplexDimension, defineDimension, defineEquivalence } from "./registry.ts";

Deno.test("defineEquivalence allows a base dimension's quantity to be added to an equivalent complex-expression quantity", () => {
    const Mass = defineDimension({ name: "EqMass", baseUnitSymbol: "eqkg", units: { eqkg: { factor: 1 } } });
    const Length = defineDimension({ name: "EqLength", baseUnitSymbol: "eqm", units: { eqm: { factor: 1 } } });
    const Time = defineDimension({ name: "EqTime", baseUnitSymbol: "eqs", units: { eqs: { factor: 1 } } });
    const Force = defineDimension({ name: "EqForce", baseUnitSymbol: "eqN", units: { eqN: { factor: 1 } } });

    defineEquivalence("EqForce", () => "EqMass * EqLength / EqTime ^ 2");

    const forceQty = Force.quantity(3, "eqN");
    const derivedQty = Mass.quantity(2, "eqkg")
        .multiply(Length.quantity(1, "eqm"))
        .divide(Time.quantity(1, "eqs").pow(2));

    // Same canonical dimension, so addition should succeed and combine values in base units.
    const sum = forceQty.add(derivedQty as unknown as Parameters<typeof forceQty.add>[0]);
    assertAlmostEquals(sum.value, 5);
    assertEquals(forceQty.equals(derivedQty), false); // different magnitude
});

Deno.test("defineEquivalence makes equals/compare treat equivalent dimensions as equal", () => {
    defineDimension({ name: "EqMass2", baseUnitSymbol: "eqkg2", units: { eqkg2: { factor: 1 } } });
    defineDimension({ name: "EqLength2", baseUnitSymbol: "eqm2", units: { eqm2: { factor: 1 } } });
    defineDimension({ name: "EqTime2", baseUnitSymbol: "eqs2", units: { eqs2: { factor: 1 } } });
    const Force = defineDimension({ name: "EqForce2", baseUnitSymbol: "eqN2", units: { eqN2: { factor: 1 } } });

    defineEquivalence("EqForce2", () => "EqMass2 * EqLength2 / EqTime2 ^ 2");

    const forceQty = Force.quantity(4, "eqN2");
    const derivedDimension = defineComplexDimension("EqForce2Expr", () => "EqMass2 * EqLength2 / EqTime2 ^ 2");
    const derivedQty = derivedDimension.quantity(4, derivedDimension.baseUnitSymbol);

    assertEquals(forceQty.equals(derivedQty), true);
});

Deno.test("defineEquivalence throws when referencing an undefined dimension", () => {
    defineDimension({ name: "Solo", baseUnitSymbol: "solo", units: { solo: { factor: 1 } } });

    assertThrows(() => defineEquivalence("Solo", () => "NotDefinedDimension"));
});

Deno.test("defineEquivalence throws for an inconsistent redeclaration", () => {
    defineDimension({ name: "A1", baseUnitSymbol: "a1", units: { a1: { factor: 1 } } });
    defineDimension({ name: "B1", baseUnitSymbol: "b1", units: { b1: { factor: 1 } } });
    defineDimension({ name: "C1", baseUnitSymbol: "c1", units: { c1: { factor: 1 } } });
    defineDimension({ name: "EqX", baseUnitSymbol: "eqx", units: { eqx: { factor: 1 } } });

    defineEquivalence("EqX", () => "A1 * B1");

    assertThrows(() => defineEquivalence("EqX", () => "A1 * C1"));
});

Deno.test("defineEquivalence throws for a numeric-coefficient expression", () => {
    defineDimension({ name: "D1", baseUnitSymbol: "d1", units: { d1: { factor: 1 } } });
    defineDimension({ name: "EqY", baseUnitSymbol: "eqy", units: { eqy: { factor: 1 } } });

    assertThrows(() => defineEquivalence("EqY", () => "2 * D1"));
});

Deno.test("defineComplexDimension auto-registered equivalences unify transitively through chained complex dimensions", () => {
    defineDimension({ name: "MassZ", baseUnitSymbol: "mz", units: { mz: { factor: 1 } } });
    defineDimension({ name: "LengthZ", baseUnitSymbol: "lz", units: { lz: { factor: 1 } } });
    defineDimension({ name: "TimeZ", baseUnitSymbol: "tz", units: { tz: { factor: 1 } } });

    // ForceZ <-> MassZ * LengthZ / TimeZ^2 (explicit equivalence on a base dimension)
    const ForceZ = defineDimension({ name: "ForceZ", baseUnitSymbol: "fz", units: { fz: { factor: 1 } } });
    defineEquivalence("ForceZ", () => "MassZ * LengthZ / TimeZ ^ 2");

    // AreaZ <-> LengthZ^2 (implicit equivalence, auto-registered by defineComplexDimension)
    defineComplexDimension("AreaZ", () => "LengthZ ^ 2");

    // PressureZ <-> ForceZ / AreaZ, which transitively resolves to MassZ / (LengthZ * TimeZ^2)
    const PressureZ = defineComplexDimension("PressureZ", () => "ForceZ / AreaZ");
    const PressureZExpanded = defineComplexDimension("PressureZExpanded", () => "MassZ / (LengthZ * TimeZ ^ 2)");

    const pressureFromForce = PressureZ.quantity(1, PressureZ.baseUnitSymbol);
    const pressureFromExpansion = PressureZExpanded.quantity(1, PressureZExpanded.baseUnitSymbol);

    assertEquals(
        pressureFromForce.equals(pressureFromExpansion),
        true,
    );

    // Sanity check ForceZ itself still works standalone.
    const forceQty = ForceZ.quantity(1, "fz");
    assertEquals(forceQty.value, 1);
});
