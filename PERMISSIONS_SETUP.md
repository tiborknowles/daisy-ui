# DaisyAI Chat UI - Permissions Setup Guide

This guide covers all permissions needed for the DaisyAI Chat UI to work with Firebase Studio and Google Cloud Agent Engine.

## 1. GitHub Repository Permissions

### For Firebase Studio Access
- **Repository Visibility**: Public (already set ✅)
- **GitHub App Permissions**: When importing to Firebase Studio, you'll need to:
  1. Authorize Firebase Studio GitHub App
  2. Grant read access to your repository
  3. Allow webhook creation for auto-deploy

## 2. Firebase Project Permissions

### Create Firebase Project
```bash
# If you haven't created a Firebase project yet
firebase projects:create daisy-ai-chat --display-name "DaisyAI Chat UI"

# Or use existing project
firebase use --add
```

### Required Firebase Services
Enable these in Firebase Console (https://console.firebase.google.com):
- **Authentication**: For user sign-in
- **Hosting**: For web deployment
- **Firestore**: For chat history (optional)

### Firebase IAM Roles
Your user account needs:
- `roles/firebase.admin` - Firebase Admin
- `roles/firebasehosting.admin` - For deployment

## 3. Google Cloud Permissions for Agent Engine

### Current Agent Engine Details
- **Project**: `warner-music-staging`
- **Agent ID**: `8470637580386304`
- **Location**: `us-central1`

### Required GCP Permissions

#### For Development (Your User Account)
```bash
# Check current permissions
gcloud projects get-iam-policy warner-music-staging \
  --filter="bindings.members:user:YOUR_EMAIL"

# Required roles:
# - roles/aiplatform.user (to call Agent Engine)
# - roles/serviceusage.serviceUsageConsumer
```

#### For Production (Service Account)
The deployed app will need a service account with these permissions:

```bash
# 1. Create service account for the UI
gcloud iam service-accounts create daisy-ui-sa \
  --display-name="DaisyAI UI Service Account" \
  --project=warner-music-staging

# 2. Grant necessary permissions
gcloud projects add-iam-policy-binding warner-music-staging \
  --member="serviceAccount:daisy-ui-sa@warner-music-staging.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# 3. Allow Firebase Hosting to use this service account
gcloud iam service-accounts add-iam-policy-binding \
  daisy-ui-sa@warner-music-staging.iam.gserviceaccount.com \
  --member="serviceAccount:firebase-adminsdk-xxxxx@YOUR_FIREBASE_PROJECT.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

## 4. CORS Configuration for Agent Engine

Since the UI will call Agent Engine from the browser, you need to configure CORS:

```bash
# Create cors.json
cat > cors.json << 'EOF'
{
  "origin": ["https://YOUR-PROJECT.web.app", "https://YOUR-PROJECT.firebaseapp.com", "http://localhost:3000"],
  "method": ["GET", "POST"],
  "responseHeader": ["Content-Type", "Authorization"],
  "maxAgeSeconds": 3600
}
EOF

# Apply CORS policy (if using Cloud Storage)
gsutil cors set cors.json gs://YOUR_BUCKET
```

## 5. Firebase Hosting Configuration

Update `firebase.json` to set proper headers:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "https://us-central1-aiplatform.googleapis.com"
          }
        ]
      }
    ]
  }
}
```

## 6. API Keys and Authentication

### Firebase Auth Configuration
1. Go to Firebase Console > Authentication
2. Enable Sign-in methods:
   - Google (for authenticated users)
   - Anonymous (for quick access)
3. Add authorized domains:
   - `localhost`
   - `YOUR-PROJECT.web.app`
   - `YOUR-PROJECT.firebaseapp.com`

### Agent Engine Authentication
The UI uses two authentication methods:

1. **Development**: Your Google account via `gcloud auth`
2. **Production**: Firebase Auth ID tokens passed to Agent Engine

## 7. Deployment Permissions

### For Firebase Studio Auto-Deploy
1. Firebase Studio needs GitHub webhook permissions (already granted ✅)
2. Firebase Hosting needs to be enabled in your project

### Manual Deployment Permissions
```bash
# Login to Firebase
firebase login

# Deploy to hosting
firebase deploy --only hosting
```

## 8. Testing Permissions

### Quick Permission Test
```bash
# Test Agent Engine access
curl -X POST \
  "https://us-central1-aiplatform.googleapis.com/v1beta1/projects/warner-music-staging/locations/us-central1/reasoningEngines/8470637580386304:query" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"input": "test"}'
```

## 9. Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Use Firebase App Check** - Protect against abuse
3. **Enable budget alerts** - Monitor Agent Engine usage
4. **Implement rate limiting** - Use Firebase Security Rules

## 10. Troubleshooting Permissions

### Common Issues and Solutions

1. **403 Forbidden on Agent Engine**
   - Check: `gcloud auth list`
   - Fix: `gcloud auth application-default login`

2. **CORS errors in browser**
   - Check browser console for specific domain
   - Add domain to authorized list

3. **Firebase deployment fails**
   - Check: `firebase login:list`
   - Fix: `firebase login --reauth`

## Next Steps

1. **Create Firebase Project** (if not done)
2. **Enable required APIs**
3. **Set up service accounts**
4. **Configure CORS**
5. **Test permissions**
6. **Deploy to Firebase Hosting**

For help:
- Firebase Support: https://firebase.google.com/support
- Google Cloud Support: https://cloud.google.com/support