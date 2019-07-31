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
    help: boolean
    _unknown: string[]
}

function printUsage() {
    console.log(`Usage
    component-importer init [...options]
    component-importer generate [...options]

For help on the individual commands add the --help option
    `)
}

async function main() {
    const mainDefinitions: (OptionDefinition & { name: keyof CliMainArguments })[] = [
        { name: "command", defaultOption: true, defaultValue: "generate" },
    ]
    const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true }) as CliMainArguments

    const argv = mainOptions._unknown || []

    if (mainOptions.command === "init") {
        await commandGenerateConfiguration(argv)
    } else if (mainOptions.command === "generate") {
        await commandGenerateComponents(argv)
    } else {
        printUsage()
    }
}

main()
