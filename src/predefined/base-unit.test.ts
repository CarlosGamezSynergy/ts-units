import { assertAlmostEquals, assertEquals } from "@std/assert";
import * as tsu from "../index.ts";

function assertRawDefinition(
  definition: tsu.DefinedDimension<string, tsu.UnitMap>,
  expected: tsu.DimensionDefinition,
): void {
  assertEquals(
    {
      name: definition.name,
      baseUnitSymbol: definition.baseUnitSymbol,
      units: definition.units,
    },
    expected,
  );
}

/**
 * Tests for predefined base units.
 */

Deno.test("Check Length dimension exists", () => {
  const L = tsu.getDimensionDefinition("Length");
  assertRawDefinition(L, {
    name: tsu.Length.name,
    baseUnitSymbol: tsu.Length.baseUnitSymbol,
    units: tsu.Length.units,
  });
});

Deno.test("Check Mass dimension exists", () => {
  const M = tsu.getDimensionDefinition("Mass");
  assertRawDefinition(M, {
    name: tsu.Mass.name,
    baseUnitSymbol: tsu.Mass.baseUnitSymbol,
    units: tsu.Mass.units,
  });
});

Deno.test("Check Time dimension exists", () => {
  const T = tsu.getDimensionDefinition("Time");
  assertRawDefinition(T, {
    name: tsu.Time.name,
    baseUnitSymbol: tsu.Time.baseUnitSymbol,
    units: tsu.Time.units,
  });
});

Deno.test("Check ElectricCurrent dimension exists", () => {
  const E = tsu.getDimensionDefinition("ElectricCurrent");
  assertRawDefinition(E, {
    name: tsu.ElectricCurrent.name,
    baseUnitSymbol: tsu.ElectricCurrent.baseUnitSymbol,
    units: tsu.ElectricCurrent.units,
  });
});

Deno.test("Check Temperature dimension exists", () => {
  const Temp = tsu.getDimensionDefinition("Temperature");
  assertRawDefinition(Temp, {
    name: tsu.Temperature.name,
    baseUnitSymbol: tsu.Temperature.baseUnitSymbol,
    units: tsu.Temperature.units,
  });
});

Deno.test("Check AmountOfSubstance dimension exists", () => {
  const A = tsu.getDimensionDefinition("AmountOfSubstance");
  assertRawDefinition(A, {
    name: tsu.AmountOfSubstance.name,
    baseUnitSymbol: tsu.AmountOfSubstance.baseUnitSymbol,
    units: tsu.AmountOfSubstance.units,
  });
});

Deno.test("Check LuminousIntensity dimension exists", () => {
  const L = tsu.getDimensionDefinition("LuminousIntensity");
  assertRawDefinition(L, {
    name: tsu.LuminousIntensity.name,
    baseUnitSymbol: tsu.LuminousIntensity.baseUnitSymbol,
    units: tsu.LuminousIntensity.units,
  });
});

Deno.test("Check Length unit conversion", () => {
  const L = tsu.getDimensionDefinition("Length");
  assertEquals(L.units["km"].factor, 1000);
  assertEquals(L.units["cm"].factor, 0.01);
  assertEquals(L.units["mm"].factor, 0.001);
  assertEquals(L.units["ft"].factor, 0.3048);
  assertEquals(L.units["in"].factor, 0.0254);
});

Deno.test("Check Mass unit conversion", () => {
  const M = tsu.getDimensionDefinition("Mass");
  assertEquals(M.units["kg"].factor, 1);
  assertEquals(M.units["g"].factor, 0.001);
  assertEquals(M.units["mg"].factor, 1e-6);
  assertEquals(M.units["lb"].factor, 0.45359237);
  assertEquals(M.units["oz"].factor, 0.028349523125);
});

Deno.test("Check Time unit conversion", () => {
  const T = tsu.getDimensionDefinition("Time");
  assertEquals(T.units["s"].factor, 1);
  assertEquals(T.units["ms"].factor, 0.001);
  assertEquals(T.units["min"].factor, 60);
  assertEquals(T.units["h"].factor, 3600);
  assertEquals(T.units["d"].factor, 86400);
});

Deno.test("Check ElectricCurrent unit conversion", () => {
  const E = tsu.getDimensionDefinition("ElectricCurrent");
  assertEquals(E.units["A"].factor, 1);
  assertEquals(E.units["mA"].factor, 1e-3);
  assertEquals(E.units["kA"].factor, 1e3);
  assertEquals(E.units["µA"].factor, 1e-6);
});

