import { analyzeTypeScript } from "./typescript"
import { flatMap } from "./utils"

describe("integration-test", () => {
    test("ant-design", async () => {
        const rootDir = "design-systems/ant-design/repo/"
        const result = await analyzeTypeScript([`${rootDir}/components/index.tsx`], `${rootDir}/tsconfig.json`)

        const componentNames = flatMap(result, file => file.components).map(comp => comp.name)

        expect(componentNames.length).toBeGreaterThan(0)
    })
})
