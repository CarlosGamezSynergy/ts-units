/**
 * This file is part of the ts-units project.
 * It defines the base units for various dimensions, such as Length, Time, Mass, etc.
 * Each dimension is defined with its name, base unit symbol, and a set of units with their conversion factors.
 * The defineDimension function is used to register these dimensions and their units in the system.
 * 
 * The base dimensions and units defined here are all seven of the SI base units, along with some additional commonly used units for each dimension.
 * 
 * The dimensions defined in this file are:
 * - Length: meters (m), centimeters (cm), millimeters (mm), kilometers (km), inches (in), feet (ft), yards (yd), miles (mi)
 * - Time: seconds (s), minutes (min), hours (h), days (d)
 * - Mass: kilograms (kg), grams (g), milligrams (mg), pounds (lb), ounces (oz)
 * - Electric Current: amperes (A), milliamperes (mA), kiloamperes (kA)
 * - Temperature: kelvin (K), degrees Celsius (°C), degrees Fahrenheit (°F)
 * - Amount of Substance: moles (mol), millimoles (mmol), kilomoles (kmol)
 * - Luminous Intensity: candelas (cd), millicandelas (mcd), kilocandelas (kcd)
 */

import { defineDimension } from "../utils/registry.ts";

export const Length = defineDimension({
    name: "Length",
    baseUnitSymbol: "m",
    units: {
        "m": { factor: 1 },
        "km": { factor: 1000 },
        "cm": { factor: 0.01 },
        "mm": { factor: 0.001 },
        "µm": { factor: 1e-6 },
        "nm": { factor: 1e-9 },
        "pm": { factor: 1e-12 },
        "ft": { factor: 0.3048 },
        "in": { factor: 0.0254 },
        "yd": { factor: 0.9144 },
        "mi": { factor: 1609.344 },
        "nmi": { factor: 1852 },
        "au": { factor: 1.495978707e11 },
        "ly": { factor: 9.4607304725808e15 },
        "pc": { factor: 3.08567758149137e16 },
    },
} as const);

// Define Length factories
export const m = Length.factory("m");
export const km = Length.factory("km");
export const cm = Length.factory("cm");
export const mm = Length.factory("mm");
export const ft = Length.factory("ft");
export const inch = Length.factory("in");
export const yd = Length.factory("yd");
export const mi = Length.factory("mi");
export const nmi = Length.factory("nmi");
export const au = Length.factory("au");
export const ly = Length.factory("ly");
export const pc = Length.factory("pc");

export const Mass = defineDimension({
    name: "Mass",
    baseUnitSymbol: "kg",
    units: {
        "kg": { factor: 1 },
        "g": { factor: 0.001 },
        "mg": { factor: 1e-6 },
        "µg": { factor: 1e-9 },
        "t": { factor: 1000 },
        "lb": { factor: 0.45359237 },
        "oz": { factor: 0.028349523125 },
        "st": { factor: 6.35029318 },
        "ton": { factor: 907.18474 }, // US short ton
        "lton": { factor: 1016.0469088 }, // Imperial long ton
    },
} as const);

// Define Mass factories
export const kg = Mass.factory("kg");
export const g = Mass.factory("g");
export const mg = Mass.factory("mg");
export const µg = Mass.factory("µg");
export const t = Mass.factory("t");
export const lb = Mass.factory("lb");
export const oz = Mass.factory("oz");
export const st = Mass.factory("st");
export const ton = Mass.factory("ton");
export const lton = Mass.factory("lton");

export const Time = defineDimension({
    name: "Time",
    baseUnitSymbol: "s",
    units: {
        "s": { factor: 1 },
        "ms": { factor: 0.001 },
        "µs": { factor: 1e-6 },
        "ns": { factor: 1e-9 },
        "min": { factor: 60 },
        "h": { factor: 3600 },
        "d": { factor: 86400 },
        "wk": { factor: 604800 },
        "yr": { factor: 31557600 }, // Julian year
    },
} as const);

// Define Time factories
export const s = Time.factory("s");
export const ms = Time.factory("ms");
export const µs = Time.factory("µs");
export const ns = Time.factory("ns");
export const min = Time.factory("min");
export const h = Time.factory("h");
export const d = Time.factory("d");
export const wk = Time.factory("wk");
export const yr = Time.factory("yr");

export const ElectricCurrent = defineDimension({
    name: "ElectricCurrent",
    baseUnitSymbol: "A",
    units: {
        "A": { factor: 1 },
        "mA": { factor: 1e-3 },
        "kA": { factor: 1e3 },
        "µA": { factor: 1e-6 },
    }
} as const);

// Define ElectricCurrent factories
export const A = ElectricCurrent.factory("A");
export const mA = ElectricCurrent.factory("mA");
export const kA = ElectricCurrent.factory("kA");
export const µA = ElectricCurrent.factory("µA");

export const Temperature = defineDimension({
    name: "Temperature",
    baseUnitSymbol: "K",
    units: {
        "K": { factor: 1 },
        "degC": { factor: 1, offset: 273.15 },
        "degF": { factor: 5 / 9, offset: 255.37222222222222 }, // (offset in K) = (0 degF in K) = 255.37...
        // 0 F = -17.7778 C = 255.3722 K.
        // Checking: T(K) = (T(F) - 32) * 5/9 + 273.15
        // = T(F)*5/9 - 32*5/9 + 273.15
        // = T(F)*5/9 + (-17.77... + 273.15)
        // = T(F)*5/9 + 255.3722...
        "degR": { factor: 5 / 9 },
    }
} as const);

// Define Temperature factories
export const K = Temperature.factory("K");
export const degC = Temperature.factory("degC");
export const degF = Temperature.factory("degF");
export const degR = Temperature.factory("degR");

export const AmountOfSubstance = defineDimension({
    name: "AmountOfSubstance",
    baseUnitSymbol: "mol",
    units: {
        "mol": { factor: 1 },
        "mmol": { factor: 1e-3 },
        "kmol": { factor: 1e3 },
        "µmol": { factor: 1e-6 },
    }
} as const);

// Define AmountOfSubstance factories
export const mol = AmountOfSubstance.factory("mol");
export const mmol = AmountOfSubstance.factory("mmol");
export const kmol = AmountOfSubstance.factory("kmol");
export const µmol = AmountOfSubstance.factory("µmol");

export const LuminousIntensity = defineDimension({
    name: "LuminousIntensity",
    baseUnitSymbol: "cd",
    units: {
        "cd": { factor: 1 },
        "mcd": { factor: 1e-3 },
        "kcd": { factor: 1e3 },
    }
} as const);

// Define LuminousIntensity factories
export const cd = LuminousIntensity.factory("cd");
export const mcd = LuminousIntensity.factory("mcd");
export const kcd = LuminousIntensity.factory("kcd");