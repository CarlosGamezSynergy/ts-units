import type { Quantity } from "../src/index.ts";
import { defineDimension, m, s } from "../src/index.ts";

const TypedAngle = defineDimension({
  name: "TypedAngle",
  baseUnitSymbol: "trad-type",
  units: {
    "trad-type": { factor: 1 },
    "tdeg-type": { factor: Math.PI / 180 },
  },
} as const);

const angle = TypedAngle.quantity(90, "tdeg-type");
angle.convertTo("trad-type");
angle.convertTo("tdeg-type");
if (false) {
  // @ts-expect-error unrelated unit is not valid for this dimension
  angle.convertTo("m");
  // @ts-expect-error undeclared custom unit
  TypedAngle.quantity(1, "invalid");
  // @ts-expect-error dimensions must match for addition
  angle.add(m(1));
}

angle.add(TypedAngle.quantity(Math.PI / 2, "trad-type"));
const radians: Quantity<{ TypedAngle: 1 }, "trad-type"> = angle.convertTo("trad-type");
const product: Quantity<{ Length: 1; TypedAngle: 1 }, string> = m(2).multiply(angle);
const rate: Quantity<{ TypedAngle: 1; Time: -1 }, string> = angle.divide(s(2));

void radians;
void product;
void rate;
