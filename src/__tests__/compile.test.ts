import { compile } from "../compile"
import { makePrettier, resolveComponentImportPath } from "../utils"

describe("compile", () => {
    describe("typescript", () => {
        describe("compiles components", () => {
            const cases: Array<string> = [
                "./src/__mocks__/typescript/exportClass.tsx",
                "./src/__mocks__/typescript/exportConstArrow.tsx",
                "./src/__mocks__/typescript/exportJsxFunction.1.tsx",
                "./src/__mocks__/typescript/exportJsxFunction.2.tsx",
                "./src/__mocks__/typescript/exportDefaultClass.tsx",
                "./src/__mocks__/typescript/exportDefaultReference.1.tsx",
                "./src/__mocks__/typescript/exportDefaultReference.2.tsx",
                "./src/__mocks__/typescript/exportDefaultReference.tsx",
                "./src/__mocks__/typescript/exportFrom.1.tsx",
                "./src/__mocks__/typescript/exportFrom.2.tsx",
                "./src/__mocks__/typescript/exportFrom.3.tsx",
                "./src/__mocks__/typescript/exportFrom.4.tsx",
                "./src/__mocks__/typescript/exportLetArrow.tsx",
                "./src/__mocks__/typescript/exportReference.1.tsx",
                "./src/__mocks__/typescript/exportReference.2.tsx",
                "./src/__mocks__/typescript/exportReference.3.tsx",
                "./src/__mocks__/typescript/exportReference.4.tsx",
            ]

            cases.forEach(file => {
                it(`compiles ${file} correctly`, async () => {
                    const out = await compile({
                        mode: "typescript",
                        packageName: "@foo/core",
                        rootFiles: [file],
                        additionalImports: [],
                        components: {
                            SimpleReactComponent: {
                                ignore: false,
                                path: "foo/bar/file.tsx",
                            },
                        },
                        out: "",
                        projectRoot: ".",
                    })

                    expect(out[0]).toEqual({
                        type: "component",
                        emitPath: "foo/bar/file.tsx",
                        outputSource: await makePrettier(`
import * as React from "react";
import * as System from "@foo/core";
import { ControlType, PropertyControls, addPropertyControls } from "framer";
import { withHOC } from "./withHOC";

const InnerSimpleReactComponent = props => {
    return <System.SimpleReactComponent {...props} />;
};

export const SimpleReactComponent = withHOC(InnerSimpleReactComponent);

SimpleReactComponent.defaultProps = {
    width: 150,
    height: 50
};

addPropertyControls(SimpleReactComponent, {
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue: "text",
    },
    num: {
        title: "Num",
        type: ControlType.Number,
    },
    bool: {
        title: "Bool",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    fancyColor: {
        title: "Fancy color",
        type: ControlType.Color,
        defaultValue: "#09F"
    }
});
`),
                    })
                })
            })
        })
    })

    describe("plain JavaScript", () => {
        describe("compiles components", () => {
            const cases: Array<string> = [
                "./src/__mocks__/plain/exportClass.js",
                "./src/__mocks__/plain/exportConstArrow.js",
                "./src/__mocks__/plain/exportDefaultReference.js",
                "./src/__mocks__/plain/exportJsxFunction.js",
                "./src/__mocks__/plain/exportLetArrow.js",
            ]

            cases.forEach(file => {
                it(`compiles ${file} correctly`, async () => {
                    const out = await compile({
                        mode: "plain",
                        packageName: file,
                        rootFiles: [],
                        additionalImports: [],
                        components: {
                            SimpleReactComponent: {
                                ignore: false,
                                path: "foo/bar/file.tsx",
                            },
                        },
                        out: "",
                        projectRoot: ".",
                    })

                    expect(out[0]).toEqual({
                        type: "component",
                        emitPath: "foo/bar/file.tsx",
                        outputSource: await makePrettier(`
import * as React from "react";
import * as System from "${resolveComponentImportPath(file, "")}";
import { ControlType, PropertyControls, addPropertyControls } from "framer";
import { withHOC } from "./withHOC";

const InnerSimpleReactComponent = props => {
    return <System.SimpleReactComponent {...props} />;
};

export const SimpleReactComponent = withHOC(InnerSimpleReactComponent);

SimpleReactComponent.defaultProps = {
    width: 150,
    height: 50
};

addPropertyControls(SimpleReactComponent, {
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue: "Placeholder",
    },
    num: {
        title: "Num",
        type: ControlType.Number,
        defaultValue: 42,
    },
    bool: {
        title: "Bool",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    fancyColor: {
        title: "Fancy color",
        type: ControlType.Color,
        defaultValue: "#0099ff",
    }
});
`),
                    })
                })
            })
        })
    })
})
