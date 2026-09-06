export function cartesianProduct<T>(dimensions: T[][]): T[][] {
    return dimensions.reduce<T[][]>(
        (acc, dimension) =>
            acc.flatMap(combination =>
                dimension.map(unit => [...combination, unit])
            ),
        [[]]
    );
}