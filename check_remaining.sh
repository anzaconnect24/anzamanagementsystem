#!/bin/bash

# Script to copy final batch of Next.js pages 
cd "/Users/john/Documents/anza project/anzamanagementsystem"

# Function to copy a file and rename it
copy_page() {
    local src="$1"
    local dest="$2"
    local name="$3"
    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "✅ Copied: $name"
    else
        echo "❌ Not found: $src"
    fi
}

echo "Copying final batch of pages..."

# Let's first see what user pages actually exist
find app/ -path "*users*" -name "page.js" | head -20

# Let's see what mentor pages exist
find app/ -path "*mentor*" -name "page.js" | head -20

# Let's see what investment-opportunities pages exist  
find app/ -path "*investment*" -name "page.js" | head -20

# Let's see what other pages exist
find app/ -path "*investor*" -name "page.js" | head -10

echo "Checking actual files..."
