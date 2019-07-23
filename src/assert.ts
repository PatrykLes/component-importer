import { strict as assert } from "assert"

// @ts-ignore
const assertImpl: typeof assert =
    process.env.NODE_ENV === "production"
        ? function() {
              // do nothing
          }
        : assert

console.log("process.env", process.env.NODE_ENV)

export { assertImpl as assert }
