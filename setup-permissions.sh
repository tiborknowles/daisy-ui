#!/bin/bash

# Setup script for DaisyAI Chat UI permissions
# This script helps configure the necessary permissions for Firebase and Agent Engine

echo "🔐 DaisyAI Chat UI - Permissions Setup"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current user email
USER_EMAIL=$(gcloud config get-value account 2>/dev/null)
echo "Current user: ${USER_EMAIL}"
echo ""

# Function to check if user has a role
check_role() {
    local project=$1
    local role=$2
    
    if gcloud projects get-iam-policy $project --flatten="bindings[].members" --filter="bindings.role:$role AND bindings.members:user:$USER_EMAIL" --format="value(bindings.role)" 2>/dev/null | grep -q "$role"; then
        echo -e "${GREEN}✓${NC} You have $role on $project"
        return 0
    else
        echo -e "${RED}✗${NC} You DON'T have $role on $project"
        return 1
    fi
}

echo "1. Checking Agent Engine Permissions"
echo "------------------------------------"
PROJECT_ID="warner-music-staging"

# Check required roles
echo "Checking roles on $PROJECT_ID:"
check_role $PROJECT_ID "roles/aiplatform.user"
AI_PLATFORM_USER=$?

check_role $PROJECT_ID "roles/serviceusage.serviceUsageConsumer"
SERVICE_USAGE=$?

if [ $AI_PLATFORM_USER -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}To grant aiplatform.user role, run:${NC}"
    echo "gcloud projects add-iam-policy-binding $PROJECT_ID \\"
    echo "  --member=\"user:$USER_EMAIL\" \\"
    echo "  --role=\"roles/aiplatform.user\""
fi

echo ""
echo "2. Testing Agent Engine Access"
echo "------------------------------"
echo "Testing connection to Agent Engine ID: 8470637580386304"

# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ]; then
    # Test the agent endpoint
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "https://us-central1-aiplatform.googleapis.com/v1beta1/projects/warner-music-staging/locations/us-central1/reasoningEngines/8470637580386304:query" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"input": "test"}' 2>/dev/null)
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓${NC} Agent Engine is accessible!"
    elif [ "$RESPONSE" = "403" ]; then
        echo -e "${RED}✗${NC} Access forbidden - you need permissions"
    elif [ "$RESPONSE" = "404" ]; then
        echo -e "${RED}✗${NC} Agent not found - check the ID"
    else
        echo -e "${YELLOW}?${NC} Unexpected response: HTTP $RESPONSE"
    fi
else
    echo -e "${RED}✗${NC} No access token - run: gcloud auth login"
fi

echo ""
echo "3. Firebase Project Setup"
echo "-------------------------"
echo "To set up Firebase for this project:"
echo ""
echo "1. Create a new Firebase project:"
echo "   ${YELLOW}firebase projects:create daisy-ai-chat --display-name \"DaisyAI Chat UI\"${NC}"
echo ""
echo "2. Or use an existing project:"
echo "   ${YELLOW}firebase use --add${NC}"
echo ""
echo "3. Initialize Firebase in this directory:"
echo "   ${YELLOW}firebase init${NC}"
echo "   - Select: Hosting, Authentication, Firestore (optional)"
echo "   - Use existing files when prompted"
echo ""

echo "4. Environment Variables"
echo "-----------------------"
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠${NC}  No .env.local file found"
    echo "   Copy .env.example to .env.local and fill in Firebase config:"
    echo "   ${YELLOW}cp .env.example .env.local${NC}"
else
    echo -e "${GREEN}✓${NC} .env.local exists"
fi

echo ""
echo "5. CORS Configuration"
echo "--------------------"
echo "For production, you'll need to configure CORS on the Agent Engine."
echo "This typically requires:"
echo "- Adding your Firebase Hosting domains to the allowed origins"
echo "- Contact the Agent Engine administrator if you can't modify CORS"

echo ""
echo "6. Next Steps"
echo "-------------"
echo "1. Ensure you have the required permissions (see above)"
echo "2. Set up Firebase project and get configuration"
echo "3. Copy .env.example to .env.local and fill in values"
echo "4. Run: npm install"
echo "5. Run: npm run dev"
echo "6. Deploy: firebase deploy"

echo ""
echo "For detailed instructions, see PERMISSIONS_SETUP.md"