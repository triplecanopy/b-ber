#!/usr/bin/env bash

# keep in sync with scripts in package.json
declare -a files=(
    "src/web/search.js"
    "src/web/worker.js"
    "src/web/navigation.js"
    "src/web/event-handlers.js"
    "src/serve/server-web.js"
    "src/serve/server-reader.js"
)

for file in "${files[@]}"
do
    out="${file/src/dist}"
    cp $file $out
done
