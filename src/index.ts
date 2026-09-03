import { registerStandardUnits } from "./units/index.ts";
import { Q, type Quantity } from "./quantity.ts";
export { defineDimension, getAllDimensions } from "./utils/registry.ts";
export type {
	DefinedDimension,
	DimensionDefinition,
	DimensionUnitSymbols,
	UnitDefinition,
	UnitMap,
	UnitSpec,
} from "./types/dimension.ts";

/**
 * Registers all standard units (SI and common imperial/US customary) to the global registry.
 * This must be called before using any unit factories or parsing composite units.
 */
registerStandardUnits();

export * from "./types/signature.ts";
export { Q } from "./quantity.ts";
export type { Quantity } from "./quantity.ts";

// --- Dimension Types ---

/** Represents a Length dimension (e.g., meters, feet). */
import type { LengthUnit, MassUnit, TimeUnit, ElectricCurrentUnit, TemperatureUnit, AmountOfSubstanceUnit, LuminousIntensityUnit } from "./units/index.ts";
export type Length = Quantity<{ Length: 1 }, LengthUnit>;
/** Represents a Mass dimension (e.g., kilograms, pounds). */
export type Mass = Quantity<{ Mass: 1 }, MassUnit>;
/** Represents a Time dimension (e.g., seconds, hours). */
export type Time = Quantity<{ Time: 1 }, TimeUnit>;
/** Represents an Electric Current dimension (e.g., amperes). */
export type ElectricCurrent = Quantity<{ ElectricCurrent: 1 }, ElectricCurrentUnit>;
/** Represents a Temperature dimension (e.g., Kelvin, Celsius). */
export type Temperature = Quantity<{ Temperature: 1 }, TemperatureUnit>;
/** Represents an Amount of Substance dimension (e.g., moles). */
export type AmountOfSubstance = Quantity<{ AmountOfSubstance: 1 }, AmountOfSubstanceUnit>;
/** Represents a Luminous Intensity dimension (e.g., candela). */
export type LuminousIntensity = Quantity<{ LuminousIntensity: 1 }, LuminousIntensityUnit>;

// --- Derived Types ---

/** Represents an Area dimension (Length^2). */
export type Area = Quantity<{ Length: 2 }>;
/** Represents a Volume dimension (Length^3). */
export type Volume = Quantity<{ Length: 3 }>;
/** Represents a Frequency dimension (Time^-1). */
export type Frequency = Quantity<{ Time: -1 }>;
/** Represents a Speed dimension (Length * Time^-1). */
export type Speed = Quantity<{ Length: 1; Time: -1 }>;
/** Represents an Acceleration dimension (Length * Time^-2). */
export type Acceleration = Quantity<{ Length: 1; Time: -2 }>;
/** Represents a Force dimension (Mass * Length * Time^-2). */
export type Force = Quantity<{ Mass: 1; Length: 1; Time: -2 }>;
/** Represents a Pressure dimension (Mass * Length^-1 * Time^-2). */
export type Pressure = Quantity<{ Mass: 1; Length: -1; Time: -2 }>;
/** Represents an Energy dimension (Mass * Length^2 * Time^-2). */
export type Energy = Quantity<{ Mass: 1; Length: 2; Time: -2 }>;
/** Represents a Power dimension (Mass * Length^2 * Time^-3). */
export type Power = Quantity<{ Mass: 1; Length: 2; Time: -3 }>;
/** Represents an Electric Charge dimension (ElectricCurrent * Time). */
export type ElectricCharge = Quantity<{ ElectricCurrent: 1; Time: 1 }>;
/** Represents a Voltage dimension (Mass * Length^2 * Time^-3 * ElectricCurrent^-1). */
export type Voltage = Quantity<{ Mass: 1; Length: 2; Time: -3; ElectricCurrent: -1 }>;


// --- Factory Functions ---

// Length
/** Creates a Length quantity in meters. */
export const m = (val: number) => new Q(val, "m") as Length;
/** Creates a Length quantity in kilometers. */
export const km = (val: number) => new Q(val, "km") as Length;
/** Creates a Length quantity in centimeters. */
export const cm = (val: number) => new Q(val, "cm") as Length;
/** Creates a Length quantity in millimeters. */
export const mm = (val: number) => new Q(val, "mm") as Length;
/** Creates a Length quantity in micrometers. */
export const µm = (val: number) => new Q(val, "µm") as Length;
/** Creates a Length quantity in nanometers. */
export const nm = (val: number) => new Q(val, "nm") as Length;
/** Creates a Length quantity in picometers. */
export const pm = (val: number) => new Q(val, "pm") as Length;
/** Creates a Length quantity in feet. */
export const ft = (val: number) => new Q(val, "ft") as Length;
/** Creates a Length quantity in inches. */
export const inch = (val: number) => new Q(val, "in") as Length; // 'in' is a keyword
/** Creates a Length quantity in yards. */
export const yd = (val: number) => new Q(val, "yd") as Length;
/** Creates a Length quantity in miles. */
export const mi = (val: number) => new Q(val, "mi") as Length;
/** Creates a Length quantity in nautical miles. */
export const nmi = (val: number) => new Q(val, "nmi") as Length;
/** Creates a Length quantity in astronomical units. */
export const au = (val: number) => new Q(val, "au") as Length;
/** Creates a Length quantity in light years. */
export const ly = (val: number) => new Q(val, "ly") as Length;
/** Creates a Length quantity in parsecs. */
export const pc = (val: number) => new Q(val, "pc") as Length;

