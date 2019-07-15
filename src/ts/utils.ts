import ts from "typescript"
import { TypeInfo, PropertyInfo, PropType } from "../types"

/**
 * @returns true if the given node contains the `export` modifier.
 */
export function isExported(node: ts.Statement): boolean {
    if (!node.modifiers) {
        return false
    }
    return node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
}

export function getFirstGenericArgument(type: ts.Node): ts.TypeNode | undefined {
    if (ts.isTypeReferenceNode(type) && type.typeArguments) {
        const genericArgType = type.typeArguments[0]
        return genericArgType
    }
    if (ts.isHeritageClause(type) && type.types && type.types[0]) {
        return type.types[0].typeArguments[0]
    }

    return undefined
}

export function toTypeInfo(type: ts.Type, checker: ts.TypeChecker, level: number = 0): TypeInfo {
    const typeInfo: TypeInfo = { rawType: type }
    if ((type.getFlags() & ts.TypeFlags.String) == ts.TypeFlags.String) {
        typeInfo.name = "string"
    } else if ((type.getFlags() & ts.TypeFlags.Number) == ts.TypeFlags.Number) {
        typeInfo.name = "number"
    } else if ((type.getFlags() & ts.TypeFlags.Boolean) == ts.TypeFlags.Boolean) {
        typeInfo.name = "boolean"
    } else if (type.isUnion()) {
        typeInfo.isEnum = true
        typeInfo.possibleValues = type.types.filter(t => t.isLiteral()).map(t => (t.isLiteral() ? t.value : ""))
    }
    // XXX quick way to stop stack overflows on recursive types.
    // revisit this later
    else if (level < 5) {
        // TODO: typeInfo.name = type.name
        typeInfo.properties = []
        for (const prop of type.getProperties()) {
            const meType = checker.getTypeAtLocation(prop.valueDeclaration)
            let pc: PropertyInfo = {
                name: prop.name,
                type: toTypeInfo(meType, checker, level + 1),
                doc: ts.displayPartsToString(prop.getDocumentationComment(checker)),
            }
            typeInfo.properties.push(pc)
        }
    }
    return typeInfo
}

// this seems to correctly identify:
// - React.FunctionComponent
// - React.SFC
// - React.ComponentType
export function isReactFunctionComponent(type: ts.Type) {
    const propTypes = type.getProperties().map(props => props.name)

    // XXX some duck typing to verify that `type` is indeed a React.Function component.
    const containsFunctionComponentProps = ["propTypes", "defaultProps", "displayName"].every(propType =>
        propTypes.includes(propType),
    )

    // I'd like to check for symbol.name but its apparently not always present. Until then, keep this
    // commented.
    // return type.symbol.name === "FunctionComponent" && containsFunctionComponentProps
    return containsFunctionComponentProps
}

export function getReactPropsType(type: ts.Type): ts.Type | undefined {
    // XXX ugly, ugly, ugly but I couldn't find another way of getting the first type argument from the FunctionComponent type.
    const typeArguments = (type as any)["typeArguments"]
    if (typeArguments && typeArguments.length > 0) {
        return typeArguments[0]
    }

    if (type.aliasTypeArguments && type.aliasTypeArguments.length > 0) {
        return type.aliasTypeArguments[0]
    }

    return undefined
}
