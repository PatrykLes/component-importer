import ts from "typescript"
import assert from "assert"
import { PropType } from "../types"

function matchesSomeFlag(type: ts.Type | ts.Symbol, ...flags: ts.TypeFlags[]) {
    return flags.some(flag => (type.flags & flag) === flag)
}

type PropTypeFinder = (propSymbol: ts.Symbol, propType: ts.Type) => PropType | undefined

const enumPropTypeFinder: PropTypeFinder = (propSymbol: ts.Symbol, propType: ts.Type): PropType | undefined => {
    if (!propType.isUnion() || matchesSomeFlag(propType, ts.TypeFlags.Boolean)) {
        return
    }

    const unionType = propType as ts.UnionType

    const possibleValues = unionType.types
        // Framer enums only support enum strings..
        .filter(innerType => matchesSomeFlag(innerType, ts.TypeFlags.StringLiteral))
        .map(literalType => {
            if (literalType.isLiteral()) {
                return literalType.value
            }
            assert.fail(`Unexpected literalType: ${literalType.flags}`)
        })

    if (possibleValues.length === 0) {
        return {
            type: "unsupported",
            name: propSymbol.name,
            rawType: unionType,
        }
    }

    return {
        type: "enum",
        possibleValues,
        name: propSymbol.name,
    }
}

/**
 * Since Framer X only supports string enums, this prop type maps an enum of say 1 | 2 | 3
 * to a number.
 */
const numberEnumPropTypeFinder: PropTypeFinder = (propSymbol: ts.Symbol, propType: ts.Type): PropType | undefined => {
    if (!propType.isUnion()) {
        return
    }

    const unionType = propType as ts.UnionType
    if (!unionType.types.every(t => t.isNumberLiteral())) {
        return
    }

    const numbers = unionType.types
        .map(t => {
            if (t.isNumberLiteral()) {
                return t.value
            }
            assert("Expected t to be a NumberLiteral")
        })
        .sort()

    return {
        type: "number",
        name: propSymbol.name,
        min: numbers[0],
        max: numbers[numbers.length - 1],
    }
}

const arrayPropTypeFinder: PropTypeFinder = (propSymbol: ts.Symbol, propType: ts.Type): PropType | undefined => {
    const indexType = propType.getNumberIndexType()

    // Strings also return getNumberIndexType, but we're don't consider them as arrays
    if (!indexType || matchesSomeFlag(propType, ts.TypeFlags.String)) {
        return
    }

    if (matchesSomeFlag(indexType, ts.TypeFlags.String)) {
        return {
            type: "array",
            name: propSymbol.name,
            of: { type: "string", name: "" },
        }
    }

    if (matchesSomeFlag(indexType, ts.TypeFlags.Boolean)) {
        return {
            type: "array",
            name: propSymbol.name,
            of: { type: "boolean", name: "" },
        }
    }

    if (matchesSomeFlag(indexType, ts.TypeFlags.Number)) {
        return {
            type: "array",
            name: propSymbol.name,
            of: { type: "number", name: "" },
        }
    }
}

const booleanPropTypeFinder: PropTypeFinder = (propSymbol, propType) => {
    if (!matchesSomeFlag(propType, ts.TypeFlags.Boolean)) {
        return
    }
    return {
        type: "boolean",
        name: propSymbol.name,
    }
}

const stringPropTypeFinder: PropTypeFinder = (propSymbol, propType) => {
    if (!matchesSomeFlag(propType, ts.TypeFlags.String)) {
        return
    }
    return {
        type: "string",
        name: propSymbol.name,
    }
}

const numberPropTypeFinder: PropTypeFinder = (propSymbol, propType) => {
    if (!matchesSomeFlag(propType, ts.TypeFlags.Number)) {
        return
    }
    return {
        type: "number",
        name: propSymbol.name,
    }
}

/**
 * @param propsType the type of a react component's props.
 */
export function extractPropTypes(propsType: ts.Type, checker: ts.TypeChecker): PropType[] {
    const stringKeys = propsType
        .getProperties()
        // filter out possible keys that are not strings
        .filter(t => matchesSomeFlag(t, ts.TypeFlags.String))

    const finders = [
        booleanPropTypeFinder,
        numberPropTypeFinder,
        numberEnumPropTypeFinder,
        stringPropTypeFinder,
        enumPropTypeFinder,
        arrayPropTypeFinder,
    ]

    return stringKeys.map(symbol => {
        const { valueDeclaration, name: propTypeName } = symbol
        const symbolType = checker.getTypeAtLocation(valueDeclaration)

        for (const finder of finders) {
            const result = finder(symbol, symbolType)
            if (result && result.type !== "unsupported") {
                // in case a finder returned unsupported, give another finder
                // the chance to see if it can find something useful.
                return result
            }
        }

        return {
            type: "unsupported",
            name: propTypeName,
            rawType: propsType,
        }
    })
}
