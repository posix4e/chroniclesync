#!/bin/bash

# Default values
API_URL="https://api.chroniclesync.xyz"
CURRENT_PASSWORD="francesisthebest"

# Print usage instructions
usage() {
    echo "Usage: $0 [-c current_password] [-u api_url] new_password"
    echo
    echo "Options:"
    echo "  -c current_password  Current admin password (default: francesisthebest)"
    echo "  -u api_url          API URL (default: https://api.chroniclesync.xyz)"
    echo "  -h                  Show this help message"
    echo
    echo "Example:"
    echo "  $0 -c oldpass123 -u http://localhost:8787 newpass123"
    echo "  $0 newpass123  # Using default password and URL"
}

# Parse command line options
while getopts "c:u:h" opt; do
    case $opt in
        c)
            CURRENT_PASSWORD="$OPTARG"
            ;;
        u)
            API_URL="$OPTARG"
            ;;
        h)
            usage
            exit 0
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            usage
            exit 1
            ;;
    esac
done

# Remove the options from the positional parameters
shift $((OPTIND-1))

# Check if new password is provided
if [ $# -ne 1 ]; then
    echo "Error: New password must be provided" >&2
    usage
    exit 1
fi

NEW_PASSWORD="$1"

# Validate new password length
if [ ${#NEW_PASSWORD} -lt 8 ]; then
    echo "Error: New password must be at least 8 characters long" >&2
    exit 1
fi

# Make the API request
response=$(curl -s -w "\n%{http_code}" "$API_URL/admin/password" \
    -H "Authorization: Bearer $CURRENT_PASSWORD" \
    -H "Content-Type: application/json" \
    -d "{\"newPassword\": \"$NEW_PASSWORD\"}")

# Split response into body and status code
body=$(echo "$response" | head -n 1)
status_code=$(echo "$response" | tail -n 1)

# Check response
case $status_code in
    200)
        echo "Password changed successfully!"
        ;;
    401)
        echo "Error: Current password is incorrect" >&2
        exit 1
        ;;
    400)
        echo "Error: $body" >&2
        exit 1
        ;;
    *)
        echo "Error: Unexpected response (HTTP $status_code)" >&2
        echo "Response: $body" >&2
        exit 1
        ;;
esac