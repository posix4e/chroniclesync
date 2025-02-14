#!/bin/bash

# Script to clean up test clients from staging bucket
# Usage: ./cleanup_staging.sh [days_old]

set -e

# Default to cleaning up test clients older than 1 day if not specified
DAYS_OLD=${1:-1}

# AWS CLI command to list and delete test clients from staging bucket
echo "Listing test clients older than ${DAYS_OLD} days in staging bucket..."

# List objects with the test-client prefix and created before specified days
aws s3api list-objects-v2 \
    --bucket "${STAGING_BUCKET}" \
    --prefix "test-client-" \
    --query "Contents[?to_string(LastModified) < '`date -d "-${DAYS_OLD} days" --iso-8601=seconds`'].Key" \
    --output text | \
while read -r key; do
    if [ ! -z "$key" ]; then
        echo "Deleting: $key"
        aws s3 rm "s3://${STAGING_BUCKET}/${key}"
    fi
done

echo "Cleanup complete!"