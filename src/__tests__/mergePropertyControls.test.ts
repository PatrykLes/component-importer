import { updatePropertyControls } from "../generate/merge"

import { createPrettierFormatter } from "../utils"
import { createProgram } from "../analyze/typescript"
import { PropTypeName } from "../analyze/extractPropTypes/types"

const formatter = createPrettierFormatter(".prettierrc.json")

describe("updatePropertyControls", () => {
    test("new properties are added", async () => {
        const file = "src/__mocks__/typescript/propertyControlMerging.tsx"
        const program = createProgram({ rootNames: [file] })

        const sourceFile = program.getSourceFile(file)

        const updatedSourceFile = await updatePropertyControls(await formatter, sourceFile, {
            propTypes: [
                { type: PropTypeName.boolean, name: "newBooleanField" },
                { type: PropTypeName.string, name: "newStringField", defaultValue: "asd" },
            ],
        })

        expect(updatedSourceFile).toEqual(`import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

/**
 * this is a comment
 */
export const SimpleReactComponent = props => {
    return <p>test</p>
}

/**
 * these are also comments
 */
addPropertyControls(SimpleReactComponent, {
    text: { type: ControlType.String },
    num: { type: ControlType.Number },
    bool: { type: ControlType.Boolean },
    newBooleanField: {
        title: "New boolean field",
        type: ControlType.Boolean,
    },
    newStringField: {
        title: "New string field",
        type: ControlType.String,
        defaultValue: "asd",
    },
})
`)
    })

    test("existing properties are preserved", async () => {
        const file = "src/__mocks__/typescript/propertyControlMerging.tsx"
        const program = createProgram({ rootNames: [file] })

        const sourceFile = program.getSourceFile(file)

        const updatedSourceFile = await updatePropertyControls(await formatter, sourceFile, {
            propTypes: [],
        })

        expect(updatedSourceFile).toEqual(`import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

/**
 * this is a comment
 */
export const SimpleReactComponent = props => {
    return <p>test</p>
}

/**
 * these are also comments
 */
addPropertyControls(SimpleReactComponent, {
    text: { type: ControlType.String },
    num: { type: ControlType.Number },
    bool: { type: ControlType.Boolean },
})
`)
    })
})
