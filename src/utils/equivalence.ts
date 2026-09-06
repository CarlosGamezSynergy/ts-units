import type { DimensionSignature } from "../types/signature.ts";

/**
 * Maps a dimension name to the raw (one-level) signature it is equivalent to,
 * e.g. `"Force" -> { Mass: 1, Length: 1, Time: -2 }`.
 * Populated both implicitly (by `defineComplexDimension`, from the expression
 * it is built from) and explicitly (by `defineEquivalence`).
 */
const EQUIVALENCE_REGISTRY: Map<string, DimensionSignature> = new Map();

/**
 * Registers that `name` is equivalent to the given raw signature.
 * Does not itself expand/canonicalize the signature - that happens lazily
 * whenever the equivalence is resolved via `canonicalizeSignature`.
 */
export function registerEquivalence(name: string, signature: DimensionSignature): void {
  EQUIVALENCE_REGISTRY.set(name, Object.freeze({ ...signature }));
}

export function getRawEquivalence(name: string): DimensionSignature | undefined {
  return EQUIVALENCE_REGISTRY.get(name);
}

/**
 * Recursively expands every dimension name in `signature` that has a
 * registered equivalence, substituting it with its own (recursively expanded)
 * signature, until a fixed point is reached (no more substitutions possible).
 * This makes equivalence resolution symmetric and transitive: it doesn't
 * matter which dimension was declared "in terms of" which other, or how many
 * hops apart two equivalent dimensions are.
 *
 * @param expanding Internal recursion guard used to detect equivalence cycles.
 */
export function canonicalizeSignature(
  signature: DimensionSignature,
  expanding: Set<string> = new Set(),
): DimensionSignature {
  const result: Record<string, number> = { ...signature };
  let changed = true;

  while (changed) {
    changed = false;

    for (const [name, exponent] of Object.entries(result)) {
      if (exponent === 0) continue;

      const rawExpansion = EQUIVALENCE_REGISTRY.get(name);
      if (!rawExpansion) continue;

      if (expanding.has(name)) {
        throw new Error(`Circular dimension equivalence detected involving "${name}".`);
      }

      expanding.add(name);
      const expandedExpansion = canonicalizeSignature(rawExpansion, expanding);
      expanding.delete(name);

      delete result[name];
      for (const [subName, subExponent] of Object.entries(expandedExpansion)) {
        result[subName] = (result[subName] ?? 0) + subExponent * exponent;
      }

      changed = true;
      break; // Restart the scan since `result` was mutated mid-iteration.
    }
  }

  for (const key of Object.keys(result)) {
    if (result[key] === 0) delete result[key];
  }

  return result;
}

/** Produces a stable, comparable string key for a (already canonical) signature. */
function signatureKey(signature: DimensionSignature): string {
  return Object.entries(signature)
    .filter(([, exponent]) => exponent !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, exponent]) => `${name}^${exponent}`)
    .join(".");
}

/**
 * Checks whether two dimension signatures represent the same physical
 * dimension once all declared equivalences have been resolved.
 */
export function areSignaturesEquivalent(
  signature1: DimensionSignature,
  signature2: DimensionSignature,
): boolean {
  return signatureKey(canonicalizeSignature(signature1)) === signatureKey(canonicalizeSignature(signature2));
}
