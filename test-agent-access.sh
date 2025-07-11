#!/bin/bash

# Quick test script to verify Agent Engine access
# Tests the daisy-orchestrator agent (ID: 8470637580386304)

echo "🧪 Testing DaisyAI Orchestrator Access"
echo "======================================"
echo ""

# Agent details
PROJECT_ID="warner-music-staging"
LOCATION="us-central1"
AGENT_ID="8470637580386304"

# Get access token
echo "Getting access token..."
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ No access token available. Please run: gcloud auth login"
    exit 1
fi

echo "✅ Access token obtained"
echo ""

# Construct the endpoint
ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${AGENT_ID}:query"

echo "Testing endpoint: $ENDPOINT"
echo ""

# Make test request
echo "Sending test query..."
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "input": "How many entities are in the Neo4j knowledge graph?"
    }' 2>&1)

# Check if response contains error
if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Error response received:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo "✅ Success! Agent responded:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "Test complete!"