import { strict as assert } from "assert"

// @ts-ignore
const assertImpl: typeof assert =
    process.env.NODE_ENV === "production"
        ? function() {
              // do nothing
          }
        : assert

export { assertImpl as assert }
