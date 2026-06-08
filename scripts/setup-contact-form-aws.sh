#!/usr/bin/env bash
set -euo pipefail

# Provision API Gateway + Lambda + SES contact form delivery.
# Usage: ./scripts/setup-contact-form-aws.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${STACK_NAME:-aknightmedia-contact-form}"
TO_EMAIL="${TO_EMAIL:-aknightmedia@gmail.com}"
FROM_EMAIL="${FROM_EMAIL:-aknightmedia@gmail.com}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://d1yx8foe0modq8.cloudfront.net,https://aknightmedia.com,https://www.aknightmedia.com,http://localhost:8080}"

echo "Setting up AKnight Media contact form on AWS..."
echo "Region: ${AWS_REGION}"
echo "Stack: ${STACK_NAME}"
echo "To: ${TO_EMAIL}"
echo "From: ${FROM_EMAIL}"

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "AWS credentials are not configured. Run: aws configure"
  exit 1
fi

BUILD_DIR="${ROOT_DIR}/.build/contact-form"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cp aws/contact-form/handler.mjs "${BUILD_DIR}/handler.mjs"
(
  cd "$BUILD_DIR"
  zip -q function.zip handler.mjs
)

echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --template-file aws/contact-form/template.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ToEmail="$TO_EMAIL" \
    FromEmail="$FROM_EMAIL" \
    AllowedOrigins="$ALLOWED_ORIGINS" \
  --no-fail-on-empty-changeset

FUNCTION_NAME="$(aws cloudformation describe-stacks \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ContactFormFunctionName'].OutputValue" \
  --output text)"

echo "Updating Lambda code..."
aws lambda update-function-code \
  --region "$AWS_REGION" \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://${BUILD_DIR}/function.zip" >/dev/null

aws lambda wait function-updated \
  --region "$AWS_REGION" \
  --function-name "$FUNCTION_NAME"

API_URL="$(aws cloudformation describe-stacks \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ContactFormApiUrl'].OutputValue" \
  --output text)"

mkdir -p "${ROOT_DIR}/config"
cat > "${ROOT_DIR}/config/contact-form.json" <<EOF
{
  "apiUrl": "${API_URL}"
}
EOF

echo ""
echo "Contact form API ready."
echo "API URL: ${API_URL}"
echo "Wrote config/contact-form.json"
echo ""
echo "Important: verify these email addresses in Amazon SES before testing:"
echo "  From: ${FROM_EMAIL}"
echo "  To:   ${TO_EMAIL}"
echo ""
echo "If SES is still in sandbox mode, both addresses must be verified."
echo "Request production access in SES to send to any recipient."
echo ""
echo "Next steps:"
echo "  1. Deploy the site: ./scripts/deploy-aws.sh"
echo "  2. Submit the contact form on the live site"
