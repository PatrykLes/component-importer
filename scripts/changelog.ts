const { writeFileSync } = require("fs")
const { execSync } = require("child_process")

/**********************************************
 * Change Log Script
 *
 * To re-generate the changelog run
 *********************************************/

type CommitType = "Feature" | "Maintenance" | "Documentation" | "Fix" | "Publish" | "Other"

type GitLogLine = {
    hash: string
    type: CommitType
    commitString: string
}

type Changelog = {
    version: string
    changes: GitLogLine[]
}

const CommitTypes: CommitType[] = ["Feature", "Fix", "Documentation", "Maintenance", "Other", "Publish"]

function parseCommitString(
    hash: string,
    rawCommitString: string,
): { type: CommitType; commitString: string } | undefined {
    if (/^v?\d+\.\d+\.\d+$/.test(rawCommitString)) {
        return { type: "Publish", commitString: rawCommitString }
    }
    const match = rawCommitString.match(/^(\w+):(.*)$/)
    if (match) {
        const commitTypeString = match[1]
        const parsedCommitString = match[2]

        const commitTypeMap: Record<string, CommitType> = {
            feat: "Feature",
            fix: "Fix",
            refactor: "Maintenance",
            test: "Maintenance",
            chore: "Maintenance",
            docs: "Documentation",
            ["chore(deps)"]: "Maintenance",
        }
        return { type: commitTypeMap[commitTypeString], commitString: parsedCommitString.trim() }
    }

    return {
        type: "Other",
        commitString: rawCommitString,
    }
}

function parseLine(line: string): GitLogLine | undefined {
    const [hash, rawCommitString] = line.split("|", 2)

    const parsed = parseCommitString(hash, rawCommitString.trim())

    if (!parsed) {
        return undefined
    }

    return {
        ...parsed,
        hash: hash.trim(),
    }
}

function parseChangelog(lines: GitLogLine[]) {
    const changelog: Changelog[] = []

    let currentVersion = undefined
    let linesInVersion: GitLogLine[] = []

    for (const line of lines) {
        if (line.type === "Publish") {
            changelog.push({
                version: currentVersion,
                changes: linesInVersion,
            })
            currentVersion = line.commitString
            linesInVersion = []
        } else if (currentVersion) {
            linesInVersion.push(line)
        }
    }

    if (linesInVersion.length > 0) {
        changelog.push({
            version: currentVersion,
            changes: linesInVersion,
        })
    }

    return changelog
}

function printChangelog(changelog: Changelog[]) {
    const lines: string[] = []

    for (const log of changelog) {
        lines.push(`## Version: ${log.version}`)
        lines.push("")
        lines.push("### Changes")
        lines.push("")

        for (const commitType of CommitTypes) {
            const filteredChanges = log.changes.filter(change => change.type === commitType)
            if (filteredChanges.length === 0) {
                continue
            }

            lines.push(`#### ${commitType}`)
            lines.push("")

            for (const { hash, commitString } of filteredChanges) {
                lines.push(` - [${hash}](https://github.com/framer/component-importer/commit/${hash}): ${commitString}`)
            }

            lines.push("")
        }
    }

    writeFileSync("CHANGELOG.md", lines.join("\n"))
}

const lines: GitLogLine[] = execSync("git log --pretty=format:'%h| %s'")
    .toString()
    .split("\n")
    .map(parseLine)
    .filter((parsed: GitLogLine | undefined) => !!parsed)

const changelog = parseChangelog(lines)

printChangelog(changelog)
