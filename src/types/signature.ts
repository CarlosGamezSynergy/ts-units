
/**
 * Represents a dimension signature where keys are dimension names (e.g., 'Length', 'Time')
 * and values are their exponents (e.g., 1, -1, 2).
 * Example: Speed might be { Length: 1, Time: -1 }.
 */
export type DimensionSignature = Record<string, number>;

export type SimpleDimensionSignature<Name extends string> = {
  [K in Name]: 1;
};

/**
 * Helper type to map a Dimension Signature to the corresponding Allowed Unit Types.
 * Used to restrict `convertTo` to valid unit symbols for a given dimension.
 */
/** @deprecated A signature does not determine the valid unit-symbol set. */
export type AllowedUnit<DS extends DimensionSignature> = never;

// --- Integer Arithmetic (Range: -10 to 10) ---

// Next map (Increment)
type Next = {
  [-10]: -9; [-9]: -8; [-8]: -7; [-7]: -6; [-6]: -5; [-5]: -4; [-4]: -3; [-3]: -2; [-2]: -1; [-1]: 0;
  [0]: 1; [1]: 2; [2]: 3; [3]: 4; [4]: 5; [5]: 6; [6]: 7; [7]: 8; [8]: 9; [9]: 10; [10]: 11;
};

// Prev map (Decrement)
type Prev = {
  [10]: 9; [9]: 8; [8]: 7; [7]: 6; [6]: 5; [5]: 4; [4]: 3; [3]: 2; [2]: 1; [1]: 0;
  [0]: -1; [-1]: -2; [-2]: -3; [-3]: -4; [-4]: -5; [-5]: -6; [-6]: -7; [-7]: -8; [-8]: -9; [-9]: -10;
};

// Negate map
type Negate<N extends number> = 
  N extends 0 ? 0 :
  N extends 1 ? -1 : N extends 2 ? -2 : N extends 3 ? -3 : N extends 4 ? -4 : N extends 5 ? -5 :
  N extends 6 ? -6 : N extends 7 ? -7 : N extends 8 ? -8 : N extends 9 ? -9 : N extends 10 ? -10 :
  N extends -1 ? 1 : N extends -2 ? 2 : N extends -3 ? 3 : N extends -4 ? 4 : N extends -5 ? 5 :
  N extends -6 ? 6 : N extends -7 ? 7 : N extends -8 ? 8 : N extends -9 ? 9 : N extends -10 ? 10 :
  number; // Fallback

// AddSmall<A, B> - Recursively adds small integers
// Optimised for common small values to reduce recursion depth
type AddSmall<A extends number, B extends number> = 
  B extends 0 ? A :
  B extends 1 ? (A extends keyof Next ? Next[A] : never) :
  B extends 2 ? (A extends keyof Next ? AddSmall<Next[A], 1> : never) :
  B extends 3 ? (AddSmall<A, 2> extends infer R extends number ? AddSmall<R, 1> : never) :
  B extends 4 ? (AddSmall<A, 2> extends infer R extends number ? AddSmall<R, 2> : never) :
  B extends 5 ? (AddSmall<A, 4> extends infer R extends number ? AddSmall<R, 1> : never) :
  B extends 6 ? (AddSmall<A, 4> extends infer R extends number ? AddSmall<R, 1> : never) :
  B extends 7 ? (AddSmall<A, 4> extends infer R extends number ? AddSmall<R, 1> : never) :
  B extends 8 ? (AddSmall<A, 4> extends infer R extends number ? AddSmall<R, 1> : never) :
  B extends 9 ? (AddSmall<A, 4> extends infer R extends number ? AddSmall<R, 1> : never) :
  B extends 10 ? (AddSmall<A, 4> extends infer R extends number ? AddSmall<R, 1> : never) :
  B extends -1 ? (A extends keyof Prev ? Prev[A] : never) :
  B extends -2 ? (A extends keyof Prev ? AddSmall<Prev[A], -1> : never) :
  B extends -3 ? (AddSmall<A, -2> extends infer R extends number ? AddSmall<R, -1> : never) :
  B extends -4 ? (AddSmall<A, -2> extends infer R extends number ? AddSmall<R, -2> : never) :
  B extends -5 ? (AddSmall<A, -4> extends infer R extends number ? AddSmall<R, -1> : never) :
  B extends -6 ? (AddSmall<A, -4> extends infer R extends number ? AddSmall<R, -1> : never) :
  B extends -7 ? (AddSmall<A, -4> extends infer R extends number ? AddSmall<R, -1> : never) :
  B extends -8 ? (AddSmall<A, -4> extends infer R extends number ? AddSmall<R, -1> : never) :
  B extends -9 ? (AddSmall<A, -4> extends infer R extends number ? AddSmall<R, -1> : never) :
  B extends -10 ? (AddSmall<A, -4> extends infer R extends number ? AddSmall<R, -1> : never) :
  // Fallback for larger numbers or deeper recursion if needed
  number;

// --- Implementation ---

/**
 * Type-level addition of two dimension signatures.
 * Used for multiplying quantities (adding exponents).
 */
export type CombineDimensionSignatures<
  DS1 extends DimensionSignature,
  DS2 extends DimensionSignature
> = {
  // We iterate over all keys present in either DS1 or DS2
  [K in keyof DS1 | keyof DS2]: 
    K extends keyof DS1 
      ? K extends keyof DS2 
        ? AddSmall<DS1[K], DS2[K]> // Sum exponents
        : DS1[K] // Only in DS1
      : K extends keyof DS2 ? DS2[K] : never // Only in DS2
};

/**
 * Type-level subtraction of two dimension signatures.
 * Used for dividing quantities (subtracting exponents).
 */
export type DivideDimensionSignatures<
  DS1 extends DimensionSignature,
  DS2 extends DimensionSignature
> = {
  [K in keyof DS1 | keyof DS2]: 
    K extends keyof DS1 
      ? K extends keyof DS2 
        ? AddSmall<DS1[K], Negate<DS2[K]>> // A - B = A + (-B)
        : DS1[K] // Only in DS1 (DS2 has 0)
      : K extends keyof DS2 ? Negate<DS2[K]> : never // Only in DS2 (0 - B = -B)
};
