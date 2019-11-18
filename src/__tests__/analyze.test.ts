import { analyzeTypeScript, analyzeFlow, analyzePlainJavaScript } from "../analyze"
import { readFileSync } from "fs"

describe("analyze", () => {
    describe("TypeScript", () => {
        describe("finding components with different export syntax", () => {
            const cases: Array<string> = [
                "./src/__mocks__/typescript/exportClass.tsx",
                "./src/__mocks__/typescript/exportConstArrow.tsx",
                "./src/__mocks__/typescript/exportJsxFunction.1.tsx",
                "./src/__mocks__/typescript/exportJsxFunction.2.tsx",
                "./src/__mocks__/typescript/exportDefaultClass.tsx",
                "./src/__mocks__/typescript/exportDefaultReference.1.tsx",
                "./src/__mocks__/typescript/exportDefaultReference.2.tsx",
                "./src/__mocks__/typescript/exportDefaultReference.tsx",
                "./src/__mocks__/typescript/exportFrom.1.tsx",
                "./src/__mocks__/typescript/exportFrom.2.tsx",
                "./src/__mocks__/typescript/exportFrom.3.tsx",
                "./src/__mocks__/typescript/exportFrom.4.tsx",
                "./src/__mocks__/typescript/exportLetArrow.tsx",
                "./src/__mocks__/typescript/exportReference.1.tsx",
                "./src/__mocks__/typescript/exportReference.2.tsx",
                "./src/__mocks__/typescript/exportReference.3.tsx",
                "./src/__mocks__/typescript/exportReference.4.tsx",
            ]

            cases.forEach(file => {
                const fileContents = readFileSync(file)
                it(`supports ${file} type imports:\n\n${fileContents}`, async () => {
                    const components = await analyzeTypeScript([file])

                    expect(components.length).toEqual(1)

                    expect(components[0]).toMatchObject({
                        name: "SimpleReactComponent",
                        propTypes: [
                            { name: "text", type: "string" },
                            { name: "num", type: "number" },
                            { name: "bool", type: "boolean" },
                            { name: "fancyColor", type: "string" },
                        ],
                    })
                })
            })
        })
    })

    describe("plain JavaScript", () => {
        describe("using exported name, instead of component displayName", () => {
            const cases: Array<string> = ["./src/__mocks__/plain/exportConstArrowWithDisplayNameMismatch.js"]

            cases.forEach(file => {
                const fileContents = readFileSync(file)
                it(`resolves name to the correct exported name in file ${file}:\n\n${fileContents}`, async () => {
                    const components = await analyzePlainJavaScript([file])

                    expect(components[0]).toMatchObject({
                        name: "SimpleReactComponent",
                    })
                })
            })
        })

        describe("finding components with different export syntax", () => {
            const cases: Array<string> = [
                "./src/__mocks__/plain/exportClass.js",
                "./src/__mocks__/plain/exportClassStaticPropTypes.js",
                "./src/__mocks__/plain/exportConstArrow.js",
                // "./src/__mocks__/plain/exportDefaultFrom.js",
                "./src/__mocks__/plain/exportDefaultReference.js",
                // "./src/__mocks__/plain/exportDefaultReference.1.js",
                // "./src/__mocks__/plain/exportDefaultReference.2.js",
                // "./src/__mocks__/plain/exportFrom.js",
                "./src/__mocks__/plain/exportJsxFunction.js",
                "./src/__mocks__/plain/exportLetArrow.js",
            ]

            cases.forEach(file => {
                const fileContents = readFileSync(file)
                it(`supports ${file} type imports:\n\n${fileContents}`, async () => {
                    const components = await analyzePlainJavaScript([file])

                    expect(components.length).toEqual(1)

                    expect(components[0]).toMatchObject({
                        name: "SimpleReactComponent",
                        propTypes: [
                            { name: "text", type: "string", defaultValue: "Placeholder" },
                            { name: "num", type: "number", defaultValue: 42 },
                            { name: "bool", type: "boolean", defaultValue: true },
                            { name: "fancyColor", type: "string", defaultValue: "#0099ff" },
                        ],
                    })
                })
            })
        })
    })

    describe("flow", () => {
        describe("using exported name, instead of component displayName", () => {
            const cases: Array<string> = ["./src/__mocks__/plain/exportConstArrowWithDisplayNameMismatch.js"]

            cases.forEach(file => {
                const fileContents = readFileSync(file)
                it(`resolves name to the correct exported name in file ${file}:\n\n${fileContents}`, async () => {
                    const components = await analyzeFlow([file])

                    expect(components[0]).toMatchObject({
                        name: "SimpleReactComponent",
                    })
                })
            })
        })

        describe("example button", () => {
            const file = "./src/__mocks__/flow/exampleButton.js"
            
            it('can be parsed', async () => {
                const components = await analyzeFlow([file])

                expect(components.length).toBeGreaterThan(0)
            })
        })

        describe("finding components with different export syntax", () => {
            const cases: Array<string> = [
                "./src/__mocks__/flow/exportClass.js",
                "./src/__mocks__/flow/exportConstArrow.js",
                "./src/__mocks__/flow/exportDefaultReference.js",
                "./src/__mocks__/flow/exportJsxFunction.js",
                "./src/__mocks__/flow/exportLetArrow.js",
            ]

            cases.forEach(file => {
                const fileContents = readFileSync(file)
                it(`supports ${file} type imports:\n\n${fileContents}`, async () => {
                    const components = await analyzeFlow([file])

                    expect(components.length).toEqual(1)

                    expect(components[0]).toMatchObject({
                        name: "SimpleReactComponent",
                        propTypes: [
                            { name: "text", type: "string", defaultValue: "Placeholder" },
                            { name: "num", type: "number", defaultValue: 42 },
                            { name: "bool", type: "boolean", defaultValue: true },
                            { name: "fancyColor", type: "string", defaultValue: "#0099ff" },
                        ],
                    })
                })
            })
        })
    })
})
