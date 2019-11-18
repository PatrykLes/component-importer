import { PropTypeName } from "../analyze/extractPropTypes/types"
import { applyA11yHeuristic, applyHrefHeuristic, applyLabelHeuristic, applyBooleanHeuristic } from "../heuristics"

describe("heuristics", () => {
    test("applyA11yHeuristic", () => {
        const comp = applyA11yHeuristic({
            name: "A",
            propTypes: [
                { name: "aria-hidden", type: PropTypeName.string },
                { name: "ariaHidden", type: PropTypeName.string },
                { name: "a11yField", type: PropTypeName.string },
                { name: "ariaDescription", type: PropTypeName.string },
                { name: "ariaHidden", type: PropTypeName.boolean },
                { name: "splitButtonAriaLabel", type: PropTypeName.string },
                { name: "arial", type: PropTypeName.string },
            ],
        })

        expect(comp.propTypes).toEqual([{ name: "arial", type: "string" }])
    })

    test("applyHrefHeuristic", () => {
        const comp = applyHrefHeuristic({
            name: "A",
            propTypes: [{ name: "href", type: PropTypeName.string }, { name: "nonHref", type: PropTypeName.string }],
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
                { name: "text", type: PropTypeName.string },
                { name: "label", type: PropTypeName.string },
                { name: "placeholder", type: PropTypeName.string },
                { name: "somethingElse", type: PropTypeName.string },
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
            propTypes: [{ name: "text", type: PropTypeName.boolean }],
        })

        expect(comp.propTypes).toEqual([{ name: "text", type: "boolean", defaultValue: false }])
    })
})
