#!/usr/bin/env bash
set -euo pipefail

# Deploy the static site to AWS S3 + CloudFront.
# Usage: ./scripts/deploy-aws.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BUCKET_NAME="${BUCKET_NAME:-aknightmedia-319246817188}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-E3W0XDJBHPF24U}"
SITE_URL="${SITE_URL:-https://d1yx8foe0modq8.cloudfront.net}"

echo "Deploying AKnight Media to AWS..."
echo "Bucket: ${BUCKET_NAME}"
echo "Region: ${AWS_REGION}"

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "AWS credentials are not configured. Run: aws configure"
  exit 1
fi

if ! aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "Creating S3 bucket..."
  if [ "$AWS_REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET_NAME"
  else
    aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --create-bucket-configuration "LocationConstraint=${AWS_REGION}"
  fi
fi

echo "Uploading HTML pages..."
aws s3 sync . "s3://${BUCKET_NAME}" \
  --exclude "*" \
  --include "*.html" \
  --include "case-studies/*.html" \
  --include "robots.txt" \
  --include "sitemap.xml" \
  --exclude ".git/*" \
  --exclude ".cursor/*" \
  --exclude "scripts/*" \
  --exclude ".env" \
  --exclude ".DS_Store" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Uploading static assets..."
aws s3 sync . "s3://${BUCKET_NAME}" \
  --exclude ".git/*" \
  --exclude ".cursor/*" \
  --exclude "scripts/*" \
  --exclude "aws/*" \
  --exclude ".build/*" \
  --exclude ".env" \
  --exclude ".DS_Store" \
  --exclude "*.html" \
  --delete \
  --cache-control "public, max-age=300"

if [ -f "config/contact-form.json" ]; then
  echo "Uploading contact form config..."
  aws s3 cp "config/contact-form.json" "s3://${BUCKET_NAME}/config/contact-form.json" \
    --cache-control "no-cache, no-store, must-revalidate"
fi

if [ -n "$DISTRIBUTION_ID" ]; then
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" >/dev/null
  echo "CloudFront invalidation started."
fi

echo "Deployment complete."
echo "Site URL: ${SITE_URL}"
