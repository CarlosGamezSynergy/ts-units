import { assertEquals } from "@std/assert";
import * as tsu from "../index.ts";

Deno.test("ElectricPotential dimension should be defined", () => {
    const ElectricPotential = tsu.getDimensionDefinition("ElectricPotential");

    assertEquals(ElectricPotential, {
        name: tsu.ElectricPotential.name,
        baseUnitSymbol: tsu.ElectricPotential.baseUnitSymbol,
        units: tsu.ElectricPotential.units
    })
});

Deno.test("RealPower dimension should be defined", () => {
    const RealPower = tsu.getDimensionDefinition("RealPower");

    assertEquals(RealPower, {
        name: tsu.RealPower.name,
        baseUnitSymbol: tsu.RealPower.baseUnitSymbol,
        units: tsu.RealPower.units
    })
});

Deno.test("ApparentPower dimension should be defined", () => {
    const ApparentPower = tsu.getDimensionDefinition("ApparentPower");

    assertEquals(ApparentPower, {
        name: tsu.ApparentPower.name,
        baseUnitSymbol: tsu.ApparentPower.baseUnitSymbol,
        units: tsu.ApparentPower.units
    })
});

Deno.test("ReactivePower dimension should be defined", () => {
    const ReactivePower = tsu.getDimensionDefinition("ReactivePower");

    assertEquals(ReactivePower, {
        name: tsu.ReactivePower.name,
        baseUnitSymbol: tsu.ReactivePower.baseUnitSymbol,
        units: tsu.ReactivePower.units
    })
});

Deno.test("ElectricCharge dimension should be defined", () => {
    const ElectricCharge = tsu.getDimensionDefinition("ElectricCharge");

    assertEquals(ElectricCharge, {
        name: tsu.ElectricCharge.name,
        baseUnitSymbol: tsu.ElectricCharge.baseUnitSymbol,
        units: tsu.ElectricCharge.units
    })
});

Deno.test("ElectricResistance dimension should be defined", () => {
    const ElectricResistance = tsu.getDimensionDefinition("ElectricResistance");

    assertEquals(ElectricResistance, {
        name: tsu.ElectricResistance.name,
        baseUnitSymbol: tsu.ElectricResistance.baseUnitSymbol,
        units: tsu.ElectricResistance.units
    })
});

Deno.test("ElectricConductance dimension should be defined", () => {
    const ElectricConductance = tsu.getDimensionDefinition("ElectricConductance");

    assertEquals(ElectricConductance, {
        name: tsu.ElectricConductance.name,
        baseUnitSymbol: tsu.ElectricConductance.baseUnitSymbol,
        units: tsu.ElectricConductance.units
    })
});

Deno.test("MagneticFlux dimension should be defined", () => {
    const MagneticFlux = tsu.getDimensionDefinition("MagneticFlux");

    assertEquals(MagneticFlux, {
        name: tsu.MagneticFlux.name,
        baseUnitSymbol: tsu.MagneticFlux.baseUnitSymbol,
        units: tsu.MagneticFlux.units
    })
});

Deno.test("ElectricEnergy dimension should be defined", () => {
    const ElectricEnergy = tsu.getDimensionDefinition("ElectricEnergy");

    assertEquals(ElectricEnergy, {
        name: tsu.ElectricEnergy.name,
        baseUnitSymbol: tsu.ElectricEnergy.baseUnitSymbol,
        units: tsu.ElectricEnergy.units
    })
});

Deno.test("ElectricPotential units are equivalent to their base unit construction", () => {

    const s3 = tsu.s(1).multiply(tsu.s(1)).multiply(tsu.s(1));

    const voltsFromBaseUnits = tsu.kg(1).multiply(tsu.m2(1)).divide(s3.multiply(tsu.A(1)))

    const voltsFromDefinition = tsu.V(1);

    assertEquals(voltsFromBaseUnits.toString(), voltsFromDefinition.toString());
});