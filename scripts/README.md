# Test Runner Scripts

## run_tests.py

A Python script to run Playwright tests via GitHub Actions and monitor their progress.

### Features

- Run tests on any branch
- Support multiple browsers (chromium/firefox/webkit)
- Configure API endpoints for testing
- Monitor test execution in real-time
- Download test artifacts
- Exit codes for CI integration

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

### Exit Codes

- 0: Tests completed successfully
- 1: Tests failed or error occurred

### Examples

1. Basic test run:
```bash
export GITHUB_TOKEN=your_token_here
./run_tests.py --wait
```

2. Test with Firefox in debug mode:
```bash
./run_tests.py --browser firefox --debug --wait
```

3. Test against staging API:
```bash
./run_tests.py --api-endpoint https://api-staging.chroniclesync.xyz --wait
```

4. Full test run with artifacts:
```bash
./run_tests.py --browser chromium --debug --wait --download-artifacts
```

### Output

The script provides:
- Real-time test execution status
- Job results and durations
- Links to detailed logs
- Downloaded artifacts (if requested)

### Notes

- The script uses GitHub's API to trigger and monitor tests
- Test artifacts are downloaded to `test-results` directory
- Debug mode enables Playwright's debug logging
- The script respects GitHub API rate limits