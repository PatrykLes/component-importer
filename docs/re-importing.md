# Re-importing

In order to minimize the amount of time spent keeping your Framer X package in sync with your design system, the `component-importer` provides a simple mechanism for merging changes. This is called re-importing.

## How does re-importing work?

Re-importing is a problem that can be divided into 3 sub-problems:

1. How to make sure new components are added?
1. How to prevent removed components from being re-imported?
1. How to ensure my changes are preserved after re-importing?

Let's look at each one individually:

### How to make sure new components are added?

You've updated your design system to the latest and greatest version and there's a bunch of new components that you want to import. The `component-importer` will automatically detect new components and generate code for them, so you don't need any additional configuration 🎉.

### How to prevent removed components from being re-imported?

Let imagine that you've imported a design system with 10 components, but only ended up using 5. If you run the `component-importer` again, it will find those new components and re-generate them, which is most likely not what you wanted. To prevent this from happening you can mark components to be ignored in the `importer.config.json` as follows:

```js
{
  "packageName": "grommet",
  "rootFiles": [
    "node_modules/grommet/index.d.ts",
  ],
  "out": "code/",
  "components": {
    "Button": {
      "ignore": false
    },
    "Heading": {
      "ignore": false
    },
    "AccordionPanel": {
      "ignore": true  // <========= this component should not be re-generated in the future.
    },
  },
  "cssImports": ["import/path/to/main.css"],
}
```

### How to ensure my changes are preserved after re-importing?

The `component-importer` will try to re-write the `addPropertyControls` statement using 2 intuitive rules to resolve conflicts:

**Rule 1**: New property controls are always added by default.
**Rule 2**: Existing property controls are never modified.

An example will make these rules easier to understand. Let's assume that we ran the `component-importer` and obtained the following generated code.

```ts
import * as React from "react"
import * as BaseUi from "baseui/button"
import { addPropertyControls, ControlType } from "framer"

function Button(props) {
    return <BaseUi.Button {...props} />
}

addPropertyControls(Button, {
    kind: {
        type: ControlType.Enum,
        defaultValue: "primary",
        options: ["primary", "secondary"]
    },
    label: { type: ControlType.String },
    isLoading: { type: ControlType.Boolean, defaultValue: false },
    margins: { type: ControlType.Number, defaultValue: 0 }
})
```

You want to perform two changes:
1. Add a default value to the `label`.
2. Remove the `margins` control.

```ts
addPropertyControls(Button, {
    kind: {
        type: ControlType.Enum,
        defaultValue: "primary",
        options: ["primary", "secondary"]
    },
    label: {
        type: ControlType.String,
        defaultValue: "Label" // <==== default value added here
    },
    isLoading: {
        type: ControlType.Boolean,
        defaultValue: false
    },
    // <===== margins have been removed.
})
```

Let's assume that a new property `disabled` was added to the button.

From **Rule 1** (New property controls are always added by default.) two things will happen:
 - The `disabled` property control will be added.
 - The `margins` will be re-added. To instruct the importer to not re-add the `margins` you will need to mark that property `importer.config.json`. as follows:

```js
{
    // other configuration ommitted for brevity
    "components": {
        "Button": {
            "ignoredProps": ["margins"] // <======= margins are ignored
        }
     }
}
```

**Rule 2** (Existing property controls are never modified.) tells us that any changes we made to the components will be preserved. So let's take a look at the resulting code after `re-importing`:

```ts
addPropertyControls(Button, {
    kind: {
        type: ControlType.Enum,
        defaultValue: "primary",
        options: ["primary", "secondary"]
    },
    label: {
        type: ControlType.String,
        defaultValue: "Label" // <==== Existing property controls are left unmodified.
    },
    isLoading: {
        type: ControlType.Boolean,
        defaultValue: false
    },
    // <==== The margins property control is no longer present since it was added to the `ignoredProps`.
    disabled: {     // <==== The new disabled property control was added as expected.
        type: ControlType.Boolean,
        defaultValue: false
    }
})
```
