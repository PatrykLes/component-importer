import { analyzeTypeScript } from "../typescript"
import fs from "fs"
import { flatMap } from "../utils"

describe("integration-test", () => {
    test("polaris", async () => {
        const rootDir = "design-systems/polaris/repo/"
        const result = await analyzeTypeScript([`${rootDir}/src/index.ts`], `${rootDir}/tsconfig.json`)

        const componentNames = flatMap(result, file => file.components).map(comp => comp.name)

        expect(componentNames).toEqual([
            // XXX "contentContextTypes" should not be detected
            "contentContextTypes",
            "AccountConnection",
            "ActionList",
            "ActionMenu",
            "AppProvider",
            "polarisContextTypes",
            "Badge",
            "Banner",
            "Backdrop",
            "Breadcrumbs",
            "Button",
            "ButtonGroup",
            "CalloutCard",
            "Caption",
            "ChoiceList",
            "ColorPicker",
            "Connected",
            "ContextualSaveBar",
            "DescriptionList",
            "DisplayText",
            "EmptyState",
            "EventListener",
            "ExceptionList",
            "Focus",
            "TrapFocus",
            "FooterHelp",
            "FormLayout",
            "Heading",
            "Icon",
            "Image",
            "KeyboardKey",
            "KeypressListener",
            "Label",
            "Labelled",
            "Layout",
            "Link",
            "List",
            "Navigation",
            "PageActions",
            "Pagination",
            "Popover",
            "Portal",
            "RadioButton",
            "ScrollLock",
            "Select",
            "SettingToggle",
            "Spinner",
            "Stack",
            "Sticky",
            "Subheading",
            "Tag",
            "TextContainer",
            "TextStyle",
            "Thumbnail",
            "ThemeProvider",
            "Tooltip",
            "Truncate",
            "VisuallyHidden",
            "SkeletonBodyText",
            "SkeletonDisplayText",
            "SkeletonThumbnail",
            "ProgressBar",
            "Indicator",
        ])
    })
})
