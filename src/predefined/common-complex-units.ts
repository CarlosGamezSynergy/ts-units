/**
 * This file is part of the ts-units library.
 * Defines common complex units derived from base units.
 * Provides definitions and conversions for complex units such as velocity, acceleration, and force.
 * Includes units like meters per second (m/s) for velocity, meters per second squared (m/s²) for acceleration, and newtons (N) for force.
 */

import { defineComplexDimension, defineDimension, defineEquivalence } from "../utils/registry.ts";

// // ==== GEOMETRY ====

export const Area = defineComplexDimension("Area", () => "Length ^ 2");

export const m2 = Area.factory("m^2")

export const Volume = defineComplexDimension("Volume", () => "Length ^ 3");

// ==== ELECTRICAL ENGINEERING ====

export const ElectricPotential = defineDimension({
    name: "ElectricPotential",
    baseUnitSymbol: "V",
    units: {
        V: { factor: 1 },
        mV: { factor: 1e-3 },
        kV: { factor: 1e3 }
    }
});


export const V = ElectricPotential.factory("V")
export const mV = ElectricPotential.factory("mV")
export const kV = ElectricPotential.factory("kV")

defineEquivalence("ElectricPotential", () => "(Mass * Length ^ 2) / (Time ^ 3 * ElectricCurrent)");

export const RealPower = defineDimension({
    name: "RealPower",
    baseUnitSymbol: "W",
    units: {
        W: { factor: 1 },
        mW: { factor: 1e-3 },
        kW: { factor: 1e3 }
    }
});

export const ApparentPower = defineDimension({
    name: "ApparentPower",
    baseUnitSymbol: "VA",
    units: {
        VA: { factor: 1 },
        mVA: { factor: 1e-3 },
        kVA: { factor: 1e3 }
    }
});

export const ReactivePower = defineDimension({
    name: "ReactivePower",
    baseUnitSymbol: "VAr",
    units: {
        VAr: { factor: 1 },
        mVAr: { factor: 1e-3 },
        kVAr: { factor: 1e3 }
    }
});

export const ElectricEnergy = defineComplexDimension("ElectricEnergy", () => "ElectricPotential * ElectricCurrent * Time");

export const ElectricCharge = defineComplexDimension("ElectricCharge", () => "ElectricCurrent * Time");
export const ElectricResistance = defineComplexDimension("ElectricResistance", () => "ElectricPotential / ElectricCurrent");
export const ElectricConductance = defineComplexDimension("ElectricConductance", () => "1 / ElectricResistance");

export const MagneticFlux = defineDimension({
    name: "MagneticFlux",
    baseUnitSymbol: "Wb",
    units: {
        Wb: { factor: 1 },
        mWb: { factor: 1e-3 },
        kWb: { factor: 1e3 },
    }
});

// ==== MECHANICAL ENGINEERING ====

export const Velocity = defineComplexDimension("Velocity", () => "Length / Time");
export const Acceleration = defineComplexDimension("Acceleration", () => "Length / Time ^ 2");

export const Force = defineDimension({
    name: "Force",
    baseUnitSymbol: "N",
    units: {
        N: { factor: 1 },
        kN: { factor: 1e3 },
        lbf: { factor: 4.44822 }
    }
});

export const Pressure = defineComplexDimension("Pressure", () => "Force / Area");
export const Torque = defineComplexDimension("Torque", () => "Force * Length");
export const MomentOfInertia = defineComplexDimension("MomentOfInertia", () => "Mass * Length ^ 2");
export const AngularMomentum = defineComplexDimension("AngularMomentum", () => "Mass * Length ^ 2 / Time");
export const Frequency = defineComplexDimension("Frequency", () => "1 / Time");