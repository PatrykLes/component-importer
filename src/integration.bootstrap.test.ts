import { analyzeTypeScript } from "./typescript"
import fs from "fs"
import { flatMap } from "./utils"

describe("integration-test", () => {
    test("bootstrap", async () => {
        const rootDir = "design-systems/bootstrap/repo/"
        const result = await analyzeTypeScript([`${rootDir}/types/index.d.ts`], `${rootDir}/types/tsconfig.json`)

        const componentNames = flatMap(result, file => file.components).map(comp => comp.name)

        expect(componentNames.length).toBeGreaterThan(0)
    })
})
