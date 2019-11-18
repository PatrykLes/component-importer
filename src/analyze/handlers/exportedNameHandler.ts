import * as rd from "react-docgen"
import { namedTypes as t } from "ast-types"
import { getNameOrValue } from "../../utils"

/**
 * Decorates the passed in documentation object with an `exportedName` property, which is
 * used in the generated boilerplate to name the imported component
 * 
 * @param documentation A react-docgen documentation object
 * @param path The AST node that's being processed
 * @param parser AST parser instance
 */
export const exportedNameHandler: rd.Handler = (documentation, path, parser) => {
    if (t.ClassDeclaration.check(path.node) || t.FunctionDeclaration.check(path.node)) {
        documentation.set("exportedName", getNameOrValue(path.get("id")))
    } else if (t.ArrowFunctionExpression.check(path.node) || t.FunctionExpression.check(path.node)) {
        let currentPath = path
        while (currentPath.parent) {
            if (t.VariableDeclarator.check(currentPath.parent.node)) {
                documentation.set("exportedName", getNameOrValue(currentPath.parent.get("id")))
                return
            } else if (t.AssignmentExpression.check(currentPath.parent.node)) {
                const leftPath = currentPath.parent.get("left")
                if (t.Identifier.check(leftPath.node) || t.Literal.check(leftPath.node)) {
                    documentation.set("exportedName", getNameOrValue(leftPath))
                    return
                }
            }
            currentPath = currentPath.parent
        }
    }
}
