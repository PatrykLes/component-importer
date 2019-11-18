import { PropType } from "./analyze/extractPropTypes"
import { ComponentInfo } from "./types"
import { splitWords } from "./utils"
import { PropTypeName } from "./analyze/extractPropTypes/types"

export function applyColorHeuristic<T extends ComponentInfo>(comp: T): T {
    const updatedPropTypes: PropType[] = comp.propTypes.map(propType => {
        if (/color/i.test(propType.name) && propType.type === "string") {
            return {
                ...propType,
                type: PropTypeName.color,
                defaultValue: typeof propType.defaultValue === "undefined" ? "#09F" : propType.defaultValue,
            }
        }
        return propType
    })
    return {
        ...comp,
        propTypes: updatedPropTypes,
    }
}

/**
 * Adds a defaultValue to any "label" property control.
 */
export function applyLabelHeuristic<T extends ComponentInfo>(comp: T): T {
    const updatedPropTypes: PropType[] = comp.propTypes.map(propType => {
        if (/label|text|title|placeholder|description/i.test(propType.name) && propType.type === "string") {
            return {
                ...propType,
                defaultValue: typeof propType.defaultValue === "undefined" ? propType.name : propType.defaultValue,
            }
        }
        return propType
    })
    return {
        ...comp,
        propTypes: updatedPropTypes,
    }
}

/**
 * Adds a defaultValue for href properties
 */
export function applyHrefHeuristic<T extends ComponentInfo>(comp: T): T {
    const updatedPropTypes: PropType[] = comp.propTypes.map(propType => {
        if (propType.name.toLowerCase() === "href" && propType.type === "string") {
            return {
                ...propType,
                defaultValue:
                    typeof propType.defaultValue === "undefined" ? "https://framer.com" : propType.defaultValue,
            }
        }
        return propType
    })
    return {
        ...comp,
        propTypes: updatedPropTypes,
    }
}

/**
 * Remove a11y & aria- fields by default.
 *
 * **TODO**: include the fields but add a showAccesibilityFields property
 * and make the fields only visible depending on showAccesibilityFields's value.
 *
 * e.g. hidden(props) { return props.showAccesibility }
 */
export function applyA11yHeuristic<T extends ComponentInfo>(comp: T): T {
    const updatedPropTypes: PropType[] = comp.propTypes.filter(propType => {
        const isA11Prop = splitWords(propType.name)
            .map(word => word.toLowerCase())
            .some(word => word === "aria" || word === "a11y")

        return !isA11Prop
    })
    return {
        ...comp,
        propTypes: updatedPropTypes,
    }
}

/**
 * Remove certain HTML fields that are not useful in Framer X's context.
 */
export function applyHtmlBlacklistHeuristic<T extends ComponentInfo>(comp: T): T {
    const updatedPropTypes: PropType[] = comp.propTypes.filter(propType => {
        return !["className", "id", "key"].includes(propType.name)
    })
    return {
        ...comp,
        propTypes: updatedPropTypes,
    }
}

export function applyBooleanHeuristic<T extends ComponentInfo>(comp: T): T {
    const updatedPropTypes: PropType[] = comp.propTypes.map(propType => {
        if (propType.type === "boolean" && (propType.defaultValue === null || propType.defaultValue === undefined)) {
            return {
                ...propType,
                defaultValue: false,
            }
        }
        return propType
    })
    return {
        ...comp,
        propTypes: updatedPropTypes,
    }
}

/**
 * Applies all heuristics to the given component.
 */
export function applyHeuristics<T extends ComponentInfo>(comp: T): T {
    const heuristics = [
        applyColorHeuristic,
        applyHrefHeuristic,
        applyLabelHeuristic,
        applyA11yHeuristic,
        applyHtmlBlacklistHeuristic,
        applyBooleanHeuristic,
    ]
    return heuristics.reduce((comp, heuristic) => heuristic(comp), comp)
}
