import { compile } from "./compile"
import ts from "typescript"
import { analyzeTypeScript } from "./typescript"

describe("analyze | typescript", () => {
    describe("finding components with different export syntax", () => {
        const cases: Array<string> = [
            // "./src/__mocks__/exportClass.tsx",
            // "./src/__mocks__/exportConstArrow.tsx",
            // // // TODO: doesn't work
            // // // "./src/__mocks__/exportDefaultArrow.tsx",
            // "./src/__mocks__/exportDefaultClass.tsx",
            // "./src/__mocks__/exportDefaultReference.1.tsx",
            // "./src/__mocks__/exportDefaultReference.2.tsx",
            // "./src/__mocks__/exportDefaultReference.tsx",
            // "./src/__mocks__/exportFrom.1.tsx",
            // "./src/__mocks__/exportFrom.2.tsx",
            // "./src/__mocks__/exportLetArrow.tsx",
            // "./src/__mocks__/exportReference.1.tsx",
        ]

        cases.forEach(file => {
            it(`supports ${file} type imports`, async () => {
                const out = await analyzeTypeScript([file])

                expect(out.length).toEqual(1)
                expect(out[0].components.length).toEqual(1)

                expect(out[0].components[0]).toMatchObject({
                    name: "SimpleReactComponent",
                    propsTypeInfo: {
                        properties: [
                            { name: "text", type: { name: "string" } },
                            { name: "num", type: { name: "number" } },
                            { name: "bool", type: { name: "boolean" } },
                        ],
                    },
                })
            })
        })
    })

    it("supports primitive types", async () => {
        const out = await analyzeTypeScript(["./src/__mocks__/propsTesterComponent.primitives.tsx"])

        expect(out[0].components[0].propTypes).toMatchObject([
            {
                name: "regularNumber",
                type: "number",
            },
            {
                name: "regularString",
                type: "string",
            },
            {
                name: "regularBoolean",
                type: "boolean",
            },
        ])
    })

    it("supports enums", async () => {
        const out = await analyzeTypeScript(["./src/__mocks__/propsTesterComponent.enums.tsx"])

        expect(out[0].components[0].propTypes).toMatchObject([
            {
                name: "regularNumberEnum",
                type: "number",
                min: 1,
                max: 3,
            },
            {
                name: "regularStringEnum",
                type: "enum",
                possibleValues: ["a", "b", "c"],
            },
        ])
    })

    it("supports mixed enums", async () => {
        const out = await analyzeTypeScript(["./src/__mocks__/propsTesterComponent.mixedEnums.tsx"])

        expect(out[0].components[0].propTypes).toMatchObject([
            {
                name: "mixedEnum",
                type: "enum",
                possibleValues: ["what"],
            },
            {
                name: "complexMix",
                type: "enum",
                possibleValues: ["small"],
            },
            {
                name: "booleanMix",
                type: "enum",
                possibleValues: ["a", "b"],
            },
        ])
    })
})
