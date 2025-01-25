#!/usr/bin/env python3
"""
Get GitHub Actions URL for current branch
"""
import subprocess
from urllib.parse import quote

# Get current branch
branch = subprocess.run(['git', 'branch', '--show-current'], 
                       capture_output=True, text=True, check=True).stdout.strip()

# Get repo info from remote URL
remote = subprocess.run(['git', 'remote', 'get-url', 'origin'], 
                       capture_output=True, text=True, check=True).stdout.strip()

# Parse owner/repo from remote URL
if remote.startswith('https://'):
    path = remote.split('github.com/')[1]
else:
    path = remote.split('git@github.com:')[1]
owner, repo = path.replace('.git', '').split('/')

# Print the GitHub Actions URL for this branch
print(f"https://github.com/{owner}/{repo}/actions?query=branch%3A{quote(branch, safe='')}")