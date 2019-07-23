import { analyzeTypeScript } from "../typescript"
import { readFileSync } from "fs"

describe("extractPropTypes", () => {
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

    it.only("supports ts declaration files", async () => {
        const out = await analyzeTypeScript(["./src/__mocks__/propsTesterComponent.complexButton.tsx"])

        expect(out[0].components[0].propTypes).toMatchObject([
            {
                name: "a11yTitle",
                type: "string",
            },
            {
                name: "alignSelf",
                type: "enum",
                possibleValues: ["start", "center", "end", "stretch"],
            },
        ])
    })
})
