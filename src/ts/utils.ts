import ts from "typescript"

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
