import { analyzeTypeScript } from "./typescript"
import { flatMap } from "./utils"

describe("integration-test", () => {
    test("ant-design", async () => {
        const rootDir = "design-systems/ant-design/repo/"
        const result = await analyzeTypeScript([`${rootDir}/components/index.tsx`], `${rootDir}/tsconfig.json`)

        const componentNames = flatMap(result, file => file.components).map(comp => comp.name)

        expect(componentNames).toEqual([
            "Affix",
            "Anchor",
            "AutoComplete",
            "Alert",
            "Avatar",
            "BackTop",
            "Badge",
            "Breadcrumb",
            "Button",
            "Calendar",
            "Card",
            "Collapse",
            "Carousel",
            "Cascader",
            "Checkbox",
            "Col",
            "Comment",
            "ConfigProvider",
            "Descriptions",
            "Divider",
            "Dropdown",
            "Drawer",
            "Form",
            "Icon",
            "Input",
            "InputNumber",
            "List",
            "LocaleProvider",
            "Menu",
            "Mentions",
            "Modal",
            "PageHeader",
            "Pagination",
            "Popconfirm",
            "Popover",
            "Progress",
            "Radio",
            "Rate",
            "Row",
            "Select",
            "Skeleton",
            "Slider",
            "Spin",
            "Steps",
            "Switch",
            "Table",
            "Transfer",
            "Tree",
            "TreeSelect",
            "Tabs",
            "Tag",
            "TimePicker",
            "Timeline",
            "Tooltip",
            "Mention",
            "Upload",
        ])
    })
})
