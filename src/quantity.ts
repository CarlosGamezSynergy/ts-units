// @ts-ignore: used for registry side effects
import type { DimensionSignature, CombineDimensionSignatures, DivideDimensionSignatures, ScaleDimensionSignature } from "./types/signature.ts";
import { getUnitDefinition, getDimensionDefinition } from "./utils/registry.ts";

// Using a unique symbol for branding to achieve nominal typing
const dimensionBrand = Symbol("dimensionBrand");

// Base type for Quantity
/**
 * Base interface for a Quantity, representing a scalar value with a specific dimension.
 * @template DS The dimension signature (e.g., { Length: 1 }).
 */
export interface Quantity<DS extends DimensionSignature, Units extends string = string> {
  readonly [dimensionBrand]: DS;
  value: number;
  unitSymbol: string; 
  // Internal (but needed for inter-instance operations)
  readonly _dimensionSignature: DS;
  readonly _valueInBaseUnits: number;

  // Core Operations
  /**
   * Adds another quantity of the same dimension.
   * @param other The quantity to add.
   * @returns A new quantity representing the sum.
   * @throws Error if dimensions do not match.
   */
  add<OtherUnits extends string>(
    other: Quantity<DS, OtherUnits>
  ): Quantity<DS, Units>;

  /**
   * Subtracts another quantity of the same dimension.
   * @param other The quantity to subtract.
   * @returns A new quantity representing the difference.
   * @throws Error if dimensions do not match.
   */
  subtract<OtherUnits extends string>(
    other: Quantity<DS, OtherUnits>
  ): Quantity<DS, Units>;

  /**
   * Multiplies by another quantity.
   * @param other The quantity to multiply by.
   * @returns A new quantity with the combined dimension.
   */
  multiply<OtherDS extends DimensionSignature, OtherUnits extends string>(
    other: Quantity<OtherDS, OtherUnits>
  ): Quantity<CombineDimensionSignatures<DS, OtherDS>, string>;

  /**
   * Divides by another quantity.
   * @param other The quantity to divide by.
   * @returns A new quantity with the resulting dimension.
   * @throws Error if dividing by zero.
   */
  divide<OtherDS extends DimensionSignature, OtherUnits extends string>(
    other: Quantity<OtherDS, OtherUnits>
  ): Quantity<DivideDimensionSignatures<DS, OtherDS>, string>;

  /**
   * Raises this quantity to an integer power.
   * @param exponent The integer exponent.
   * @returns A new quantity with each dimension exponent scaled accordingly.
   */
  pow<Exponent extends number>(exponent: Exponent): Quantity<ScaleDimensionSignature<DS, Exponent>, string>;

  /**
   * Converts the quantity to a different unit of the same dimension.
   * @param targetUnitSymbol The symbol of the target unit (e.g., "km").
   * @returns A new Q instance in the target unit.
   * @throws Error if the target unit is incompatible.
   */
  convertTo<TargetUnit extends Units>(targetUnitSymbol: TargetUnit): Quantity<DS, TargetUnit>;

  // Comparisons
  /** Checks if this quantity is equal to another (within a small tolerance). */
  equals(other: Quantity<DS, string>): boolean;
  /** Checks if this quantity is strictly less than another. */
  isLessThan(other: Quantity<DS, string>): boolean;
  /** Checks if this quantity is strictly greater than another. */
  isGreaterThan(other: Quantity<DS, string>): boolean;

  // Interop
  valueOf(): number;
  toString(): string;
  toJSON(): { value: number; unit: string };
}

/**
 * Concrete implementation of the Quantity interface.
 */
export class Q<
  CurrentUnitSymbol extends string,
  DS extends DimensionSignature,
  Units extends string = CurrentUnitSymbol,
