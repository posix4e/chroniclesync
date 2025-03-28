# Migration Guide

This document outlines the steps to migrate from the old structure to the new modular structure.

## Directory Structure Changes

1. Configuration files have been moved to `.config/`
2. Background script has been split into modules in `src/background/`
3. Database operations have been split into repositories in `src/db/`
4. API communication has been centralized in `src/api/`
5. CSS has been consolidated in `src/styles/`
6. Tests have been moved to `tests/`

## File Replacements

| Old File | New File |
|----------|----------|
| `src/background.ts` | `src/background-new.ts` |
| `src/db/HistoryStore.ts` | `src/db/HistoryStore-new.ts` |
| `package.json` | `package-new.json` |
| `.eslintrc.json` | `.config/.eslintrc.json` |
| `tsconfig.json` | `.config/tsconfig.json` |
| `vite.config.ts` | `.config/vite.config.ts` |
| `jest.config.js` | `.config/jest.config.js` |
| `README.md` | `README-new.md` |

## Migration Steps

1. **Backup your current code**:
   ```bash
   git checkout -b refactor-backup
   git add .
   git commit -m "Backup before refactoring"
   git checkout -b refactor-implementation
   ```

2. **Create the new directory structure**:
   ```bash
   mkdir -p .config src/api src/background src/content src/styles tests/mocks
   ```

3. **Move configuration files**:
   ```bash
   mv .eslintrc.json .config/
   mv tsconfig.json .config/
   mv vite.config.ts .config/
   mv jest.config.js .config/
   ```

4. **Replace the files**:
   ```bash
   mv src/background-new.ts src/background.ts
   mv src/db/HistoryStore-new.ts src/db/HistoryStore.ts
   mv package-new.json package.json
   mv README-new.md README.md
   ```

5. **Update imports**:
   You'll need to update imports in any files that reference the moved modules.

6. **Test the changes**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

## Breaking Changes

1. **Configuration Paths**: All configuration files are now in `.config/` directory
2. **Import Paths**: Imports need to be updated to reflect the new structure
3. **Database Access**: Direct access to IndexedDB is now through repositories

## Benefits of the New Structure

1. **Modularity**: Each module has a single responsibility
2. **Testability**: Smaller modules are easier to test
3. **Maintainability**: Code is more organized and easier to understand
4. **Scalability**: New features can be added without modifying existing code
5. **Performance**: Smaller modules can be loaded on demand