Deno.test("Check Temperature unit conversion", () => {
  const Temp = tsu.getDimensionDefinition("Temperature");
  assertEquals(Temp.units["K"].factor, 1);
  assertEquals(Temp.units["degC"].factor, 1);
  assertEquals(Temp.units["degC"].offset, 273.15);
  assertEquals(Temp.units["degF"].factor, 5 / 9);
  assertEquals(Temp.units["degF"].offset, 255.37222222222222);
  assertEquals(Temp.units["degR"].factor, 5 / 9);
});

Deno.test("Check AmountOfSubstance unit conversion", () => {
  const A = tsu.getDimensionDefinition("AmountOfSubstance");
  assertEquals(A.units["mol"].factor, 1);
  assertEquals(A.units["mmol"].factor, 1e-3);
  assertEquals(A.units["kmol"].factor, 1e3);
  assertEquals(A.units["µmol"].factor, 1e-6);
});

Deno.test("Check LuminousIntensity unit conversion", () => {
  const L = tsu.getDimensionDefinition("LuminousIntensity");
  assertEquals(L.units["cd"].factor, 1);
  assertEquals(L.units["mcd"].factor, 1e-3);
  assertEquals(L.units["kcd"].factor, 1e3);
});

Deno.test("Check Length factories work correctly", () => {
  assertAlmostEquals(tsu.km(1).convertTo("m").value, 1000);
  assertAlmostEquals(tsu.m(1).convertTo("cm").value, 100);
  assertAlmostEquals(tsu.cm(1).convertTo("mm").value, 10);
  assertAlmostEquals(tsu.mm(1).convertTo("m").value, 0.001);
  assertAlmostEquals(tsu.ft(1).convertTo("in").value, 12);
  assertAlmostEquals(tsu.inch(1).convertTo("ft").value, 1 / 12);
});

Deno.test("Check Mass factories work correctly", () => {
  assertAlmostEquals(tsu.kg(1).convertTo("g").value, 1000);
  assertAlmostEquals(tsu.g(1).convertTo("mg").value, 1000);
  assertAlmostEquals(tsu.lb(1).convertTo("oz").value, 16);
});

Deno.test("Check Time factories work correctly", () => {
  assertAlmostEquals(tsu.s(1).convertTo("ms").value, 1000);
  assertAlmostEquals(tsu.ms(1).convertTo("s").value, 0.001);
  assertAlmostEquals(tsu.min(1).convertTo("s").value, 60);
  assertAlmostEquals(tsu.h(1).convertTo("s").value, 3600);
  assertAlmostEquals(tsu.d(1).convertTo("s").value, 86400);
});

Deno.test("Check ElectricCurrent factories work correctly", () => {
  assertAlmostEquals(tsu.A(1).convertTo("mA").value, 1000);
  assertAlmostEquals(tsu.mA(1).convertTo("A").value, 0.001);
  assertAlmostEquals(tsu.kA(1).convertTo("A").value, 1000);
  assertAlmostEquals(tsu.µA(1).convertTo("A").value, 1e-6);
});

Deno.test("Check Temperature factories work correctly", () => {
  assertAlmostEquals(tsu.K(1).convertTo("degC").value, -272.15);
  assertAlmostEquals(tsu.degC(1).convertTo("K").value, 274.15);
  assertAlmostEquals(tsu.degF(32).convertTo("K").value, 273.15);
  assertAlmostEquals(tsu.degR(1).convertTo("K").value, 5 / 9);
});

Deno.test("Check AmountOfSubstance factories work correctly", () => {
  assertAlmostEquals(tsu.mol(1).convertTo("mmol").value, 1000);
  assertAlmostEquals(tsu.mmol(1).convertTo("mol").value, 0.001);
  assertAlmostEquals(tsu.kmol(1).convertTo("mol").value, 1000);
  assertAlmostEquals(tsu.µmol(1).convertTo("mol").value, 1e-6);
});

Deno.test("Check LuminousIntensity factories work correctly", () => {
  assertAlmostEquals(tsu.cd(1).convertTo("mcd").value, 1000);
  assertAlmostEquals(tsu.mcd(1).convertTo("cd").value, 0.001);
  assertAlmostEquals(tsu.kcd(1).convertTo("cd").value, 1000);
});
