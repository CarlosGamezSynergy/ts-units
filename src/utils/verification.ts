import { defineDimension } from './registry.ts';
import { Q } from '../quantity.ts';

// Define Length Dimension
// Registry expect { name, baseUnitSymbol, units }
defineDimension({
    name: "Length",
    baseUnitSymbol: "m",
    units: {
        m: { factor: 1 },
        cm: { factor: 0.01 },
        km: { factor: 1000 },
        ft: { factor: 0.3048 },
    }
});

// We can't strictly type access to "Length" dimension as a type like before easily without the definitions being const and inferred,
// but for verification we can check runtime behavior.

// Valid usages
const l1 = new Q(10, "m");
const l2 = new Q(5, "km");

const a = l1.multiply(l2); // Should be valid, resulting in a quantity with combined dimensions

console.log("l1:", l1.toString());
console.log("l2:", l2.toString());

console.log(a)

try {
     new Q(10, "sec"); // Force error if we want to test runtime throw, or just let it throw if 'sec' not defined.
} catch (e) {
  console.log("Caught expected error:", (e as Error).message);
}

defineDimension({
    name: "Time", 
    baseUnitSymbol: "s",
    units: {
        s: { factor: 1 },
        min: { factor: 60 },
        hr: { factor: 3600 },
    }
});

const t1 = new Q(100, "s");
console.log("t1:", t1.toString());

console.log("Verification checks run.");
