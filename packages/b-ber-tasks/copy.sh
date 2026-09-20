#!/usr/bin/env bash
set -euo pipefail

# keep in sync with scripts in package.json
declare -a browserFiles=(
  "src/web/search.js"
  "src/web/worker.js"
  "src/web/navigation.js"
  "src/web/event-handlers.js"
)

declare -a nodeFiles=(
  "src/cover/freeuniversal-bold-webfont.ttf"
)

# Assets are read at runtime as path.join(__dirname, <basename>). tsdown bundles
# all of src/ into a single dist/index.js, so __dirname is dist/ — the assets
# have to sit directly beside the bundle rather than in dist/web and dist/cover
# mirroring the src/ tree.
mkdir -p dist

for file in "${browserFiles[@]}"
do
  node_modules/.bin/uglifyjs "$file" -o "dist/$(basename "$file")"
done

for file in "${nodeFiles[@]}"
do
  cp "$file" "dist/$(basename "$file")"
done

# A missing asset does not fail the build, it fails the consumer's build — so
# check here, where the person who broke it is watching.
for file in "${browserFiles[@]}" "${nodeFiles[@]}"
do
  out="dist/$(basename "$file")"
  if [[ ! -s "$out" ]]; then
    echo "copy.sh: build asset missing or empty: $out" >&2
    exit 1
  fi
done
