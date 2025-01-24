#!/usr/bin/env python3
"""
GitHub Actions Playwright Test Runner

This script triggers and monitors Playwright tests via GitHub Actions, providing:
- Test execution on any branch
- Support for multiple browsers and API endpoints
- Real-time status monitoring
- Test artifact downloads
"""

import os
import sys
import time
import json
import argparse
import subprocess
from typing import Optional, Dict, Any, List

class GitHubTestRunner:
    """Manages Playwright test execution via GitHub Actions."""
    
    def __init__(self, token: str, repo: str):
        """Initialize with GitHub token and repository."""
        self.token = token
        self.repo = repo
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github.v3+json'
        }

    def get_current_branch(self) -> str:
        """Get the name of the current Git branch."""
        result = subprocess.run(['git', 'branch', '--show-current'], 
                              capture_output=True, text=True, check=True)
        return result.stdout.strip()

    def trigger_tests(self, branch: str, browser: str = 'chromium', 
                     api_endpoint: Optional[str] = None, debug: bool = False) -> str:
        """
        Trigger Playwright tests via GitHub Actions.
        
        Args:
            branch: Git branch to test
            browser: Browser to use (chromium/firefox/webkit)
            api_endpoint: Optional API endpoint to test against
            debug: Enable debug mode
            
        Returns:
            Workflow run ID
        """
        url = f'https://api.github.com/repos/{self.repo}/actions/workflows/playwright-tests.yml/dispatches'
        
        inputs = {
            'browser': browser,
            'debug': str(debug).lower()
        }
        if api_endpoint:
            inputs['api_endpoint'] = api_endpoint

        data = {
            'ref': branch,
            'inputs': inputs
        }

        curl_cmd = [
            'curl', '-X', 'POST', url,
            '-H', f'Authorization: Bearer {self.token}',
            '-H', 'Accept: application/vnd.github.v3+json',
            '-d', json.dumps(data)
        ]
        
        subprocess.run(curl_cmd, check=True)
        return self._get_latest_run_id(branch)

    def _get_latest_run_id(self, branch: str) -> str:
        """Get the ID of the latest workflow run for the branch."""
        time.sleep(2)  # Wait for workflow to be created
        url = f'https://api.github.com/repos/{self.repo}/actions/runs'
        
        curl_cmd = [
            'curl', '-s', url,
            '-H', f'Authorization: Bearer {self.token}',
            '-H', 'Accept: application/vnd.github.v3+json'
        ]
        
        result = subprocess.run(curl_cmd, capture_output=True, text=True, check=True)
        runs = json.loads(result.stdout)
        
        for run in runs['workflow_runs']:
            if run['head_branch'] == branch and 'playwright' in run['name'].lower():
                return str(run['id'])
        
        raise Exception(f'No Playwright workflow run found for branch {branch}')

    def get_run_status(self, run_id: str) -> Dict[str, Any]:
        """Get the status of a workflow run."""
        url = f'https://api.github.com/repos/{self.repo}/actions/runs/{run_id}'
        
        curl_cmd = [
            'curl', '-s', url,
            '-H', f'Authorization: Bearer {self.token}',
            '-H', 'Accept: application/vnd.github.v3+json'
        ]
        
        result = subprocess.run(curl_cmd, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)

    def get_run_logs(self, run_id: str) -> List[Dict[str, Any]]:
        """Get logs from all jobs in a workflow run."""
        url = f'https://api.github.com/repos/{self.repo}/actions/runs/{run_id}/jobs'
        
        curl_cmd = [
            'curl', '-s', url,
            '-H', f'Authorization: Bearer {self.token}',
            '-H', 'Accept: application/vnd.github.v3+json'
        ]
        
        result = subprocess.run(curl_cmd, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)['jobs']

    def download_artifacts(self, run_id: str, output_dir: str = 'test-results'):
        """Download artifacts from a workflow run."""
        url = f'https://api.github.com/repos/{self.repo}/actions/runs/{run_id}/artifacts'
        
        curl_cmd = [
            'curl', '-s', url,
            '-H', f'Authorization: Bearer {self.token}',
            '-H', 'Accept: application/vnd.github.v3+json'
        ]
        
        result = subprocess.run(curl_cmd, capture_output=True, text=True, check=True)
        artifacts = json.loads(result.stdout)

        os.makedirs(output_dir, exist_ok=True)

        for artifact in artifacts['artifacts']:
            download_url = artifact['archive_download_url']
            artifact_name = artifact['name']
            output_file = os.path.join(output_dir, f'{artifact_name}.zip')

            curl_cmd = [
                'curl', '-L', '-o', output_file,
                download_url,
                '-H', f'Authorization: Bearer {self.token}'
            ]
            
            subprocess.run(curl_cmd, check=True)
            print(f'Downloaded {artifact_name} to {output_file}')

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description='Run Playwright tests via GitHub Actions',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run tests on current branch and wait for results
  %(prog)s --wait

  # Run tests in Firefox with debug mode
  %(prog)s --browser firefox --debug --wait

  # Run tests against staging API
  %(prog)s --api-endpoint https://api-staging.chroniclesync.xyz --wait

  # Run tests and download artifacts
  %(prog)s --wait --download-artifacts
        """
    )
    parser.add_argument('--browser', default='chromium', 
                       choices=['chromium', 'firefox', 'webkit'],
                       help='Browser to run tests in')
    parser.add_argument('--api-endpoint', 
                       help='API endpoint to test against')
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug mode')
    parser.add_argument('--wait', action='store_true',
                       help='Wait for test completion and show results')
    parser.add_argument('--download-artifacts', action='store_true',
                       help='Download test artifacts after completion')
    args = parser.parse_args()

    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print('Error: GITHUB_TOKEN environment variable not set')
        sys.exit(1)

    runner = GitHubTestRunner(token, 'posix4e/chroniclesync')
    branch = runner.get_current_branch()
    print(f'Running tests on branch: {branch}')

    try:
        run_id = runner.trigger_tests(
            branch=branch,
            browser=args.browser,
            api_endpoint=args.api_endpoint,
            debug=args.debug
        )
        print(f'Tests triggered. Run ID: {run_id}')
        print(f'View run at: https://github.com/posix4e/chroniclesync/actions/runs/{run_id}')

        if args.wait:
            print('Waiting for tests to complete...')
            while True:
                status = runner.get_run_status(run_id)
                if status['status'] == 'completed':
                    conclusion = status['conclusion']
                    print(f'\nTests completed with status: {conclusion}')
                    
                    print('\nJob Results:')
                    jobs = runner.get_run_logs(run_id)
                    for job in jobs:
                        print(f"\n{job['name']}: {job['conclusion']}")
                        print(f"Duration: {job['started_at']} - {job['completed_at']}")
                        print(f"Logs: {job['html_url']}")
                    
                    if args.download_artifacts:
                        print('\nDownloading artifacts...')
                        runner.download_artifacts(run_id)
                    
                    sys.exit(0 if conclusion == 'success' else 1)
                
                print('.', end='', flush=True)
                time.sleep(10)
        
    except Exception as e:
        print(f'Error: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()