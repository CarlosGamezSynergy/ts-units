import { defineComplexDimension, defineDimension } from "./src/index.ts";


const Length = defineDimension({
    name: "Length",
    baseUnitSymbol: "m",
    units: {
        m: { factor: 1 },
        cm: { factor: 0.01 },
        mm: { factor: 0.001 },
        km: { factor: 1000 },
        in: { factor: 0.0254 },
        ft: { factor: 0.3048 },
        yd: { factor: 0.9144 },
        mi: { factor: 1609.34 }
    }
});

const Time = defineDimension({
    name: "Time",
    baseUnitSymbol: "s",
    units: {
        s: { factor: 1 },
        min: { factor: 60 },
        h: { factor: 3600 },
        d: { factor: 86400 }
    }
});

const Mass = defineDimension({
    name: "Mass",
    baseUnitSymbol: "kg",
    units: {
        kg: { factor: 1 },
        g: { factor: 0.001 },
        mg: { factor: 0.000001 },
        lb: { factor: 0.453592 },
        oz: { factor: 0.0283495 }
    }
});

const Speed = defineComplexDimension("Speed", () => "Length / Time")

console.log(Length);
console.log(Time);
console.log(Mass);
console.log(Speed);