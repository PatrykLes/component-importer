import { analyzeTypeScript, analyzeFlow, analyzePlainJavaScript } from ".."

describe("extractPropTypes", () => {
    describe("TypeScript", () => {
        it("supports primitive types", async () => {
            const components = await analyzeTypeScript([
                "./src/__mocks__/typescript/propsTesterComponent.primitives.tsx",
            ])

            expect(components[0].propTypes).toMatchObject([
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
            const components = await analyzeTypeScript(["./src/__mocks__/typescript/propsTesterComponent.enums.tsx"])

            expect(components[0].propTypes).toMatchObject([
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
            const components = await analyzeTypeScript([
                "./src/__mocks__/typescript/propsTesterComponent.mixedEnums.tsx",
            ])

            expect(components[0].propTypes).toMatchObject([
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
                {
                    name: "primitiveMix",
                    type: "string",
                },
                {
                    name: "stringMixWithExtras",
                    type: "string",
                },
            ])
        })
    })

    describe("plain JavaScript", () => {
        it("supports primitive types", async () => {
            const components = await analyzePlainJavaScript([
                "./src/__mocks__/plain/propsTesterComponent.primitives.js",
            ])

            expect(components[0].propTypes).toMatchObject([
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

        it("supports spreads in prop types", async () => {
            const components = await analyzePlainJavaScript(["./src/__mocks__/plain/propsTesterComponent.spreads.js"])

            expect(components[0].propTypes).toMatchObject([
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

        it("supports imported prop types", async () => {
            const components = await analyzePlainJavaScript(["./src/__mocks__/plain/propsTesterComponent.imported.js"])

            expect(components[0].propTypes).toMatchObject([
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

        it("supports arrays", async () => {
            const components = await analyzePlainJavaScript(["./src/__mocks__/plain/propsTesterComponent.array.js"])

            expect(components[0].propTypes).toMatchObject([
                {
                    name: "numberArray",
                    type: "array",
                    of: {
                        type: "number",
                    },
                },
                {
                    name: "stringArray",
                    type: "array",
                    of: {
                        type: "string",
                    },
                },
            ])
        })

        it("supports enums", async () => {
            const components = await analyzePlainJavaScript(["./src/__mocks__/plain/propsTesterComponent.enums.js"])

            expect(components[0].propTypes).toMatchObject([
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
            const components = await analyzePlainJavaScript([
                "./src/__mocks__/plain/propsTesterComponent.mixedEnums.js",
            ])

            expect(components[0].propTypes).toMatchObject([
                {
                    name: "mixedEnum",
                    type: "enum",
                    possibleValues: ["what"],
                },
                {
                    name: "booleanMix",
                    type: "enum",
                    possibleValues: ["a", "b"],
                },
                {
                    name: "primitiveMix",
                    type: "string",
                },
                {
                    name: "stringMixWithExtras",
                    type: "enum",
                },
            ])
        })

        it("supports defaultProps", async () => {
            const components = await analyzePlainJavaScript(["./src/__mocks__/plain/propsTesterComponent.defaults.js"])

            expect(components[0].propTypes).toMatchObject([
                {
                    name: "num",
                    type: "number",
                    defaultValue: 42,
                },
                {
                    name: "text",
                    type: "string",
                    defaultValue: "Placeholder",
                },
                {
                    name: "computedProp",
                    type: "number",
                },
                {
                    name: "arr",
                    type: "array",
                    defaultValue: ["a", "b", "c"],
                },
            ])
        })
    })

    describe("Flow", () => {
        it("supports primitive types", async () => {
            const components = await analyzeFlow(["./src/__mocks__/flow/propsTesterComponent.primitives.js"])

            expect(components[0].propTypes).toMatchObject([
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

        it("supports spreads in prop types", async () => {
            const components = await analyzeFlow(["./src/__mocks__/flow/propsTesterComponent.spreads.js"])

            expect(components[0].propTypes).toMatchObject([
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

        it("supports imported prop types", async () => {
            const components = await analyzeFlow(["./src/__mocks__/flow/propsTesterComponent.imported.js"])

            expect(components[0].propTypes).toMatchObject([
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

        it("supports arrays", async () => {
            const components = await analyzeFlow(["./src/__mocks__/flow/propsTesterComponent.array.js"])

            expect(components[0].propTypes).toMatchObject([
                {
                    name: "numberArray",
                    type: "array",
                    of: {
                        type: "number",
                    },
                },
                {
                    name: "stringArray",
                    type: "array",
                    of: {
                        type: "string",
                    },
                },
            ])
        })

        it("supports enums", async () => {
            const components = await analyzeFlow(["./src/__mocks__/flow/propsTesterComponent.enums.js"])

            expect(components[0].propTypes).toMatchObject([
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
            const components = await analyzeFlow(["./src/__mocks__/flow/propsTesterComponent.mixedEnums.js"])

            expect(components[0].propTypes).toMatchObject([
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
                {
                    name: "primitiveMix",
                    type: "string",
                },
                {
                    name: "stringMixWithExtras",
                    type: "enum",
                    possibleValues: ["a", "b", "c"],
                },
            ])
        })
    })
})
