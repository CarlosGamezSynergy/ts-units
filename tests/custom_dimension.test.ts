import { assertAlmostEquals, assertEquals, assertThrows } from "@std/assert";
import { defineDimension, m, s } from "../src/index.ts";

const Angle = defineDimension({
  name: "TestAngle",
  baseUnitSymbol: "trad",
  units: {
    trad: { factor: 1 },
    tdeg: { factor: Math.PI / 180 },
  },
} as const);

Deno.test("custom dimensions create and convert quantities", () => {
  const angle = Angle.quantity(180, "tdeg");
  assertEquals(angle.unitSymbol, "tdeg");
  assertAlmostEquals(angle.convertTo("trad").value, Math.PI);
  assertAlmostEquals(angle.convertTo("tdeg").value, 180);
  assertEquals(angle.equals(Angle.quantity(Math.PI, "trad")), true);
  assertEquals(angle.add(Angle.quantity(180, "tdeg")).value, 360);
  assertAlmostEquals(angle.subtract(Angle.quantity(Math.PI, "trad")).value, 0);
});

Deno.test("custom dimensions compose with built-in dimensions", () => {
  const angle = Angle.quantity(3, "trad");
  const product = m(2).multiply(angle);
  const rate = angle.divide(s(2));

  assertEquals(product._dimensionSignature, { Length: 1, TestAngle: 1 });
  assertEquals(rate._dimensionSignature, { TestAngle: 1, Time: -1 });
  assertEquals(product.unitSymbol, "m.trad");
  assertEquals(rate.unitSymbol, "trad/s");
});

Deno.test("custom dimension runtime validation", () => {
  assertThrows(() => Angle.quantity(1, "unknown" as "trad"));
  assertThrows(() => Angle.quantity(1, "trad").convertTo("m" as "trad"));
  assertThrows(() => defineDimension({
    name: "InvalidFactor",
    baseUnitSymbol: "if-base",
    units: { "if-base": { factor: 0 } },
  } as const));
  assertThrows(() => defineDimension({
    name: "InvalidBase",
    baseUnitSymbol: "ib-base",
    units: { "ib-base": { factor: 2 } },
  } as const));
  assertThrows(() => defineDimension({
    name: "TestAngle",
    baseUnitSymbol: "other-angle",
    units: { "other-angle": { factor: 1 } },
  } as const));
});
