#!/bin/bash
# Package the repository into a zip file for sale/export
# Usage: ./scripts/package-release.sh
set -euo pipefail
ROOT_DIR=$(dirname "$(realpath "$0")")/..
cd "$ROOT_DIR"
ZIP_NAME="propauto-release-$(date +%Y%m%d-%H%M%S).zip"
# Exclude node_modules and .git
zip -r "$ZIP_NAME" . -x "*/node_modules/*" ".git/*" "*.zip"
echo "Created $ZIP_NAME"
