# History sync extension

## Prepare testing 
npm install
npx playwright install --with-deps chromium

## Basic testing
```
npm run lint
npm run test
npm install
npx playwright install --with-deps chromium
```

## Extended testing
```
export API_URL="https://api-staging.chroniclesync.xyz"
export DEBUG="pw:api"
export PWDEBUG="1"
npx playwright test
```
