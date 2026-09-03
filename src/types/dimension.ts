import type { Quantity } from "../quantity.ts";
import type { SimpleDimensionSignature } from "./signature.ts";

export type UnitSpec = {
    factor: number;
    offset?: number;
};

export type UnitMap = Record<string, UnitSpec>;

export type DimensionDefinition<
    Name extends string = string,
    Units extends UnitMap = UnitMap,
> = {
    name: Name;
    baseUnitSymbol: keyof Units & string;
    units: Units;
};

export type UnitDefinition<DimensionName extends string = string> = {
    symbol: string;
    factor: number;
    offset: number;
    dimensionName: DimensionName;
};

export type DimensionUnitSymbols<
    Definition extends DimensionDefinition,
> = keyof Definition["units"] & string;

export type DefinedDimension<
    Name extends string,
    Units extends UnitMap,
> = {
    readonly name: Name;
    readonly baseUnitSymbol: keyof Units & string;
    readonly units: Units;
    quantity(
        value: number,
        unit: keyof Units & string,
    ): Quantity<SimpleDimensionSignature<Name>, keyof Units & string>;
    factory(
        unit: keyof Units & string,
    ): (
        value: number,
    ) => Quantity<SimpleDimensionSignature<Name>, keyof Units & string>;
};
