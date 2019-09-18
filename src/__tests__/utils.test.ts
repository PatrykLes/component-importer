import { splitWords, ensureExtension, difference, differenceBy } from "../utils"

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

    test("difference", () => {
        expect(difference([1, 2, 3], [2, 3])).toEqual(new Set([1]))
        expect(difference([1, 2, 3], [4, 5])).toEqual(new Set([1, 2, 3]))
        expect(difference([1, 2, 3], [1, 2, 3])).toEqual(new Set([]))
    })

    test("differenceBy", () => {
        const identity = (x: any) => x
        expect(differenceBy([1, 2, 3], identity, [2, 3], identity)).toEqual([1])
        expect(differenceBy([1, 2, 3], identity, [4, 5], identity)).toEqual([1, 2, 3])
        expect(differenceBy([1, 2, 3], identity, [1, 2, 3], identity)).toEqual([])

        const getX = (obj: { x: number }) => obj.x
        expect(differenceBy([{ x: 1 }, { x: 2 }, { x: 3 }], getX, [{ x: 2 }, { x: 3 }], getX)).toEqual([{ x: 1 }])
        expect(differenceBy([{ x: 1 }, { x: 2 }, { x: 3 }], getX, [{ x: 4 }, { x: 5 }], getX)).toEqual([
            { x: 1 },
            { x: 2 },
            { x: 3 },
        ])
        expect(differenceBy([{ x: 1 }, { x: 2 }, { x: 3 }], getX, [{ x: 1 }, { x: 2 }, { x: 3 }], getX)).toEqual([])

        const getY = (obj: { y: number }) => obj.y
        expect(differenceBy([{ x: 1 }, { x: 2 }, { x: 3 }], getX, [{ y: 2 }, { y: 3 }], getY)).toEqual([{ x: 1 }])
        expect(differenceBy([{ x: 1 }, { x: 2 }, { x: 3 }], getX, [{ y: 4 }, { y: 5 }], getY)).toEqual([
            { x: 1 },
            { x: 2 },
            { x: 3 },
        ])
        expect(differenceBy([{ x: 1 }, { x: 2 }, { x: 3 }], getX, [{ y: 1 }, { y: 2 }, { y: 3 }], getY)).toEqual([])
    })
})
