import { analyze } from "./analyze"

describe("analyze | typescript", () => {
    describe("finding components with different export syntax", () => {
        const cases: Array<string> = [
            "./src/__mocks__/exportClass.tsx",
            "./src/__mocks__/exportConstArrow.tsx",
            // // TODO: doesn't work
            // // "./src/__mocks__/exportDefaultArrow.tsx",
            "./src/__mocks__/exportDefaultClass.tsx",
            "./src/__mocks__/exportDefaultReference.1.tsx",
            "./src/__mocks__/exportDefaultReference.2.tsx",
            "./src/__mocks__/exportDefaultReference.3.tsx",
            "./src/__mocks__/exportDefaultReference.tsx",
            "./src/__mocks__/exportLetArrow.tsx",
        ]

        cases.forEach(file => {
            it(`supports ${file} type imports`, async () => {
                const out = await analyze([file], "typescript")

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
})
