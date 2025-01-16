# Contributing to ChronicleSync

We love your input! We want to make contributing to ChronicleSync as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Testing Requirements

We follow the testing methodology from "Growing Object-Oriented Software Guided by Tests" (GOOS). Please refer to our [Testing Guide](TESTING.md) for detailed information about:

- E2E (Acceptance) Tests
- Integration Tests
- Unit Tests

### Running Tests

```bash
# Full test suite
npm run test

# E2E tests only
npm run test:e2e

# Unit and integration tests with watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Development Environment

1. Prerequisites:
   ```bash
   node -v  # Should be >= 16
   npm -v   # Should be >= 7
   ```

2. Setup:
   ```bash
   git clone https://github.com/YOUR_USERNAME/chroniclesync.git
   cd chroniclesync
   npm install
   ```

3. Development:
   ```bash
   npm run dev  # Start development server
   ```

## Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the TESTING.md if you've modified test patterns or added new test cases
3. The PR may be merged once you have the sign-off of two other developers

## Any Contributions You Make Will Be Under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report Bugs Using GitHub's [Issue Tracker](https://github.com/posix4e/chroniclesync/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/posix4e/chroniclesync/issues/new).

### Write Bug Reports with Detail, Background, and Sample Code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Use a Consistent Coding Style

* Use TypeScript for frontend code
* 2 spaces for indentation
* Run `npm run lint` to check your code style
* Run `npm run lint:fix` to automatically fix style issues

## License

By contributing, you agree that your contributions will be licensed under its MIT License.