import ts from "typescript"
import * as rd from "react-docgen"
import { strict as assert } from "assert"
import { PropType, PropTypeFinder, PropTypeName } from "./types"
import { isValidProperty } from "./isValidProperty"
import { flatMap } from "../../utils"
import { removeDuplicates, unwrapValue } from "./utils"

/**
 * @returns true iff the given `type` contains at least on of the given `flags`.
 */
function matchesSomeFlag(type: ts.Type | ts.Symbol, ...flags: ts.TypeFlags[]): boolean {
    return flags.some(flag => (type.flags & flag) === flag)
}

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
        }) as string[]

    if (possibleValues.length === 0) {
        return {
            type: PropTypeName.unsupported,
            name: propSymbol.name,
        }
    }

    return {
        type: PropTypeName.enum,
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
        type: PropTypeName.number,
        name: propSymbol.name,
        min: numbers[0],
        max: numbers[numbers.length - 1],
    }
}

/**
 * Matches arrays. Currently only supports arrays of strings, booleans and numbers
 */
const arrayPropTypeFinder: PropTypeFinder = (propSymbol: ts.Symbol, propType: ts.Type): PropType | undefined => {
    const indexType = propType.getNumberIndexType()

    // Strings also return getNumberIndexType, but we're don't consider them as arrays
    if (!indexType || matchesSomeFlag(propType, ts.TypeFlags.String)) {
        return
    }

    if (matchesSomeFlag(indexType, ts.TypeFlags.String)) {
        return {
            type: PropTypeName.array,
            name: propSymbol.name,
            of: { type: PropTypeName.string, name: "" },
        }
    }

    if (matchesSomeFlag(indexType, ts.TypeFlags.Boolean)) {
        return {
            type: PropTypeName.array,
            name: propSymbol.name,
            of: { type: PropTypeName.boolean, name: "" },
        }
    }

    if (matchesSomeFlag(indexType, ts.TypeFlags.Number)) {
        return {
            type: PropTypeName.array,
            name: propSymbol.name,
            of: { type: PropTypeName.number, name: "" },
        }
    }

    return
}

/**
 * Matches the boolean type
 */
const booleanPropTypeFinder: PropTypeFinder = (propSymbol, propType) => {
    if (!matchesSomeFlag(propType, ts.TypeFlags.Boolean)) {
        return
    }
    return {
        type: PropTypeName.boolean,
        name: propSymbol.name,
    }
}

/**
 * Matches the string type
 */
const stringPropTypeFinder: PropTypeFinder = (propSymbol, propType) => {
    if (!matchesSomeFlag(propType, ts.TypeFlags.String)) {
        return
    }
    return {
        type: PropTypeName.string,
        name: propSymbol.name,
    }
}

/**
 * Matches the number type
 */
const numberPropTypeFinder: PropTypeFinder = (propSymbol, propType) => {
    if (!matchesSomeFlag(propType, ts.TypeFlags.Number)) {
        return
    }
    return {
        type: PropTypeName.number,
        name: propSymbol.name,
    }
}

const unionPropTypeFinder: PropTypeFinder = (propSymbol, propType) => {
    if (!propType.isUnion()) {
        return
    }

    const finders: PropTypeFinder[] = [stringPropTypeFinder, numberPropTypeFinder, booleanPropTypeFinder]

    for (const finder of finders) {
        for (const typeInUnion of propType.types) {
            const resultingPropType = finder(propSymbol, typeInUnion)
            if (resultingPropType && resultingPropType.type !== "unsupported") {
                return resultingPropType
            }
        }
    }
    return {
        type: PropTypeName.unsupported,
        name: propSymbol.name,
    }
}

/**
 * @param propsType the type of a react component's props.
 */
export function extractTypeScriptPropTypes(propsType: ts.Type, checker: ts.TypeChecker): PropType[] {
    const stringProperties = propsType
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
        unionPropTypeFinder,
    ]

    const propTypes: PropType[] = flatMap(stringProperties, (symbol: ts.Symbol) => {
        const declarations = symbol.getDeclarations()
        if (!declarations) {
            const symbolType = checker.getTypeAtLocation(symbol.valueDeclaration)
            return [{ symbol, symbolType }]
        }

        // XXX Sometimes properties can be declared on more than one location. In this case, the type checker
        // is only able to correctly resolve the type by pointing to the individual declarations.
        return declarations.map(declaration => {
            const symbolType = checker.getTypeAtLocation(declaration)
            return { symbol, symbolType }
        })
    })
        .filter(({ symbol }) => isValidProperty(symbol))

        .map(({ symbol, symbolType }) => {
            const { name: propTypeName } = symbol

            for (const finder of finders) {
                const result = finder(symbol, symbolType)

                if (result && result.type !== "unsupported") {
                    // in case a finder returned unsupported, give another finder
                    // the chance to see if it can find something useful.
                    return result
                }
            }

            return {
                type: PropTypeName.unsupported,
                name: propTypeName,
            }
        })

    return removeDuplicates(propTypes)
}