> implements Quantity<DS, Units>
{
  readonly [dimensionBrand]!: DS;
  public readonly value: number;
  public readonly unitSymbol: CurrentUnitSymbol;

  public readonly _valueInBaseUnits: number;
  public readonly _dimensionSignature: DS;

  /**
   * Creates a new Quantity instance.
   * @param value The numerical value.
   * @param unitSymbol The unit symbol (e.g., "m", "kg").
   */
  constructor(value: number, unitSymbol: CurrentUnitSymbol) {
    const unitDef = getUnitDefinition(unitSymbol);
    
    this.value = value;
    this.unitSymbol = unitSymbol;
    this._valueInBaseUnits = value * unitDef.factor + (unitDef.offset ?? 0);

    // For simple units, signature is { DimensionName: 1 }
    // NOTE: This construct is primarily for starting from a known simple unit.
    this._dimensionSignature = { [unitDef.dimensionName]: 1 } as unknown as DS; 
  }

  // --- Static Factories ---

  private static create<
    NewUnitSymbol extends string,
    NewDS extends DimensionSignature,
    NewUnits extends string = NewUnitSymbol,
  >(
    valueInBaseUnits: number,
    targetUnitSymbol: NewUnitSymbol,
    dimensionSignature: NewDS
  ): Q<NewUnitSymbol, NewDS, NewUnits> {
    const targetUnitDef = getUnitDefinition(targetUnitSymbol); // Throws if not found, handling logic below for composite units needs care
    
    // Calculate value in target unit
    // Note: This logic assumes targetUnitSymbol is a registered unit.
    // Use `fromValueInBaseUnits` for derived logic.
    const valueInTargetUnit = (valueInBaseUnits - (targetUnitDef.offset ?? 0)) / targetUnitDef.factor;

    const q = Object.create(Q.prototype) as Q<NewUnitSymbol, NewDS, NewUnits>;
    // @ts-ignore: partial initialization for safe private construction
    q.value = valueInTargetUnit;
    // @ts-ignore: safe
    q.unitSymbol = targetUnitSymbol;
    // @ts-ignore: safe
    q._valueInBaseUnits = valueInBaseUnits;
    // @ts-ignore: safe
    q._dimensionSignature = dimensionSignature;
    return q;
  }

  // --- Dimension Logic ---

  /** Converts a dimension signature to a string representation (e.g., "Length^1.Time^-1"). */
  static signatureToString(sig: DimensionSignature): string {
    return Object.entries(sig)
      .filter(([, power]) => power !== 0)
      .map(([dim, power]) => (power === 1 ? dim : `${dim}^${power}`))
      .join(".");
  }

  /** Checks if two dimension signatures are equal. */
  static areDimensionSignaturesEqual(
    sig1: DimensionSignature,
    sig2: DimensionSignature
  ): boolean {
    const keys1 = Object.keys(sig1);
    const keys2 = Object.keys(sig2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (sig1[key] !== sig2[key]) return false;
    }
    return true;
  }

   /** Combines two dimension signatures (addition of exponents). */
   static combineSignatures(
    sig1: DimensionSignature,
    sig2: DimensionSignature
  ): DimensionSignature {
    const resultSig: Record<string, number> = { ...sig1 };
    for (const dimName in sig2) {
      resultSig[dimName] = (resultSig[dimName] || 0) + sig2[dimName];
    }
    // Cleanup zeros
    for (const dimName in resultSig) {
      if (resultSig[dimName] === 0) delete resultSig[dimName];
    }
    return Object.freeze(resultSig);
  }

  /** Divides two dimension signatures (subtraction of exponents). */
  static divideSignatures(
    sig1: DimensionSignature,
    sig2: DimensionSignature
  ): DimensionSignature {
    const resultSig: Record<string, number> = { ...sig1 };
    for (const dimName in sig2) {
      resultSig[dimName] = (resultSig[dimName] || 0) - sig2[dimName];
    }
    for (const dimName in resultSig) {
      if (resultSig[dimName] === 0) delete resultSig[dimName];
    }
    return Object.freeze(resultSig);
  }

  /** Derives a composite unit symbol string from a dimension signature. */
  static deriveCompositeUnitSymbol(sig: DimensionSignature): string {
    if (Object.keys(sig).length === 0) return "dimensionless";
    if (Object.keys(sig).length === 1) {
      const [dimName, power] = Object.entries(sig)[0];
      if (power === 1) {
        // Try to look up base unit
        // We can't easily look up by dimension name in registry without it being exported, 
        // but we can assume we have access or pass it.
        // Actually, registry.ts exports `getDimensionDefinition`.
        try {
            const dimDef = getDimensionDefinition(dimName);
            return dimDef.baseUnitSymbol;
        } catch {
            // fallback
        }
      }
    }
    // Fallback composite generation
    const numerator: string[] = [];
    const denominator: string[] = [];
    for (const [dimName, power] of Object.entries(sig)) {
        if(power === 0) continue;
        try {
            const dimDef = getDimensionDefinition(dimName);
            const unit = dimDef.baseUnitSymbol;
            const part = Math.abs(power) === 1 ? unit : `${unit}^${Math.abs(power)}`;
            if (power > 0) numerator.push(part);
            else denominator.push(part);
        } catch {
            // If dimension not found (unlikely), skip
        }
    }
    const numStr = numerator.join(".");
    const denStr = denominator.join(".");
    if (numerator.length === 0 && denominator.length > 0) return `1/${denStr}`;
    if (denominator.length === 0) return numStr || "1";
    return `${numStr}/${denStr}`;
  }


  // --- Instance Methods ---

  add<OtherUnits extends string>(other: Quantity<DS, OtherUnits>): Q<CurrentUnitSymbol, DS, Units> {
    if (!Q.areDimensionSignaturesEqual(this._dimensionSignature, other._dimensionSignature)) {
      throw new Error(`Dimension mismatch: cannot add ${Q.signatureToString(other._dimensionSignature)} to ${Q.signatureToString(this._dimensionSignature)}`);
    }
    // Result is in CURRENT unit
    // deno-lint-ignore no-explicit-any
    const newValBase = this._valueInBaseUnits + (other as any)._valueInBaseUnits;
    
    return Q.create(newValBase, this.unitSymbol, this._dimensionSignature) as Q<CurrentUnitSymbol, DS, Units>;
  }

  subtract<OtherUnits extends string>(other: Quantity<DS, OtherUnits>): Q<CurrentUnitSymbol, DS, Units> {
     if (!Q.areDimensionSignaturesEqual(this._dimensionSignature, other._dimensionSignature)) {
      throw new Error(`Dimension mismatch: cannot subtract ${Q.signatureToString(other._dimensionSignature)} from ${Q.signatureToString(this._dimensionSignature)}`);
    }
    // deno-lint-ignore no-explicit-any
    const newValBase = this._valueInBaseUnits - (other as any)._valueInBaseUnits;
    return Q.create(newValBase, this.unitSymbol, this._dimensionSignature) as Q<CurrentUnitSymbol, DS, Units>;
  }

  multiply<OtherDS extends DimensionSignature, OtherUnits extends string>(
    other: Quantity<OtherDS, OtherUnits>
  ): Q<string, CombineDimensionSignatures<DS, OtherDS>, string> {
    const newSig = Q.combineSignatures(this._dimensionSignature, other._dimensionSignature);
    // deno-lint-ignore no-explicit-any
    const newValBase = this._valueInBaseUnits * (other as any)._valueInBaseUnits;
    
    // deno-lint-ignore no-explicit-any
    return Q.fromValueInBaseUnits(newValBase, newSig) as any;
  }

  divide<OtherDS extends DimensionSignature, OtherUnits extends string>(
    other: Quantity<OtherDS, OtherUnits>
  ): Q<string, DivideDimensionSignatures<DS, OtherDS>, string> {
    // deno-lint-ignore no-explicit-any
    if((other as any)._valueInBaseUnits === 0) throw new Error("Division by zero");
    const newSig = Q.divideSignatures(this._dimensionSignature, other._dimensionSignature);
    // deno-lint-ignore no-explicit-any
    const newValBase = this._valueInBaseUnits / (other as any)._valueInBaseUnits;
    // deno-lint-ignore no-explicit-any
    return Q.fromValueInBaseUnits(newValBase, newSig) as any;
  }

  pow<Exponent extends number>(
    exponent: Exponent
  ): Q<string, ScaleDimensionSignature<DS, Exponent>, string> {
    if (!Number.isInteger(exponent) || !Number.isFinite(exponent)) {
      throw new Error("Exponent must be a finite integer");
    }
    if (exponent < 0 && this._valueInBaseUnits === 0) {
      throw new Error("Division by zero");
    }

    const newSig: DimensionSignature = {};
    for (const [dimensionName, power] of Object.entries(this._dimensionSignature)) {
      const scaledPower = power * exponent;
      if (scaledPower !== 0) newSig[dimensionName] = scaledPower;
    }

    return Q.fromValueInBaseUnits(
      Math.pow(this._valueInBaseUnits, exponent),
      newSig
    ) as Q<string, ScaleDimensionSignature<DS, Exponent>, string>;
  }



  convertTo<TargetUnit extends Units>(targetUnitSymbol: TargetUnit): Q<TargetUnit, DS, TargetUnit> {
    const targetUnitDef = getUnitDefinition(targetUnitSymbol as string); // Throws if invalid unit
    
    // Check compatibility:
    // This is slightly complex because DS is generic. 
    // Ideally we check if targetUnit's dimension is compatible with this DS.
    // Simplifying assumption: We only support converting simple units to simple units of same dimension for now,
    // OR ensure the target unit belongs to the dimension described by DS (if DS is simple).
    
    // If DS has multiple dimensions, we can't really convert to a single "unit symbol" unless that symbol represents that composite dimension.
    // But `getUnitDefinition` only returns registered units (mostly simple).
    
    // Check if the current signature matches the target unit's dimension signature.
    // Target unit implies { [targetUnitDef.dimensionName]: 1 }
    const targetSig = { [targetUnitDef.dimensionName]: 1 };
    
    if (!Q.areDimensionSignaturesEqual(this._dimensionSignature, targetSig as unknown as DimensionSignature)) {
         throw new Error(`Cannot convert quantity with dimension ${Q.signatureToString(this._dimensionSignature)} to unit ${targetUnitSymbol} (dimension ${targetUnitDef.dimensionName})`);
    }

    // Conversion logic:
    // valInTarget = valInBase / targetFactor
    const newVal = (this._valueInBaseUnits - (targetUnitDef.offset ?? 0)) / targetUnitDef.factor;
    
    // We return a new Q. 
    // Note: We use the generic 'string' for the unit symbol in the return type because 
    // we can't easily prove 'targetUnitSymbol' matches a specific literal type here without more complex generics.
    // The DS remains the same.
    return new Q(newVal, targetUnitSymbol);
  }

  // --- Interop & Output ---

  valueOf(): number {
    return this.value;
  }

  toString(): string {
    return `${this.value.toPrecision(6)} ${this.unitSymbol}`;
  }

  toJSON(): { value: number; unit: string } {
      return { value: this.value, unit: this.unitSymbol };
  }

  equals(other: Quantity<DS, string>): boolean {
       if (!Q.areDimensionSignaturesEqual(this._dimensionSignature, other._dimensionSignature)) return false;
       // deno-lint-ignore no-explicit-any
       return Math.abs(this._valueInBaseUnits - (other as any)._valueInBaseUnits) < 1e-9;
  }

  isLessThan(other: Quantity<DS, string>): boolean {
    if (!Q.areDimensionSignaturesEqual(this._dimensionSignature, other._dimensionSignature)) throw new Error("Dimension mismatch");
    // deno-lint-ignore no-explicit-any
    return this._valueInBaseUnits < (other as any)._valueInBaseUnits;
  }

  isGreaterThan(other: Quantity<DS, string>): boolean {
    if (!Q.areDimensionSignaturesEqual(this._dimensionSignature, other._dimensionSignature)) throw new Error("Dimension mismatch");
    // deno-lint-ignore no-explicit-any
    return this._valueInBaseUnits > (other as any)._valueInBaseUnits;
  }

  // --- Static Helper for Composite Creation ---
  
  /**
   * Helper to create a quantity from a value in base units and a dimension signature.
   * Attempts to find a registered unit matching the derived symbol, otherwise falls back to constructing a custom one.
   * @internal
   */
  static fromValueInBaseUnits<ResDS extends DimensionSignature>(
    valueInBaseUnits: number,
    dimensionSignature: ResDS
  ): Q<string, ResDS, string> {
      const derivedUnitSymbol = Q.deriveCompositeUnitSymbol(dimensionSignature);
      
      // Check if this symbol is actually a registered unit (e.g. if we derived 'm', it is registered)
      // If it is registered, we can use its factor.
    // ...
    // Check if this symbol is actually a registered unit
      try {
        const _customDef = getUnitDefinition(derivedUnitSymbol);
        // It's a real unit!
        return Q.create(valueInBaseUnits, derivedUnitSymbol, dimensionSignature);
      } catch {
        // Not a registered unit.
        // For composite units like "m/s", factor is 1 relative to base units if composed of base units.
        // But deriveCompositeUnitSymbol ONLY uses base units (m, s, kg).
        // So the factor is always 1 relative to that string representation!
        // We just need to construct it manually because `create` tries to look it up.
        
        const q = Object.create(Q.prototype);
        q.value = valueInBaseUnits; // Since factor is 1
        q.unitSymbol = derivedUnitSymbol;
        q._valueInBaseUnits = valueInBaseUnits;
        q._dimensionSignature = dimensionSignature;
        return q as Q<string, ResDS, string>;
      }
  }

}
