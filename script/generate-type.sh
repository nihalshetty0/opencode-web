#!/bin/bash

# Navigate to the @src/types directory
cd "$(dirname "$0")/../src/types" || exit 1

# Run opencode generate to output to gen/openapi.json
opencode generate

# Run typescript-openapi using npx on the generated openapi.json
npx openapi-typescript gen/openapi.json --output openapi-types.ts

echo "Types generated successfully"