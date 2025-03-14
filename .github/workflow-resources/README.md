# GitHub Workflow Resources

This directory contains resources used by GitHub Actions workflows.

## Contents

- `xcode-schemes/`: Xcode scheme files used for testing Safari iOS extensions
  - `ChronicleSync_Tests.xcscheme`: Scheme for testing the main app
  - `ChronicleSync_Extension_Tests.xcscheme`: Scheme for testing the Safari extension

## Purpose

These files are stored separately from the workflow YAML files to:

1. Improve readability of workflow files
2. Avoid YAML syntax issues with large XML blocks
3. Make it easier to maintain and update these resources

## Usage

These files are referenced in the GitHub Actions workflows using paths like:

```yaml
cp $GITHUB_WORKSPACE/.github/workflow-resources/xcode-schemes/ChronicleSync_Tests.xcscheme \
   path/to/destination/
```