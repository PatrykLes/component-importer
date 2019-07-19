import { analyzeTypeScript } from "./typescript"
import fs from "fs"
import { flatMap } from "./utils"

describe("integration-test", () => {
    test("polaris", async () => {
        const rootDir = "design-systems/polaris/repo/"
        const result = await analyzeTypeScript([`${rootDir}/src/index.ts`], `${rootDir}/tsconfig.json`)

        const componentNames = flatMap(result, file => file.components).map(comp => comp.name)

        expect(componentNames).toEqual([])
    })
})
