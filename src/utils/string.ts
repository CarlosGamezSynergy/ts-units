export function substitute(str: string, searchValue: string, replaceValue: string): string {
    return str.split(searchValue).join(replaceValue);
}

export function substituteMultiple(str: string, substitutions: [string, string][]): string {
    for (const [searchValue, replaceValue] of substitutions) {
        str = substitute(str, searchValue, replaceValue);
    }
    return str;
}

export function removeWhitespace(str: string): string {
    return str.replace(/\s+/g, "");
}