#!/bin/bash
# Updates git tag based on the new version in the package.json file

set -e

PKG_FILE="package.json"

if [ ! -f "$PKG_FILE" ]; then
    echo "Error: $PKG_FILE not found."
    exit 1
fi

VERSION=$(grep '"version"' "$PKG_FILE" | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')
if [ -z "$VERSION" ]; then
    echo "Error: Version not found in $PKG_FILE."
    exit 1
fi

TAG="v$VERSION"

if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "Tag $TAG already exists."
    exit 0
fi

git commit -m "chore: bump version to $VERSION"
git tag -a "$TAG" -m "Release version $TAG"

git push origin main
git push origin "$TAG"
echo "Created git tag: $TAG"