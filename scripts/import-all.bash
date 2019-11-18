#!/usr/bin/env bash

set -euo pipefail

#
# Creates a new empty NPM package with the given dependency added.
#
# Usage:
#
#   ./scripts/import <npm package name> <npm package version>
#
# Example:
#
#   ./scripts/import "antd" "3.22.2"
#
# Will create the following folder structure:
#
# integration-test-data/
# └─ ant-design/         <==== matches the first argument
#    ├─ package.json     <==== will create a package json
#    └─ node_modules/
#       └─ ant-design/   <==== will add ant-design as a dependency on the given version
#
function import-design-system() {
    DEP_NAME="$1"
    DIR="integration-test-data/$1"
    VERSION="$2"

    if [ -d "$DIR" ]; then
        echo "Skipping importing $DEP_NAME because it already exists."
        return
    fi

    mkdir -p "$DIR"

    yarn --cwd "$DIR" init --yes
    yarn --cwd "$DIR" add "$DEP_NAME@$VERSION"
}

import-design-system "antd" "3.22.2"
import-design-system "@blueprintjs/core" "3.18.0"
import-design-system "grommet" "2.7.7"
import-design-system "@material-ui/core" "4.4.0"
# TODO: re-enable once module support has been added
# See
# import-design-system "baseui" "8.17.1"
import-design-system "office-ui-fabric-react" "7.29.0"
import-design-system "@salesforce/design-system-react" "0.10.13"
