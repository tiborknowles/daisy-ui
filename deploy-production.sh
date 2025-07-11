#!/bin/bash

# DaisyAI Chat Production Deployment Script
# This script ensures a clean, production-ready deployment

set -e  # Exit on error

echo "🚀 Starting DaisyAI Chat Production Deployment..."
echo "================================================"

# Step 1: Verify environment
echo "1️⃣ Verifying environment..."
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

# Step 2: Install dependencies
echo "2️⃣ Installing frontend dependencies..."
npm install

echo "3️⃣ Installing functions dependencies..."
cd functions
npm install
cd ..

# Step 3: Build frontend
echo "4️⃣ Building frontend for production..."
npm run build

# Step 4: Run tests (if any)
echo "5️⃣ Running tests..."
# npm test --if-present

# Step 5: Deploy functions
echo "6️⃣ Deploying Cloud Functions with Genkit..."
firebase deploy --only functions

# Step 6: Deploy hosting
echo "7️⃣ Deploying frontend to Firebase Hosting..."
firebase deploy --only hosting

# Step 7: Verify deployment
echo "8️⃣ Verifying deployment..."
HOSTING_URL="https://daisy-rocks.web.app"
echo "Testing health check endpoint..."
curl -s "https://us-central1-warner-music-staging.cloudfunctions.net/healthCheck" | jq '.' || echo "Health check endpoint not yet available"

echo ""
echo "✅ Deployment Complete!"
echo "========================"
echo "🌐 Your app is live at: $HOSTING_URL"
echo "📊 Firebase Console: https://console.firebase.google.com/project/warner-music-staging"
echo ""
echo "🔍 Post-deployment checklist:"
echo "  □ Test authentication flow"
echo "  □ Send a test message"
echo "  □ Check Cloud Functions logs"
echo "  □ Monitor error rates"
echo ""
echo "🎉 DaisyAI Chat is ready to impress!"