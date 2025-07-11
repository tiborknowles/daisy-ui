# DaisyAI Chat UI

Public-facing chat interface for the DaisyAI Orchestrator Agent, built with Firebase Studio patterns.

## Agent Details

- **Agent Engine ID**: `8470637580386304`
- **Project**: `warner-music-staging`
- **Location**: `us-central1`
- **Framework**: Google Agent Development Kit (ADK)
- **Model**: Gemini 2.0 Flash
- **Capabilities**:
  - Neo4j Knowledge Graph: 428 music industry entities
  - Business Scenarios: 534 AI use cases and strategies
  - Intelligent orchestration and synthesis

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting
- **Backend**: Google Vertex AI Agent Engine

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Google Cloud project with billing enabled
- Firebase project created

### 2. Clone and Install

```bash
# Clone the repository
git clone [your-repo-url]
cd daisy-chat-ui

# Install dependencies
npm install
```

### 3. Configure Firebase

```bash
# Login to Firebase
firebase login

# Initialize Firebase (select your project)
firebase init

# Select these features:
# - Hosting
# - Emulators (Auth, Hosting)
```

### 4. Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local with your Firebase config
# The Agent Engine values are already set to production values
```

### 5. Run Development Server

```bash
# Start the development server
npm run dev

# In another terminal, start Firebase emulators
npm run emulators
```

Visit `http://localhost:3000` to see the app.

### 6. Deploy to Production

```bash
# Build the production app
npm run build

# Deploy to Firebase Hosting
npm run deploy
```

## Project Structure

```
daisy-chat-ui/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (Auth)
│   ├── lib/            # Core utilities (Firebase config)
│   ├── pages/          # Page components
│   ├── services/       # External services (Agent Engine)
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── firebase.json       # Firebase configuration
```

## Key Features

- **Anonymous Chat**: Users can start chatting immediately without sign-in
- **Google Sign-In**: Optional authentication for personalized experience
- **Streaming Responses**: Real-time streaming from Agent Engine
- **Specialist Indicators**: Shows which knowledge source is being used
- **Mobile Responsive**: Works great on all device sizes

## Security Considerations

- Firebase App Check enabled for bot protection
- CORS properly configured
- Authentication tokens validated
- Rate limiting via Firebase Security Rules
- XSS protection headers

## Environment Variables

```env
# Firebase Configuration (get from Firebase Console)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Agent Configuration (production values - do not change)
VITE_AGENT_PROJECT_ID=warner-music-staging
VITE_AGENT_LOCATION=us-central1
VITE_AGENT_ENGINE_ID=8470637580386304
```

## Development Tips

- Use Firebase Emulators for local development
- Check browser console for detailed error messages
- Monitor Agent Engine logs in Google Cloud Console
- Use Chrome DevTools Network tab to debug API calls

## Support

For issues with:
- **Agent Engine**: Check Cloud Logging in GCP Console
- **Firebase**: Use Firebase Console debug tools
- **UI/UX**: See the design document in `_Daisy UI_UX Overview.pdf`

## License

This project follows Firebase Studio template patterns and is configured for the DaisyAI Orchestrator.