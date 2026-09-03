import { assertEquals } from "@std/assert";
import { defineComplexDimension, defineDimension, getAllDimensions, getDimensionDefinition } from "../src/index.ts";

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

Deno.test("defineComplexDimension generates units from registered dimensions", () => {
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

    const Speed = defineComplexDimension("Speed", () => "Length / Time");

    assertEquals(getDimensionDefinition("Speed").units, {
        "m/s": { factor: 1 },
        "m/ms": { factor: 1000 },
        "m/min": { factor: 1 / 60 },
        "m/h": { factor: 1 / 3600 },
        "cm/s": { factor: 0.01 },
        "cm/ms": { factor: 10 },
        "cm/min": { factor: 0.01 / 60 },
        "cm/h": { factor: 0.01 / 3600 },
        "mm/s": { factor: 0.001 },
        "mm/ms": { factor: 1 },
        "mm/min": { factor: 0.001 / 60 },
        "mm/h": { factor: 0.001 / 3600 },
    });

    const quantityInMps = Speed.quantity(10, "m/s");
    assertEquals(quantityInMps.value, 10);
    assertEquals(quantityInMps.unitSymbol, "m/s");

    const quantityInCmPerHour = quantityInMps.convertTo("cm/h");
    assertEquals(quantityInCmPerHour.value, 10 / 0.01 * 3600);
    assertEquals(quantityInCmPerHour.unitSymbol, "cm/h");

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

Deno.test("defineComplexDimension supports ^ operator", () => {
    defineComplexDimension("Area", () => "Length ^ 2");
    const LengthTime = defineComplexDimension("LengthTime", () => "Length * Time");
    const Acceleration = defineComplexDimension("Acceleration", () => "Length / Time ^ 2");

    assertEquals(getDimensionDefinition("Area").units["cm^2"].factor, 0.0001);
    assertEquals(LengthTime.quantity(1, "m*min").convertTo("cm*s").value, 6000);
    assertEquals(Acceleration.quantity(1, "m/s^2").convertTo("cm/min^2").value, 360000);
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

Deno.test("unit comparison operations work correctly", () => {
    const quantity1 = Length.quantity(1, "m");
    const quantity2 = Length.quantity(100, "cm");

    assertEquals(quantity1.equals(quantity2), true);
    assertEquals(quantity1.isLessThan(quantity2), false);
    assertEquals(quantity1.isGreaterThan(quantity2), false);

    const quantity3 = Length.quantity(2, "m");
    assertEquals(quantity1.equals(quantity3), false);
    assertEquals(quantity1.isLessThan(quantity3), true);
    assertEquals(quantity1.isGreaterThan(quantity3), false);
});

Deno.test("getAllDimensions returns all registered dimensions", () => {
    const dimensions = getAllDimensions();
    const dimensionNames = dimensions.map(d => d.name);
    assertEquals(dimensionNames.includes("Length"), true);
    assertEquals(dimensionNames.includes("Time"), true);
    assertEquals(dimensionNames.includes("Speed"), true);
    assertEquals(dimensionNames.includes("Area"), true);
    assertEquals(dimensionNames.includes("LengthTime"), true);
    assertEquals(dimensionNames.includes("Acceleration"), true);
});

Deno.test("getDimensionDefinition returns the correct dimension definition", () => {
    const lengthDef = getDimensionDefinition("Length");
    assertEquals(lengthDef.name, "Length");
    assertEquals(lengthDef.baseUnitSymbol, "m");
    assertEquals(lengthDef.units["cm"].factor, 0.01);

    const timeDef = getDimensionDefinition("Time");
    assertEquals(timeDef.name, "Time");
    assertEquals(timeDef.baseUnitSymbol, "s");
    assertEquals(timeDef.units["min"].factor, 60);
});

Deno.test("getDimensionDefinition throws error for non-existent dimension", () => {
    try {
        getDimensionDefinition("NonExistentDimension");
    } catch (e) {
        assertEquals((e as Error).message, 'Dimension "NonExistentDimension" is not defined.');
    }
});

Deno.test("defineComplexDimension throws error for non-existent component dimension", () => {
    try {
        defineComplexDimension("InvalidComplexDimension", () => "Length * NonExistentDimension");
    } catch (e) {
        assertEquals((e as Error).message, 'Dimension "NonExistentDimension" is not defined.');
    }
});

Deno.test("unit serialization and deserialization works correctly", () => {
    const quantity = Length.quantity(1, "m");
    const serialized = quantity.toJSON();
    assertEquals(serialized, { value: 1, unit: "m" });

    const deserializedQuantity = Length.quantity(serialized.value, serialized.unit as keyof typeof Length.units);
    assertEquals(deserializedQuantity.value, 1);
    assertEquals(deserializedQuantity.unitSymbol, "m");
});

Deno.test("defineComplexDimension throws error for non-zero offset units", () => {
    defineDimension({
        name: "Temperature",
        baseUnitSymbol: "K",
        units: {
            "K": { factor: 1 },
            "C": { factor: 1, offset: 273.15 }
        }
    } as const);

    try {
        defineComplexDimension("InvalidComplexDimension", () => "Length * Temperature");
    } catch (e) {
        assertEquals((e as Error).message, 'Cannot compose unit "C" with a non-zero offset.');
    }
});