export function extractPlainPropType(prop: rd.PropTypeDescriptor): PropType {
    const type = rdPropTypeToPropType("type" in prop ? prop.type.name : "unsupported")
    const t = prop.type

    // The reason `defaultValue` is an object with the single key `defaultValue` is because it is only expected to be
    // spread over the returned PropType when it's present. If it's not, the below will resolve to `false` and the 
    // `defaultValue` key won't be added to the returned object at all, avoiding the case where we end up with a
    // defined `defaultValue` key with the value `undefined`.
    const defaultValue = prop.defaultValue &&
        !prop.defaultValue.computed && { defaultValue: unwrapValue(prop.defaultValue.value) }

    switch (type) {
        case PropTypeName.array: {
            let arrayOfType = {
                type: PropTypeName.string,
                name: prop.name,
            } as PropType

            if (t.name === "arrayOf") {
                arrayOfType = extractPlainPropType({
                    name: t.value.name,
                    type: t.value,
                })
            }

            return {
                type: PropTypeName.array,
                name: prop.name,
                of: arrayOfType,
                ...defaultValue,
            }
        }
        case PropTypeName.enum: {
            // special case for `oneOfType`, which gets resolved to a union type
            if (t.name === "union") {
                // TODO: default to something smarter than a string
                return {
                    name: prop.name,
                    type: PropTypeName.string,
                }
            }

            const values: any[] =
                t.name === "enum" ? t.value.map((v: rd.PropTypeDescriptor) => unwrapValue(v.value)) : []
            if (values.every(v => typeof v === "number")) {
                values.sort()
                return {
                    type: PropTypeName.number,
                    name: prop.name,
                    min: values[0],
                    max: values[values.length - 1],
                }
            }

            const stringValues = values.filter(v => typeof v === "string")

            return {
                type: PropTypeName.enum,
                name: prop.name,
                possibleValues: stringValues,
                ...defaultValue,
            }
        }
        case PropTypeName.boolean:
        case PropTypeName.string:
        case PropTypeName.color:
        case PropTypeName.number: {
            return {
                type,
                name: prop.name,
                ...defaultValue,
            }
        }

        default: {
            return {
                type: PropTypeName.unsupported,
                name: prop.name,
            }
        }
    }
}

export function extractFlowPropType(prop: rd.PropTypeDescriptor): PropType {
    const type = rdPropTypeToPropType("flowType" in prop ? prop.flowType.name : "unsupported")

    switch (type) {
        case PropTypeName.array: {
            let arrayOfType = {
                type: PropTypeName.string,
                name: prop.name,
            } as PropType

            const flowType = prop.flowType as rd.FlowElementsType
            if (Array.isArray(flowType.elements) && flowType.elements.length > 0) {
                arrayOfType = {
                    name: flowType.elements[0].name,
                    type: rdPropTypeToPropType(flowType.elements[0].name),
                } as PropType
            }

            return {
                type: PropTypeName.array,
                name: prop.name,
                of: arrayOfType,
                defaultValue:
                    prop.defaultValue && !prop.defaultValue.computed ? unwrapValue(prop.defaultValue.value) : [],
            }
        }
        case PropTypeName.enum: {
            const flowType = prop.flowType as rd.FlowElementsType
            const literals = flowType.elements
                .filter(e => e.name === "literal")
                .map((e: rd.FlowTypeDescriptor) => unwrapValue((e as rd.FlowLiteralType).value))
            if (literals.length > 0 && literals.every(v => typeof v === "number")) {
                literals.sort()

                return {
                    type: PropTypeName.number,
                    name: prop.name,
                    min: literals[0],
                    max: literals[literals.length - 1],
                }
            }

            const stringValues = literals.filter(v => typeof v === "string")

            if (stringValues.length === 0) {
                // check if this is a union of primitive types, and if yes,
                // default to string, number, or boolean in that order
                const primitiveTypes = flowType.elements.filter(e => ["string", "number", "boolean"].includes(e.name))
                if (primitiveTypes.length > 0) {
                    const matchedType =
                        primitiveTypes.find(e => e.name === "string") ||
                        primitiveTypes.find(e => e.name === "number") ||
                        primitiveTypes.find(e => e.name === "boolean")

                    return {
                        type: rdPropTypeToPropType(matchedType.name) as (
                            | PropTypeName.string
                            | PropTypeName.number
                            | PropTypeName.boolean
                            | PropTypeName.unsupported),
                        name: prop.name,
                    }
                }
            }

            return {
                type: PropTypeName.enum,
                name: prop.name,
                possibleValues: stringValues,
                defaultValue:
                    prop.defaultValue && !prop.defaultValue.computed ? unwrapValue(prop.defaultValue.value) : null,
            }
        }
        case PropTypeName.boolean:
        case PropTypeName.string:
        case PropTypeName.color:
        case PropTypeName.number: {
            return {
                type,
                name: prop.name,
                defaultValue:
                    prop.defaultValue && !prop.defaultValue.computed ? unwrapValue(prop.defaultValue.value) : null,
            }
        }

        default: {
            return {
                type: PropTypeName.unsupported,
                name: prop.name,
            }
        }
    }
}

function rdPropTypeToPropType(typeName: string): PropTypeName {
    const map: { [key: string]: PropTypeName } = {
        bool: PropTypeName.boolean,
        boolean: PropTypeName.boolean,
        union: PropTypeName.enum,
        string: PropTypeName.string,
        number: PropTypeName.number,
        color: PropTypeName.color,
        enum: PropTypeName.enum,
        array: PropTypeName.array,
        Array: PropTypeName.array,
        arrayOf: PropTypeName.array,
        unsupported: PropTypeName.unsupported,
    }
    return map[typeName] || PropTypeName.unsupported
}

export { PropType }
