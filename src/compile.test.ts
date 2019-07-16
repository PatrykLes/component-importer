import { compile } from "./compile"

describe("compile | typescript", () => {
    describe("compiles components", () => {
        const cases: Array<string> = [
            "./src/__mocks__/exportClass.tsx",
            "./src/__mocks__/exportConstArrow.tsx",
            // TODO: doesn't work
            // "./src/__mocks__/exportDefaultArrow.tsx",
            "./src/__mocks__/exportDefaultClass.tsx",
            "./src/__mocks__/exportDefaultReference.1.tsx",
            "./src/__mocks__/exportDefaultReference.2.tsx",
            "./src/__mocks__/exportDefaultReference.tsx",
            // TODO: doesn't work
            // "./src/__mocks__/exportFrom.1.tsx",
            "./src/__mocks__/exportFrom.2.tsx",
            "./src/__mocks__/exportLetArrow.tsx",
            "./src/__mocks__/exportReference.1.tsx",
        ]

        cases.forEach(file => {
            it(`compiles ${file} correctly`, async () => {
                const out = await compile({ packageName: "@foo/core", rootFiles: [file] })

                expect(out).toEqual([
                    {
                        fileName: "SimpleReactComponent.tsx",
                        outputSource: `import * as React from "react";
import * as System from "@foo/core";
import { ControlType, PropertyControls, addPropertyControls } from "framer";

const style: React.CSSProperties = {
  width: "100%",
  height: "100%"
};

export const SimpleReactComponent: React.SFC = props => {
  return <System.SimpleReactComponent {...props} style={style} />;
};

SimpleReactComponent.defaultProps = {
  width: 150,
  height: 50
};

addPropertyControls(SimpleReactComponent, {
  text: { title: \"Text\", type: ControlType.String },
  num: { title: \"Num\", type: ControlType.Number },
  bool: { title: \"Bool\", type: ControlType.Boolean }
});
`,
                    },
                ])
            })
        })
    })
})
