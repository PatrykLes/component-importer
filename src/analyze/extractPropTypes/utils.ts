import { PropType } from "."

/**
 * Takes an array of `PropType`s with possibly more than one propery for the same name.
 * Returns a subset of `propTypes` without `PropType` name duplicates.
 */
export function removeDuplicates(propTypes: PropType[]): PropType[] {
    const result: Record<string, PropType> = {}

    for (const propType of propTypes) {
        const existing = result[propType.name]
        if (!existing) {
            result[propType.name] = propType
        }
        if (existing && propType.type !== "unsupported") {
            result[propType.name] = propType
        }
    }

    return Object.values(result)
}

/**
 * When figuring out the default value for a prop, react-docgen will return the actual source 
 * code string for the variable assignment, instead of the parsed JavaScript value.
 * This function will attempt to turn that string into its parsed JavaScript equivalent. It's
 * a more limited version of `eval`. E.g.:
 * 
 * unwrapValue('"abc"') // => "abc" (string)
 * unwrapValue("3") // => 3 (number)
 * unwrapValue("true") // => true (boolean)
 * unwrapValue('{ "a": 2 }') // => { a: 2 } (object)
 * 
 * @param value The source string representing the right side of the assignment to a variable
 */
export function unwrapValue(value: string): any {
    const unquoted = unquote(value)
    const str = `{ "value": ${unquoted} }`
    try {
        return JSON.parse(str).value
    } catch (error) {
        return unquoted
    }
}

export function unquote(string: string): string {
    return string && string.replace(/^['"]|['"]$/g, "")
}
