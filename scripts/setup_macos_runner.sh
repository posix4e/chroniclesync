#!/bin/bash
# setup_macos_runner.sh - Prepares a macOS machine to be a GitHub runner for Safari extension testing
set -e

echo "Setting up macOS runner for Safari extension testing..."

# Check if running on macOS
if [[ $(uname) != "Darwin" ]]; then
    echo "Error: This script must be run on macOS"
    exit 1
fi

# Install Homebrew if not already installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "Homebrew already installed, updating..."
    brew update
fi

# Install Node.js and npm
echo "Installing Node.js and npm..."
brew install node

# Install Xcodegen
echo "Installing Xcodegen..."
brew install xcodegen

# Install other dependencies
echo "Installing other dependencies..."
brew install git

# Create a directory for the GitHub runner
echo "Creating directory for GitHub runner..."
mkdir -p ~/actions-runner

# Prompt for GitHub runner registration
echo ""
echo "==== GitHub Runner Setup ===="
echo "Please go to your GitHub repository:"
echo "  1. Navigate to Settings > Actions > Runners"
echo "  2. Click 'New self-hosted runner'"
echo "  3. Select 'macOS'"
echo "  4. Copy the token provided"
echo ""
read -p "Enter your GitHub repository (e.g., posix4e/chroniclesync): " REPO
read -p "Enter the runner token: " TOKEN
read -p "Enter labels for this runner (comma-separated, e.g., macos,safari): " LABELS

# Download and configure the runner
cd ~/actions-runner
curl -o actions-runner-osx-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-x64-2.311.0.tar.gz
tar xzf ./actions-runner-osx-x64-2.311.0.tar.gz

# Configure the runner
./config.sh --url "https://github.com/$REPO" --token "$TOKEN" --labels "$LABELS" --name "$(hostname)-safari-runner"

# Install and start the service
./svc.sh install
./svc.sh start

echo ""
echo "==== Setup Complete ===="
echo "The GitHub runner has been set up and started."
echo "You can check its status with: ~/actions-runner/svc.sh status"
echo ""
echo "Make sure Xcode is installed and configured:"
echo "  1. Open Xcode and accept the license agreement"
echo "  2. Install iOS simulators through Xcode's preferences"
echo ""
echo "To verify the setup, trigger a workflow in your GitHub repository."