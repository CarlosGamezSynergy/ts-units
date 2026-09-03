import { assertEquals } from "@std/assert";
import { defineDimension } from "../src/index.ts";

const Length = defineDimension({
    name: "Length",
    baseUnitSymbol: "m",
    units: {
        "m": { factor: 1 },
        "cm": { factor: 0.01 }
    }
} as const);

Deno.test("defineDimension registers new dimension and units correctly", () => {
    const quantity = Length.quantity(1, "m");
    assertEquals(quantity.value, 1);
    assertEquals(quantity.unitSymbol, "m");
});

Deno.test("defineDimension allows creating quantities with different units", () => {
    const quantityInCm = Length.quantity(100, "cm");
    assertEquals(quantityInCm.value, 100);
    assertEquals(quantityInCm.unitSymbol, "cm");
});

Deno.test("defineDimension allows converting between units", () => {
    const quantityInM = Length.quantity(1, "m");
    const quantityInCm = quantityInM.convertTo("cm");
    assertEquals(quantityInCm.value, 100);
    assertEquals(quantityInCm.unitSymbol, "cm");
});

Deno.test("defineDimension allows creating factory functions for units", () => {
    const cmFactory = Length.factory("cm");
    const quantityInCm = cmFactory(50);
    assertEquals(quantityInCm.value, 50);
    assertEquals(quantityInCm.unitSymbol, "cm");
});

Deno.test("defineDimension throws error for duplicate dimension name without overwrite", () => {
    try {
        defineDimension({
            name: "Length",
            baseUnitSymbol: "m",
            units: {
                "m": { factor: 1 },
                "cm": { factor: 0.01 }
            }
        } as const);
    } catch (e) {
        assertEquals((e as Error).message, 'Dimension name "Length" is already defined and overwrite is not allowed.');
    }
});

Deno.test("defineDimension allows overwriting existing dimension when overwrite is true", () => {
    const NewLength = defineDimension({
        name: "Length",
        baseUnitSymbol: "m",
        units: {
            "m": { factor: 1 },
            "cm": { factor: 0.01 },
            "mm": { factor: 0.001 }
        }
    } as const, { overwrite: true });

    const quantity = NewLength.quantity(1, "m");
    assertEquals(quantity.convertTo("mm").value, 1000);
});

Deno.test("defineDimension throws error for empty dimension name", () => {
    try {
        defineDimension({
            name: "",
            baseUnitSymbol: "m",
            units: {
                "m": { factor: 1 },
                "cm": { factor: 0.01 }
            }
        } as const);
    } catch (e) {
        assertEquals((e as Error).message, "Dimension name must be non-empty.");
    }
});

Deno.test("defineDimension throws error for empty base unit symbol", () => {
    try {
        defineDimension({
            name: "Time",
            // @ts-ignore: base unit symbol is empty
            baseUnitSymbol: "",
            units: {
                "s": { factor: 1 },
                "ms": { factor: 0.001 }
            }
        } as const);
    } catch (e) {
        assertEquals((e as Error).message, 'Base unit symbol for dimension "Time" must be non-empty.');
    }
});

Deno.test("defineDimension throws error if base unit is not declared in units", () => {
    try {
        defineDimension({
            name: "Mass",
            // @ts-ignore: base unit "m" is not declared in units
            baseUnitSymbol: "kg",
            units: {
                "gm": { factor: 0.01 }
            }
        } as const);
    } catch (e) {
        assertEquals((e as Error).message, 'Base unit "kg" is not declared for dimension "Mass".');
    }
});

Deno.test("defineDimension can define compound dimensions", () => {
    const Time = defineDimension({
        name: "Time",
        baseUnitSymbol: "s",
        units: {
            "s": { factor: 1 },
            "ms": { factor: 0.001 },
            "min": { factor: 60 },
            "h": { factor: 3600 }
        }
    } as const);

    const Speed = defineDimension({
        name: "Speed",
        baseUnitSymbol: "m/s",
        units: {
            "m/s": { factor: 1 },
            "km/h": { factor: 0.2777777778 }
        }
    } as const);

    const quantityInMps = Speed.quantity(10, "m/s");
    assertEquals(quantityInMps.value, 10);
    assertEquals(quantityInMps.unitSymbol, "m/s");

    const quantityInKmph = quantityInMps.convertTo("km/h");
    assertEquals(Math.round(quantityInKmph.value), 36);
    assertEquals(quantityInKmph.unitSymbol, "km/h");

    const quantityInSeconds = Time.quantity(120, "s");
    assertEquals(quantityInSeconds.value, 120);
    assertEquals(quantityInSeconds.unitSymbol, "s");

    const quantityInMinutes = quantityInSeconds.convertTo("min");
    assertEquals(quantityInMinutes.value, 2);
    assertEquals(quantityInMinutes.unitSymbol, "min");

    const quantityInHours = quantityInSeconds.convertTo("h");
    assertEquals(quantityInHours.value, 0.03333333333333333);
    assertEquals(quantityInHours.unitSymbol, "h");
});

Deno.test("unit binary operations work correctly", () => {
    const quantity1 = Length.quantity(1, "m");
    const quantity2 = Length.quantity(100, "cm");

    const sum = quantity1.add(quantity2);
    assertEquals(sum.value, 2);
    assertEquals(sum.unitSymbol, "m");

    const difference = quantity1.subtract(quantity2);
    assertEquals(difference.value, 0);
    assertEquals(difference.unitSymbol, "m");

    const product = quantity1.multiply(quantity2);
    assertEquals(product.value, 1);
    assertEquals(product.unitSymbol, "m^2");

    const quotient = quantity1.divide(quantity2);
    assertEquals(quotient.value, 1);
    assertEquals(quotient.unitSymbol, "dimensionless");
});
