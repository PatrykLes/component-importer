import { splitWords, ensureExtension } from "../utils"

describe("utils", () => {
    test("splitWords", () => {
        expect(splitWords("fooBarBaz")).toEqual(["foo", "Bar", "Baz"])
        expect(splitWords("FooBarBaz")).toEqual(["Foo", "Bar", "Baz"])
        expect(splitWords("")).toEqual([])
        expect(splitWords("a")).toEqual(["a"])
        expect(splitWords("abc")).toEqual(["abc"])
        expect(splitWords("a-")).toEqual(["a"])
        expect(splitWords("a-b")).toEqual(["a", "b"])
        expect(splitWords("ab-bde-asdFoo")).toEqual(["ab", "bde", "asd", "Foo"])
        expect(splitWords("a11yField")).toEqual(["a11y", "Field"])
    })

    test("ensureExtension", () => {
        expect(ensureExtension("foo", "tsx")).toEqual("foo.tsx")
        expect(ensureExtension("foo.tsx", "tsx")).toEqual("foo.tsx")
        expect(ensureExtension("foo/bar.tsx", "tsx")).toEqual("foo/bar.tsx")
        expect(ensureExtension("foo/bar", "tsx")).toEqual("foo/bar.tsx")
    })
})
