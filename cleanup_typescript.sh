#!/bin/bash

# Script to remove TypeScript syntax from all copied pages
cd "/Users/john/Documents/anza project/anzamanagementsystem"

echo "🔧 Removing TypeScript syntax from all copied pages..."

# Remove TypeScript type annotations
find src/pages -name "*.jsx" -exec sed -i '' \
  -e 's/: [A-Za-z0-9_|<>[\],{} ]*//g' \
  -e 's/{ target }: MouseEvent/{ target }/g' \
  -e 's/{ keyCode }: KeyboardEvent/{ keyCode }/g' \
  -e 's/interface [A-Za-z0-9_]* {[^}]*}//g' \
  -e 's/type [A-Za-z0-9_]* = [^;]*;//g' \
  {} \;

echo "✅ Removed TypeScript syntax"

# Fix any remaining "use client" issues
find src/pages -name "*.jsx" -exec sed -i '' \
  -e 's/"use client"import/"use client";\nimport/g' \
  -e 's/"use client";import/"use client";\nimport/g' \
  {} \;

echo "✅ Fixed 'use client' statements"

echo "🎉 TypeScript cleanup complete!"
