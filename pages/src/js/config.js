const configs = {
  production: {
    API_URL: 'https://api.chroniclesync.xyz'
  },
  staging: {
    API_URL: 'https://api-staging.chroniclesync.xyz'
  }
};

// Determine environment based on hostname
function getEnvironment() {
  const hostname = window.location.hostname;
  if (hostname.includes('staging')) {
    return 'staging';
  }
  return 'production';
}

export const config = configs[getEnvironment()];