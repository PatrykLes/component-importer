#!/usr/bin/env node

// XXX Probably not the most idiomatic way of doing this
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production"
}

import commandLineArgs, { OptionDefinition } from "command-line-args"
import { commandGenerateComponents } from "./cli/commandGenerateComponents"
import { commandGenerateConfiguration } from "./cli/commandGenerateConfiguration"

type CliMainArguments = {
    command: "init" | "generate"
    _unknown: string[]
}

function main() {
    const mainDefinitions: (OptionDefinition & { name: keyof CliMainArguments })[] = [
        { name: "command", defaultOption: true, defaultValue: "generate" },
    ]
    const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true }) as CliMainArguments
    const argv = mainOptions._unknown || []

    if (mainOptions.command === "init") {
        commandGenerateConfiguration(argv)
    } else if (mainOptions.command === "generate") {
        commandGenerateComponents(argv)
    } else {
        console.error("Unknown command", mainOptions.command)
    }
}

main()
