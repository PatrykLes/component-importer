import { analyzeTypeScript } from "./typescript"
import { readFileSync } from "fs"

describe("analyze | typescript", () => {
    describe("finding components with different export syntax", () => {
        const cases: Array<string> = [
            // "./src/__mocks__/exportClass.tsx",
            // "./src/__mocks__/exportConstArrow.tsx",
            // "./src/__mocks__/exportJsxFunction.1.tsx",
            // "./src/__mocks__/exportJsxFunction.2.tsx",
            // "./src/__mocks__/exportDefaultClass.tsx",
            // "./src/__mocks__/exportDefaultReference.1.tsx",
            // "./src/__mocks__/exportDefaultReference.2.tsx",
            // "./src/__mocks__/exportDefaultReference.tsx",
            // "./src/__mocks__/exportFrom.1.tsx",
            // "./src/__mocks__/exportFrom.2.tsx",
            // "./src/__mocks__/exportFrom.3.tsx",
            "./src/__mocks__/exportFrom.4.tsx",
            // "./src/__mocks__/exportLetArrow.tsx",
            // "./src/__mocks__/exportReference.1.tsx",
            // "./src/__mocks__/exportReference.2.tsx",
            // "./src/__mocks__/exportReference.3.tsx",
            // "./src/__mocks__/exportReference.4.tsx",
        ]

        cases.forEach(file => {
            const fileContents = readFileSync(file)
            it(`supports ${file} type imports:\n\n${fileContents}`, async () => {
                const out = await analyzeTypeScript([file])

                expect(out.length).toEqual(1)
                expect(out[0].components.length).toEqual(1)

                expect(out[0].components[0]).toMatchObject({
                    name: "SimpleReactComponent",
                    propTypes: [
                        { name: "text", type: "string" },
                        { name: "num", type: "number" },
                        { name: "bool", type: "boolean" },
                    ],
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
