# Test Runner Scripts

## run_tests.py

A Python script to run Playwright tests via GitHub Actions and monitor their progress.

### Prerequisites

- Python 3.6+
- `GITHUB_TOKEN` environment variable set with appropriate permissions

### Usage

```bash
# Run tests on current branch with defaults
./run_tests.py

# Run tests with specific browser and wait for results
./run_tests.py --browser firefox --wait

# Run tests against custom API endpoint with debug mode
./run_tests.py --api-endpoint https://api-staging.example.com --debug

# Run tests and download artifacts
./run_tests.py --wait --download-artifacts
```

### Options

- `--browser`: Browser to run tests in (chromium/firefox/webkit)
- `--api-endpoint`: API endpoint to test against
- `--debug`: Enable debug mode
- `--wait`: Wait for test completion and show results
- `--download-artifacts`: Download test artifacts after completion

### Examples

1. Run tests on current branch and wait for results:
```bash
./run_tests.py --wait
```

2. Run tests in Firefox with debug mode:
```bash
./run_tests.py --browser firefox --debug --wait
```

3. Run tests against staging API:
```bash
./run_tests.py --api-endpoint https://api-staging.chroniclesync.xyz --wait
```

4. Run tests and download artifacts:
```bash
./run_tests.py --wait --download-artifacts
```

### Output

The script provides:
- Real-time test execution status
- Job results and durations
- Links to detailed logs
- Downloaded artifacts (if requested)

### Exit Codes

- 0: Tests completed successfully
- 1: Tests failed or error occurred