import { verifyOptions } from "../compilerOptions"

describe("compilerOptions", () => {
    test("Empty files should not verify", () => {
        expect(verifyOptions({})).toMatchObject({ valid: false })
        expect(verifyOptions({})).toMatchObject({ valid: false })
        expect(verifyOptions(1)).toMatchObject({ valid: false })
        expect(verifyOptions("")).toMatchObject({ valid: false })
    })

    test("Valid Typescript configurations should verify", () => {
        expect(
            verifyOptions({
                mode: "typescript",
            }),
        ).toEqual({
            errors: [
                "Expected 'packageName' to be a string",
                "Expected 'rootFiles' to be a non-empty array if the mode is 'typescript', otherwise it should be undefined",
                "Expected 'additionalImports' to be an array of strings",
                "Expected 'components' to be an object.",
                "Expected 'out' to be a string",
            ],
            valid: false,
        })

        expect(
            verifyOptions({
                mode: "typescript",
                packageName: "foo",
                rootFiles: ["foo", "bar"],
                out: "code/",
                additionalImports: [],
                components: { Button: { ignore: false } },
            }),
        ).toMatchObject({
            valid: true,
        })

        expect(
            verifyOptions({
                packageName: "foo",
                rootFiles: ["foo", "bar"],
                out: "code/",
                additionalImports: [],
                components: { Button: { ignore: false } },
            }),
        ).toMatchObject({
            valid: true,
        })
    })

    test("Valid Flow/Plain configurations should verify", () => {
        expect(
            verifyOptions({
                mode: "plain",
            }),
        ).toEqual({
            errors: [
                "Expected 'packageName' to be a string",
                "Expected 'additionalImports' to be an array of strings",
                "Expected 'components' to be an object.",
                "Expected 'out' to be a string",
            ],
            valid: false,
        })

        expect(
            verifyOptions({
                mode: "plain",
                packageName: "foo",
                out: "code/",
                additionalImports: [],
                components: { Button: { ignore: false } },
            }),
        ).toMatchObject({
            valid: true,
        })

        expect(
            verifyOptions({
                mode: "flow",
                packageName: "foo",
                out: "code/",
                additionalImports: [],
                components: { Button: { ignore: false } },
            }),
        ).toMatchObject({
            valid: true,
        })
    })
})
