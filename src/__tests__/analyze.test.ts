import { analyzeTypeScript } from "../typescript"
import { readFileSync } from "fs"

describe("analyze | typescript", () => {
    describe("finding components with different export syntax", () => {
        const cases: Array<string> = [
            "./src/__mocks__/exportClass.tsx",
            "./src/__mocks__/exportConstArrow.tsx",
            "./src/__mocks__/exportJsxFunction.1.tsx",
            "./src/__mocks__/exportJsxFunction.2.tsx",
            "./src/__mocks__/exportDefaultClass.tsx",
            "./src/__mocks__/exportDefaultReference.1.tsx",
            "./src/__mocks__/exportDefaultReference.2.tsx",
            "./src/__mocks__/exportDefaultReference.tsx",
            "./src/__mocks__/exportFrom.1.tsx",
            "./src/__mocks__/exportFrom.2.tsx",
            "./src/__mocks__/exportFrom.3.tsx",
            "./src/__mocks__/exportFrom.4.tsx",
            "./src/__mocks__/exportLetArrow.tsx",
            "./src/__mocks__/exportReference.1.tsx",
            "./src/__mocks__/exportReference.2.tsx",
            "./src/__mocks__/exportReference.3.tsx",
            "./src/__mocks__/exportReference.4.tsx",
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
                    ],
                })
            })
        })
    })
})
