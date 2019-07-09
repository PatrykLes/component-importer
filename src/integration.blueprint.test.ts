import { analyzeTypeScript } from "./typescript"
import { flatMap } from "./utils"

describe("integration-test", () => {
    test("blueprint", async () => {
        const rootDir = "design-systems/blueprint/repo/packages/core/src/"
        const result = await analyzeTypeScript([`${rootDir}/index.ts`], `${rootDir}/tsconfig.json`)

        const componentNames = flatMap(result, file => file.components).map(comp => comp.name)

        expect(componentNames).toEqual([
            "AbstractComponent",
            "AbstractPureComponent",
            "Alert",
            "Breadcrumb",
            "Breadcrumbs",
            "Button",
            "AnchorButton",
            "ButtonGroup",
            "Callout",
            "Card",
            "Collapse",
            "CollapsibleList",
            "Dialog",
            "Divider",
            "Drawer",
            "EditableText",
            "ControlGroup",
            "Switch",
            "Radio",
            "Checkbox",
            "FileInput",
            "FormGroup",
            "InputGroup",
            "NumericInput",
            "RadioGroup",
            "TextArea",
            "HTMLSelect",
            "HTMLTable",
            "Hotkeys",
            "Icon",
            "Menu",
            "MenuDivider",
            "MenuItem",
            "Navbar",
            "NavbarDivider",
            "NavbarGroup",
            "NavbarHeading",
            "NonIdealState",
            "OverflowList",
            "Overlay",
            "Text",
            "PanelStack",
            "Popover",
            "Portal",
            "ProgressBar",
            "ResizeSensor",
            "MultiSlider",
            "RangeSlider",
            "Slider",
            "Spinner",
            "Tab",
            "Expander",
            "Tabs",
            "Tag",
            "TagInput",
            "Toast",
            "Toaster",
            "Tooltip",
            "Tree",
            "TreeNode",
        ])
    })
})
