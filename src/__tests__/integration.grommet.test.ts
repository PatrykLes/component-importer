import { analyzeTypeScript } from "../typescript"
import fs from "fs"
import { flatMap } from "../utils"

describe("integration-test", () => {
    test("grommet", async () => {
        const rootDir = "design-systems/grommet/repo/"
        const result = await analyzeTypeScript([`${rootDir}/src/js/index.d.ts`])

        const componentNames = flatMap(result, file => file.components).map(comp => comp.name)

        expect(componentNames).toEqual([
            "Accordion",
            "AccordionPanel",
            "Anchor",
            "Box",
            "Button",
            "Calendar",
            "Carousel",
            "Chart",
            "CheckBox",
            "Clock",
            "Collapsible",
            "DataTable",
            "Diagram",
            "Distribution",
            "Drop",
            "DropButton",
            "Form",
            "FormField",
            "Grid",
            "Grommet",
            "Heading",
            "Image",
            "InfiniteScroll",
            "Keyboard",
            "Layer",
            "Markdown",
            "MaskedInput",
            "Menu",
            "Meter",
            "Paragraph",
            "RadioButton",
            "RadioButtonGroup",
            "RangeInput",
            "RangeSelector",
            "RoutedAnchor",
            "RoutedButton",
            "Select",
            "SkipLink",
            "SkipLinks",
            "SkipLinkTarget",
            "Stack",
            "Table",
            "TableBody",
            "TableCell",
            "TableFooter",
            "TableHeader",
            "TableRow",
            "Tab",
            "Tabs",
            "Text",
            "TextArea",
            "TextInput",
            "Video",
            "WorldMap",
            "AnnounceContext",
            "ResponsiveContext",
        ])
    })
})
