import ts from "typescript"
import { Primitive, PropType } from "../analyze/extractPropTypes/types"
import { ComponentInfo } from "../types"
import { splitWords, upperCaseFirstLetter } from "../utils"

function createLiteral(value: Primitive | Array<Primitive>): ts.Expression {
    if (value === undefined) {
        return ts.createIdentifier("undefined")
    } else if (value === null) {
        return ts.createNull()
    } else if (typeof value === "string") {
        return ts.createStringLiteral(value)
    } else if (typeof value === "boolean") {
        return value ? ts.createTrue() : ts.createFalse()
    } else if (typeof value === "number") {
        return ts.createNumericLiteral(value + "")
    } else if (Array.isArray(value)) {
        return ts.createArrayLiteral(value.map(item => createLiteral(item)), false)
    }
    throw new Error(`Unrecognized value type ${value}`)
}

function createPropertyControlExpression(prop: PropType): ts.ObjectLiteralExpression | undefined {
    const createProp = (propertyControlName: string, expr: Primitive | Array<Primitive>) =>
        ts.createPropertyAssignment(propertyControlName, createLiteral(expr))

    const properties: ts.ObjectLiteralElementLike[] = []

    if (prop.type === "unsupported") {
        return undefined
    }

    // PropertyControl#title
    properties.push(
        createProp(
            "title",
            upperCaseFirstLetter(
                splitWords(prop.name)
                    .map(x => x.toLowerCase())
                    .join(" "),
            ),
        ),
    )

    // PropertyControl#type
    properties.push(
        ts.createPropertyAssignment(
            ts.createIdentifier("type"),
            ts.createPropertyAccess(
                ts.createIdentifier("ControlType"),
                ts.createIdentifier(upperCaseFirstLetter(prop.type)),
            ),
        ),
    )

    // PropertyControl#defaultValue
    if ("defaultValue" in prop && typeof prop.defaultValue !== "undefined" && prop.defaultValue !== null) {
        properties.push(createProp("defaultValue", prop.defaultValue))
    }

    // PropertyControl enum specific props
    // - options
    // - optionTitles
    if (prop.type === "enum") {
        properties.push(createProp("options", prop.possibleValues))
        const optionTitles = prop.possibleValues.map(val => splitWords(val + "").join(" "))

        properties.push(createProp("optionTitles", optionTitles))
    } else if (prop.type === "array") {
        // TODO: implement Array property control generation
    }

    return ts.createObjectLiteral(properties, true)
}

/**
 * Returns an array of `ts.PropertyAssignment`'s
 *
 * Example:
 *
 * ```ts
 * //                              returns these properties as an array
 * //                          ↓                                          ↓
 * addPropertyControls(Button, { foo: {type: string}, bar: {type: string} })
 * ```
 */
export function createPropertyControlPropertyAssignments(
    comp: Pick<ComponentInfo, "propTypes">,
): ts.PropertyAssignment[] {
    return comp.propTypes
        .filter(prop => prop.type !== "unsupported")
        .map(prop => {
            return ts.createPropertyAssignment(prop.name, createPropertyControlExpression(prop)!)
        })
}

/**
 * Creates a TS expression for the second argument of an `addPropertyControls` statement:
 *
 * ```ts
 * //                            returns this object
 * //                          ↓                     ↓
 * addPropertyControls(Button, { foo: {type: string} })
 * ```
 */
export function createPropertyControlObjectExpression(
    comp: Pick<ComponentInfo, "propTypes">,
): ts.ObjectLiteralExpression {
    return ts.createObjectLiteral(createPropertyControlPropertyAssignments(comp), true)
}
