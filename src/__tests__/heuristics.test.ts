import { applyA11yHeuristic, applyHrefHeuristic, applyLabelHeuristic, applyBooleanHeuristic } from "../heuristics"

describe("heuristics", () => {
    test("applyA11yHeuristic", () => {
        const comp = applyA11yHeuristic({
            name: "A",
            propTypes: [
                { name: "aria-hidden", type: "string" },
                { name: "ariaHidden", type: "string" },
                { name: "a11yField", type: "string" },
                { name: "ariaDescription", type: "string" },
                { name: "ariaHidden", type: "boolean" },
                { name: "splitButtonAriaLabel", type: "string" },
                { name: "arial", type: "string" },
            ],
        })

        expect(comp.propTypes).toEqual([{ name: "arial", type: "string" }])
    })

    test("applyHrefHeuristic", () => {
        const comp = applyHrefHeuristic({
            name: "A",
            propTypes: [{ name: "href", type: "string" }, { name: "nonHref", type: "string" }],
        })

        expect(comp.propTypes).toEqual([
            {
                name: "href",
                type: "string",
                defaultValue: "https://framer.com",
            },
            {
                name: "nonHref",
                type: "string",
            },
        ])
    })

    test("applyLabelHeuristic", () => {
        const comp = applyLabelHeuristic({
            name: "A",
            propTypes: [
                { name: "text", type: "string" },
                { name: "label", type: "string" },
                { name: "placeholder", type: "string" },
                { name: "somethingElse", type: "string" },
            ],
        })

        expect(comp.propTypes).toEqual([
            { name: "text", type: "string", defaultValue: "text" },
            { name: "label", type: "string", defaultValue: "label" },
            { name: "placeholder", type: "string", defaultValue: "placeholder" },
            { name: "somethingElse", type: "string" },
        ])
    })

    test("applyBooleanHeuristic", () => {
        const comp = applyBooleanHeuristic({
            name: "A",
            propTypes: [{ name: "text", type: "boolean" }],
        })

        expect(comp.propTypes).toEqual([{ name: "text", type: "boolean", defaultValue: false }])
    })
})
