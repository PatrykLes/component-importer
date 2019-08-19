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
    console.log(`# Component Importer

Commands:

    # init: Sets up the importer.config.json configuration file
    component-importer init [...options]

    # generate: Imports components & generates code based on an existing importer.config.json
    component-importer generate [...options]

For help on the individual commands add the --help option. Example: component-importer init --help
    `)
}

async function main() {
    const mainDefinitions: (OptionDefinition & { name: keyof CliMainArguments })[] = [
        { name: "command", defaultOption: true },
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
