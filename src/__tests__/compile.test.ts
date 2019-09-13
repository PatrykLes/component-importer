import { compile } from "../compile"
import { makePrettier } from "../utils"

describe("compile | typescript", () => {
    describe("compiles components", () => {
        const cases: Array<string> = [
            "./src/__mocks__/exportClass.tsx",
            "./src/__mocks__/exportConstArrow.tsx",
            "./src/__mocks__/exportJsxFunction.1.tsx",
            "./src/__mocks__/exportJsxFunction.2.tsx",
            "./src/__mocks__/exportDefaultClass.tsx",
            "./src/__mocks__/exportDefaultReference.1.tsx",
            "./src/__mocks__/exportDefaultReference.2.tsx",
            "./src/__mocks__/exportDefaultReference.tsx",
            "./src/__mocks__/exportFrom.1.tsx",
            "./src/__mocks__/exportFrom.2.tsx",
            "./src/__mocks__/exportFrom.3.tsx",
            "./src/__mocks__/exportFrom.4.tsx",
            "./src/__mocks__/exportLetArrow.tsx",
            "./src/__mocks__/exportReference.1.tsx",
            "./src/__mocks__/exportReference.2.tsx",
            "./src/__mocks__/exportReference.3.tsx",
            "./src/__mocks__/exportReference.4.tsx",
        ]

        cases.forEach(file => {
            it(`compiles ${file} correctly`, async () => {
                const out = await compile({
                    packageName: "@foo/core",
                    rootFiles: [file],
                    additionalImports: [],
                    components: {},
                    out: "",
                })

                expect(out[0]).toEqual({
                    type: "component",
                    fileName: "SimpleReactComponent.tsx",
                    outputSource: await makePrettier(`
                        import * as React from "react";
                        import * as System from "@foo/core";
                        import { ControlType, PropertyControls, addPropertyControls } from "framer";
                        import { withHOC } from "./withHOC";

                        const style: React.CSSProperties = {
                            width: "100%",
                            height: "100%"
                        };

                        const InnerSimpleReactComponent: React.SFC = props => {
                            return <System.SimpleReactComponent {...props} style={style} />;
                        };

                        export const SimpleReactComponent = withHOC(InnerSimpleReactComponent);

                        SimpleReactComponent.defaultProps = {
                            width: 150,
                            height: 50
                        };

                        addPropertyControls(SimpleReactComponent, {
                            text: { title: \"Text\", defaultValue: \"text\", type: ControlType.String },
                            num: { title: \"Num\", type: ControlType.Number },
                            bool: { title: \"Bool\", defaultValue: false, type: ControlType.Boolean },
                            fancyColor: {
                                title: "FancyColor",
                                defaultValue: "#09F",
                                type: ControlType.Color
                            }
                        });
                    `),
                })
            })
        })
    })
})
