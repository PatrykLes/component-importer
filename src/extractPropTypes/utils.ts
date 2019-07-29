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
