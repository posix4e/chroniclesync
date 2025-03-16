#!/bin/bash
set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Find all Swift files (excluding directories)
SWIFT_FILES=$(find "$SCRIPT_DIR" -type f -name "*.swift")

# Initialize counters
TOTAL_FILES=0
TOTAL_ISSUES=0

# Check for common issues
for file in $SWIFT_FILES; do
    # Skip if file doesn't exist or is a directory
    if [ ! -f "$file" ]; then
        continue
    fi
    
    TOTAL_FILES=$((TOTAL_FILES + 1))
    FILE_ISSUES=0
    FILENAME=$(basename "$file")
    
    echo -e "${YELLOW}Checking $FILENAME...${NC}"
    
    # Check for force unwrapping
    FORCE_UNWRAP_COUNT=$(grep -c "!" "$file" || true)
    if [ "$FORCE_UNWRAP_COUNT" -gt 0 ]; then
        echo -e "${RED}  - Found $FORCE_UNWRAP_COUNT force unwrapping (!) operations${NC}"
        FILE_ISSUES=$((FILE_ISSUES + FORCE_UNWRAP_COUNT))
    fi
    
    # Check for implicitly unwrapped optionals
    IMPLICIT_UNWRAP_COUNT=$(grep -c "!:" "$file" || true)
    if [ "$IMPLICIT_UNWRAP_COUNT" -gt 0 ]; then
        echo -e "${RED}  - Found $IMPLICIT_UNWRAP_COUNT implicitly unwrapped optionals (!:)${NC}"
        FILE_ISSUES=$((FILE_ISSUES + IMPLICIT_UNWRAP_COUNT))
    fi
    
    # Check for print statements
    PRINT_COUNT=$(grep -c "print(" "$file" || true)
    if [ "$PRINT_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}  - Found $PRINT_COUNT print statements (consider using Logger)${NC}"
        FILE_ISSUES=$((FILE_ISSUES + PRINT_COUNT))
    fi
    
    # Check for missing documentation
    FUNC_COUNT=$(grep -c "func " "$file" || true)
    DOC_COUNT=$(grep -c "///" "$file" || true)
    if [ "$FUNC_COUNT" -gt "$DOC_COUNT" ]; then
        MISSING_DOCS=$((FUNC_COUNT - DOC_COUNT))
        echo -e "${YELLOW}  - Missing documentation for approximately $MISSING_DOCS functions${NC}"
        FILE_ISSUES=$((FILE_ISSUES + MISSING_DOCS))
    fi
    
    # Check for long lines
    LONG_LINES=$(grep -n ".\{120,\}" "$file" | wc -l)
    if [ "$LONG_LINES" -gt 0 ]; then
        echo -e "${YELLOW}  - Found $LONG_LINES lines longer than 120 characters${NC}"
        FILE_ISSUES=$((FILE_ISSUES + LONG_LINES))
    fi
    
    # Check for trailing whitespace
    TRAILING_WHITESPACE=$(grep -n " $" "$file" | wc -l)
    if [ "$TRAILING_WHITESPACE" -gt 0 ]; then
        echo -e "${YELLOW}  - Found $TRAILING_WHITESPACE lines with trailing whitespace${NC}"
        FILE_ISSUES=$((FILE_ISSUES + TRAILING_WHITESPACE))
    fi
    
    # Check for TODO comments
    TODO_COUNT=$(grep -c "TODO" "$file" || true)
    if [ "$TODO_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}  - Found $TODO_COUNT TODO comments${NC}"
        FILE_ISSUES=$((FILE_ISSUES + TODO_COUNT))
    fi
    
    # Check for FIXME comments
    FIXME_COUNT=$(grep -c "FIXME" "$file" || true)
    if [ "$FIXME_COUNT" -gt 0 ]; then
        echo -e "${RED}  - Found $FIXME_COUNT FIXME comments${NC}"
        FILE_ISSUES=$((FILE_ISSUES + FIXME_COUNT))
    fi
    
    # Check for large functions (more than 50 lines)
    LARGE_FUNCTIONS=$(awk '/func / {start=NR} /^    }/ {if (NR-start > 50) print "  - Large function at line " start}' "$file" | wc -l)
    if [ "$LARGE_FUNCTIONS" -gt 0 ]; then
        echo -e "${YELLOW}  - Found $LARGE_FUNCTIONS functions longer than 50 lines${NC}"
        FILE_ISSUES=$((FILE_ISSUES + LARGE_FUNCTIONS))
    fi
    
    # Update total issues
    TOTAL_ISSUES=$((TOTAL_ISSUES + FILE_ISSUES))
    
    # Print summary for this file
    if [ "$FILE_ISSUES" -eq 0 ]; then
        echo -e "${GREEN}  No issues found in $FILENAME${NC}"
    else
        echo -e "${YELLOW}  Found $FILE_ISSUES issues in $FILENAME${NC}"
    fi
    
    echo ""
done

# Print overall summary
echo -e "${YELLOW}===== Swift Check Summary =====${NC}"
echo -e "Checked $TOTAL_FILES Swift files"
if [ "$TOTAL_ISSUES" -eq 0 ]; then
    echo -e "${GREEN}No issues found! Your code looks great!${NC}"
else
    echo -e "${YELLOW}Found $TOTAL_ISSUES total issues${NC}"
    echo -e "Run this script again after fixing the issues to verify your changes."
fi