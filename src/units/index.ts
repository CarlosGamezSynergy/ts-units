import { defineDimension, getDimensionDefinition } from "../utils/registry.ts";
import type { DimensionDefinition } from "../types/dimension.ts";

// --- Length ---
export const LENGTH_CONFIG: DimensionDefinition<"Length"> = {
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
} as const;
export type LengthUnit = keyof typeof LENGTH_CONFIG.units;

// --- Mass ---
export const MASS_CONFIG: DimensionDefinition<"Mass"> = {
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
} as const;
export type MassUnit = keyof typeof MASS_CONFIG.units;

// --- Time ---
export const TIME_CONFIG: DimensionDefinition<"Time"> = {
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
} as const;
export type TimeUnit = keyof typeof TIME_CONFIG.units;

// --- Electric Current ---
export const ELECTRIC_CURRENT_CONFIG: DimensionDefinition<"ElectricCurrent"> = {
    name: "ElectricCurrent",
    baseUnitSymbol: "A",
    units: {
        "A": { factor: 1 },
        "mA": { factor: 1e-3 },
        "kA": { factor: 1e3 },
        "µA": { factor: 1e-6 },
    }
} as const;
export type ElectricCurrentUnit = keyof typeof ELECTRIC_CURRENT_CONFIG.units;

// --- Temperature ---
export const TEMPERATURE_CONFIG: DimensionDefinition<"Temperature"> = {
    name: "Temperature",
    baseUnitSymbol: "K",
    units: {
        "K": { factor: 1 },
        "degC": { factor: 1, offset: 273.15 },
        "degF": { factor: 5/9, offset: 255.37222222222222 }, // (offset in K) = (0 degF in K) = 255.37...
                                                            // 0 F = -17.7778 C = 255.3722 K.
                                                            // Checking: T(K) = (T(F) - 32) * 5/9 + 273.15
                                                            // = T(F)*5/9 - 32*5/9 + 273.15
                                                            // = T(F)*5/9 + (-17.77... + 273.15)
                                                            // = T(F)*5/9 + 255.3722...
        "degR": { factor: 5/9 },
    }
} as const;
export type TemperatureUnit = keyof typeof TEMPERATURE_CONFIG.units;

// --- Amount of Substance ---
export const AMOUNT_OF_SUBSTANCE_CONFIG: DimensionDefinition<"AmountOfSubstance"> = {
    name: "AmountOfSubstance",
    baseUnitSymbol: "mol",
    units: {
        "mol": { factor: 1 },
        "mmol": { factor: 1e-3 },
        "kmol": { factor: 1e3 },
        "µmol": { factor: 1e-6 },
    }
} as const;
export type AmountOfSubstanceUnit = keyof typeof AMOUNT_OF_SUBSTANCE_CONFIG.units;

// --- Luminous Intensity ---
export const LUMINOUS_INTENSITY_CONFIG: DimensionDefinition<"LuminousIntensity"> = {
    name: "LuminousIntensity",
    baseUnitSymbol: "cd",
    units: {
        "cd": { factor: 1 },
        "mcd": { factor: 1e-3 },
        "kcd": { factor: 1e3 },
    }
} as const;
export type LuminousIntensityUnit = keyof typeof LUMINOUS_INTENSITY_CONFIG.units;


// Union of all registered simple units
export type RegistryUnit = 
    | LengthUnit 
    | MassUnit 
    | TimeUnit 
    | ElectricCurrentUnit 
    | TemperatureUnit 
    | AmountOfSubstanceUnit 
    | LuminousIntensityUnit;

export function registerStandardUnits() {
    const definitions = [LENGTH_CONFIG, MASS_CONFIG, TIME_CONFIG,
        ELECTRIC_CURRENT_CONFIG, TEMPERATURE_CONFIG,
        AMOUNT_OF_SUBSTANCE_CONFIG, LUMINOUS_INTENSITY_CONFIG];
    for (const definition of definitions) {
        try {
            getDimensionDefinition(definition.name);
        } catch {
            defineDimension(definition);
        }
    }
}