// Mass
/** Creates a Mass quantity in kilograms. */
export const kg = (val: number) => new Q(val, "kg") as Mass;
/** Creates a Mass quantity in grams. */
export const g = (val: number) => new Q(val, "g") as Mass;
/** Creates a Mass quantity in milligrams. */
export const mg = (val: number) => new Q(val, "mg") as Mass;
/** Creates a Mass quantity in micrograms. */
export const µg = (val: number) => new Q(val, "µg") as Mass;
/** Creates a Mass quantity in tonnes. */
export const t = (val: number) => new Q(val, "t") as Mass;
/** Creates a Mass quantity in pounds. */
export const lb = (val: number) => new Q(val, "lb") as Mass;
/** Creates a Mass quantity in ounces. */
export const oz = (val: number) => new Q(val, "oz") as Mass;
/** Creates a Mass quantity in stones. */
export const st = (val: number) => new Q(val, "st") as Mass;
/** Creates a Mass quantity in short tons. */
export const ton = (val: number) => new Q(val, "ton") as Mass;
/** Creates a Mass quantity in long tons. */
export const lton = (val: number) => new Q(val, "lton") as Mass;

// Time
/** Creates a Time quantity in seconds. */
export const s = (val: number) => new Q(val, "s") as Time;
/** Creates a Time quantity in milliseconds. */
export const ms = (val: number) => new Q(val, "ms") as Time;
/** Creates a Time quantity in microseconds. */
export const µs = (val: number) => new Q(val, "µs") as Time;
/** Creates a Time quantity in nanoseconds. */
export const ns = (val: number) => new Q(val, "ns") as Time;
/** Creates a Time quantity in minutes. */
export const min = (val: number) => new Q(val, "min") as Time;
/** Creates a Time quantity in hours. */
export const h = (val: number) => new Q(val, "h") as Time;
/** Creates a Time quantity in days. */
export const d = (val: number) => new Q(val, "d") as Time;
/** Creates a Time quantity in weeks. */
export const wk = (val: number) => new Q(val, "wk") as Time;
/** Creates a Time quantity in years. */
export const yr = (val: number) => new Q(val, "yr") as Time;

// Electric Current
/** Creates an ElectricCurrent quantity in amperes. */
export const A = (val: number) => new Q(val, "A") as ElectricCurrent;
/** Creates an ElectricCurrent quantity in milliamperes. */
export const mA = (val: number) => new Q(val, "mA") as ElectricCurrent;
/** Creates an ElectricCurrent quantity in kiloamperes. */
export const kA = (val: number) => new Q(val, "kA") as ElectricCurrent;
/** Creates an ElectricCurrent quantity in microamperes. */
export const µA = (val: number) => new Q(val, "µA") as ElectricCurrent;

// Temperature
/** Creates a Temperature quantity in Kelvin. */
export const K = (val: number) => new Q(val, "K") as Temperature;
/** Creates a Temperature quantity in degrees Celsius. */
export const degC = (val: number) => new Q(val, "degC") as Temperature;
/** Creates a Temperature quantity in degrees Fahrenheit. */
export const degF = (val: number) => new Q(val, "degF") as Temperature;
/** Creates a Temperature quantity in degrees Rankine. */
export const degR = (val: number) => new Q(val, "degR") as Temperature;

// Amount of Substance
/** Creates an AmountOfSubstance quantity in moles. */
export const mol = (val: number) => new Q(val, "mol") as AmountOfSubstance;
/** Creates an AmountOfSubstance quantity in millimoles. */
export const mmol = (val: number) => new Q(val, "mmol") as AmountOfSubstance;
/** Creates an AmountOfSubstance quantity in kilomoles. */
export const kmol = (val: number) => new Q(val, "kmol") as AmountOfSubstance;
/** Creates an AmountOfSubstance quantity in micromoles. */
export const µmol = (val: number) => new Q(val, "µmol") as AmountOfSubstance;

// Luminous Intensity
/** Creates a LuminousIntensity quantity in candelas. */
export const cd = (val: number) => new Q(val, "cd") as LuminousIntensity;
/** Creates a LuminousIntensity quantity in millicandelas. */
export const mcd = (val: number) => new Q(val, "mcd") as LuminousIntensity;
/** Creates a LuminousIntensity quantity in kilocandelas. */
export const kcd = (val: number) => new Q(val, "kcd") as LuminousIntensity;
