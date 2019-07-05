import * as ts from "typescript"
import { ComponentInfo, ProcessedFile, PropertyInfo, TypeInfo } from "./types"

export async function analyzeTypeScript(files: string[]): Promise<ProcessedFile[]> {
    const processed: ProcessedFile[] = files.map(
        t =>
            <ProcessedFile>{
                // relativeFile: t,
                srcFile: t,
            },
    )
    const tsconfig: ts.CompilerOptions = {
        //rootDir: dir,
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.React,
        typeRoots: [],
    }
    const opts: ts.CreateProgramOptions = {
        options: tsconfig,
        rootNames: processed.map(t => t.srcFile),
    }
    const program = ts.createProgram(opts)
    console.log(program.getSourceFiles().length)
    program.getTypeChecker() // to make sure the parent nodes are set
    for (const file of processed) {
        const sourceFile = program.getSourceFile(file.srcFile)
        if (!sourceFile || sourceFile.isDeclarationFile) continue
        console.log("SOURCE FILE", sourceFile.fileName)
        await analyze(sourceFile, file, program)
    }
    return processed
}

function analyze(sourceFile: ts.SourceFile, processedFile: ProcessedFile, program: ts.Program) {
    processedFile.components = Array.from(findComponents(sourceFile, program))
}

/**
 * @returns true if the given node contains the `export` modifier.
 */
function isExported(node: ts.Statement) {
    if (!node.modifiers) {
        return false
    }
    return node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
}

type ComponentFinder = {
    /**
     * Given a node as input, returns the extracted component if this ComponentFinder recognices it as a valid component and can process it, otherwise returns undefined.
     */
    extract(node: ts.Statement, program: ts.Program): ComponentInfo | undefined
}

const classComponentFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program) {
        if (!ts.isClassDeclaration(node) || !isExported(node)) {
            return undefined
        }

        const clause = node.heritageClauses.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)
        if (!clause) {
            return undefined
        }

        const checker = program.getTypeChecker()

        const type = checker.getTypeFromTypeNode(getFirstGenericArgument(clause))

        return {
            name: node.name.text,
            propsTypeInfo: toTypeInfo(type, checker),
        }
    },
}

/**
 * A ComponentFinder for function components
 */
const functionComponentFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program) {
        if (!ts.isVariableStatement(node)) return
        if (!isExported(node)) return

        const decl = node.declarationList.declarations[0]
        if (!decl) return

        const name = (decl.name as ts.Identifier).text
        const typeNode = decl.type
        if (!typeNode) return

        const checker = program.getTypeChecker()

        const type = checker.getTypeFromTypeNode(getFirstGenericArgument(decl.type))
        return {
            name,
            propsTypeInfo: toTypeInfo(type, checker),
        }
    },
}

function isReactFunctionComponent(type: ts.Type) {
    const propTypes = type.getProperties().map(props => props.name)

    // XXX some duck typing to verify that `type` is indeed a React.Function component.
    const containsFunctionComponentProps = ["propTypes", "defaultProps", "displayName"].every(propType =>
        propTypes.includes(propType),
    )

    return type.symbol.name === "FunctionComponent" && containsFunctionComponentProps
}

/**
 * A ComponentFinder for references to a Function Component
 */
const referenceComponentFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program) {
        if (!ts.isExportAssignment(node)) return

        const expression = node.expression
        if (!ts.isIdentifier(expression)) return

        const checker = program.getTypeChecker()
        const type = checker.getTypeAtLocation(expression)

        console.log(expression.text, node.getText())

        if (!isReactFunctionComponent(type)) return

        // XXX ugly, ugly, ugly but I couldn't find another way of getting the first type argument from the FunctionComponent type.
        const typeArguments: ts.Type = (type as any)["typeArguments"][0]

        return {
            name: expression.text,
            propsTypeInfo: toTypeInfo(typeArguments, checker),
        }
    },
}

function* findComponents(sourceFile: ts.SourceFile, program: ts.Program): IterableIterator<ComponentInfo> {
    const componentFinders: ComponentFinder[] = [
        classComponentFinder,
        functionComponentFinder,
        referenceComponentFinder,
    ]

    for (const node of sourceFile.statements) {
        for (const componentFinder of componentFinders) {
            const extractedComponent = componentFinder.extract(node, program)
            if (extractedComponent) {
                yield extractedComponent
            }
        }
    }
}

function getFirstGenericArgument(type: ts.Node): ts.TypeNode | undefined {
    if (ts.isTypeReferenceNode(type)) {
        const genericArgType = type.typeArguments[0]
        return genericArgType
    }
    if (ts.isHeritageClause(type)) {
        return type.types[0].typeArguments[0]
    }

    return undefined
}

function toTypeInfo(type: ts.Type, checker: ts.TypeChecker): TypeInfo {
    const typeInfo: TypeInfo = { rawType: type }
    if ((type.getFlags() & ts.TypeFlags.String) == ts.TypeFlags.String) {
        typeInfo.name = "string"
    } else if ((type.getFlags() & ts.TypeFlags.Number) == ts.TypeFlags.Number) {
        typeInfo.name = "number"
    } else if ((type.getFlags() & ts.TypeFlags.Boolean) == ts.TypeFlags.Boolean) {
        typeInfo.name = "boolean"
    } else if (type.isUnion()) {
        typeInfo.isEnum = true
        typeInfo.possibleValues = type.types.map(t => (t.isLiteral() ? (t.value as string | number) : ""))
    } else {
        // TODO: typeInfo.name = type.name
        typeInfo.properties = []
        for (const prop of type.getProperties()) {
            const meType = checker.getTypeAtLocation(prop.valueDeclaration)
            let pc: PropertyInfo = {
                name: prop.name,
                type: toTypeInfo(meType, checker),
                doc: ts.displayPartsToString(prop.getDocumentationComment(checker)),
            }
            typeInfo.properties.push(pc)
        }
    }
    return typeInfo
}
