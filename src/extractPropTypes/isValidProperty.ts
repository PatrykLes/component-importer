import * as ts from "typescript"

function isDeclaredAt(symbol: ts.Symbol, moduleName: string) {
    if (!symbol.getDeclarations()) {
        return false
    }
    return symbol
        .getDeclarations()
        .map(declaration => declaration.getSourceFile().fileName)
        .every(fileName => fileName.indexOf(`node_modules/${moduleName}`) !== -1)
}

/**
 * Many design systems have declarations like
 *
 * ```ts
 * declare const Button: React.ComponentClass<ButtonProps & JSX.IntrinsicElements["button"]>
 * ```
 *
 * Which add hundreds of useless properties. This attempts to keep only those that are actually useful.
 */
export function isValidProperty(symbol: ts.Symbol): boolean {
    if (isDeclaredAt(symbol, "@types/react")) {
        const propertiesToInclude = new Set(["disabled", "placeholder", "checked"])
        return propertiesToInclude.has(symbol.name)
    }

    // Don't include accesibility fields
    if (symbol.name.indexOf("aria-") !== -1) {
        return false
    }
    // XXX temporarily exclude fields that can't be serialized as javascript identifiers
    if (!/^[a-zA-Z]\w+$/.test(symbol.name)) {
        return false
    }

    return true
}
