# CI/CD Workflow Documentation

This document provides detailed information about the CI/CD workflow for the ChronicleSync project.

## Overview

The CI/CD workflow is designed to optimize the build, test, and deployment process by only running jobs for components that have changed. This reduces build times and resource usage, especially for large projects with multiple components.

## Workflow Structure

The workflow consists of the following jobs:

1. **changes**: Determines which components have changed
2. **build-and-test-pages**: Builds and tests the pages component
3. **build-and-test-extension**: Builds and tests the extension component
4. **playwright-extension-tests**: Runs Playwright tests for the extension
5. **build-and-test-worker**: Builds and tests the worker component

## Path-Based Triggers

The workflow is triggered when files in specific directories are changed:

- **pages/**: Changes to the React web application
- **extension/**: Changes to the browser extension
- **worker/**: Changes to the Cloudflare Worker
- **.github/workflows/**: Changes to the workflow files
- **scripts/**: Changes to shared scripts

## Component Detection

The workflow uses the [dorny/paths-filter](https://github.com/dorny/paths-filter) action to detect which components have changed. This action creates outputs that are used to conditionally run jobs.

```yaml
- name: Check for file changes
  uses: dorny/paths-filter@v2
  id: filter
  with:
    filters: |
      pages:
        - 'pages/**'
        - '.github/workflows/ci-cd-combined.yml'
      extension:
        - 'extension/**'
        - '.github/workflows/ci-cd-combined.yml'
      worker:
        - 'worker/**'
        - '.github/workflows/ci-cd-combined.yml'
```

## Manual Workflow Trigger

You can manually trigger the workflow using the GitHub Actions UI. The following inputs are available:

- **browser**: Select a specific browser for testing (chromium, firefox, or leave empty for all browsers)
- **api_endpoint**: Specify a custom API endpoint for testing
- **debug**: Enable debug mode for more verbose output
- **components**: Comma-separated list of components to build/test/deploy (pages,extension,worker)

### Example Manual Trigger Commands

#### Using GitHub CLI Directly

To trigger the workflow for specific components using the GitHub CLI:

```bash
# Only build and test the pages component
gh workflow run ci-cd-combined.yml -f components=pages

# Only build and test the extension component with Chrome
gh workflow run ci-cd-combined.yml -f components=extension -f browser=chromium

# Build and test multiple components
gh workflow run ci-cd-combined.yml -f components=pages,worker

# Build and test all components with debug mode
gh workflow run ci-cd-combined.yml -f components=pages,extension,worker -f debug=true
```

#### Using the Helper Script

A helper script is provided to simplify triggering the workflow:

```bash
# Only build and test the pages component
./scripts/trigger-workflow.sh pages

# Only build and test the extension component with Chrome
./scripts/trigger-workflow.sh extension chromium

# Build and test multiple components with debug mode
./scripts/trigger-workflow.sh pages,worker "" true

# Build and test all components with a custom API endpoint
./scripts/trigger-workflow.sh pages,extension,worker "" false https://custom-api.example.com
```

The script takes the following parameters:
1. Components (comma-separated list)
2. Browser (optional)
3. Debug mode (true/false, optional)
4. API endpoint (optional)

## Conditional Job Execution

Each job uses conditional execution based on the outputs from the `changes` job:

```yaml
build-and-test-pages:
  needs: changes
  if: needs.changes.outputs.pages == 'true' || github.event_name == 'workflow_dispatch' && contains(github.event.inputs.components, 'pages')
  # ...
```

This ensures that jobs only run when:
1. The relevant files have changed, OR
2. The workflow was manually triggered with the component specified

## Artifact Sharing

The workflow uses artifacts to share build outputs between jobs. For example, the extension artifacts are built in the `build-and-test-extension` job and then used in the `playwright-extension-tests` job.

## Environment Variables

The workflow uses environment variables to configure the build and test process:

- **NODE_VERSION**: The version of Node.js to use
- **API_URL**: The API endpoint to use for testing
- **DEBUG**: Enable debug mode for Playwright
- **PWDEBUG**: Enable Playwright debug mode
- **PORT**: The port to use for the development server
- **BROWSER**: The browser to use for Playwright tests

## Deployment

The workflow deploys components to Cloudflare when running on the main branch or in a pull request targeting the main branch:

- **Pages**: Deployed using Wrangler to Cloudflare Pages
- **Worker**: Deployed using Wrangler to Cloudflare Workers

## Best Practices

1. **Keep Components Separate**: Maintain clear separation between components to minimize unnecessary builds
2. **Minimize Shared Dependencies**: Reduce dependencies between components to avoid cascading builds
3. **Use Manual Triggers Wisely**: Use manual triggers for testing specific components during development
4. **Monitor Build Times**: Regularly check build times to identify optimization opportunities