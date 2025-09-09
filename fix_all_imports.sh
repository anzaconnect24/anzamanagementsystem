#!/bin/bash

# Script to fix all Next.js imports in the copied pages
cd "/Users/john/Documents/anza project/anzamanagementsystem"

echo "🔧 Fixing Next.js imports in all copied pages..."

# Fix all Next.js imports in one go
find src/pages -name "*.jsx" -exec sed -i '' \
  -e 's|from "next/link"|from "@/utils/link"|g' \
  -e 's|from "next/image"|from "@/utils/image"|g' \
  -e 's|from "next/navigation"|from "@/utils/navigation"|g' \
  -e 's|from "next/dynamic"|from "@/utils/dynamic"|g' \
  -e 's|from "next/router"|from "@/utils/navigation"|g' \
  -e 's|from "next/head"|from "@/utils/head"|g' \
  {} \;

echo "✅ Fixed Next.js imports"

# Fix controller imports
find src/pages -name "*.jsx" -exec sed -i '' \
  -e 's|from "@/app/controllers/|from "@/controllers/|g' \
  -e 's|from "../../app/controllers/|from "@/controllers/|g' \
  -e 's|from "../../../app/controllers/|from "@/controllers/|g' \
  -e 's|from "../../../../app/controllers/|from "@/controllers/|g' \
  {} \;

echo "✅ Fixed controller imports"

# Fix component imports  
find src/pages -name "*.jsx" -exec sed -i '' \
  -e 's|from "@/app/component/|from "@/component/|g' \
  -e 's|from "../../app/component/|from "@/component/|g' \
  -e 's|from "../../../app/component/|from "@/component/|g' \
  {} \;

echo "✅ Fixed component imports"

# Fix layout imports
find src/pages -name "*.jsx" -exec sed -i '' \
  -e 's|from "@/app/(dashboard)/layout"|from "@/layouts/DashboardLayout"|g' \
  -e 's|from "@/app/(auth)/layout"|from "@/layouts/AuthLayout"|g' \
  {} \;

echo "✅ Fixed layout imports"

# Fix locale imports
find src/pages -name "*.jsx" -exec sed -i '' \
  -e 's|from "@/app/locales"|from "@/locales"|g' \
  {} \;

echo "✅ Fixed locale imports"

# Fix utils imports
find src/pages -name "*.jsx" -exec sed -i '' \
  -e 's|from "@/app/utils/|from "@/utils/|g' \
  -e 's|from "../../app/utils/|from "@/utils/|g' \
  -e 's|from "../../../app/utils/|from "@/utils/|g' \
  {} \;

echo "✅ Fixed utils imports"

# Fix services imports
find src/pages -name "*.jsx" -exec sed -i '' \
  -e 's|from "@/app/services/|from "@/services/|g' \
  {} \;

echo "✅ Fixed services imports"

echo "🎉 All imports have been fixed!"

# Count files processed
total_files=$(find src/pages -name "*.jsx" | wc -l)
echo "📊 Processed $total_files files"
