{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.firebase-tools
  ];
  env = {
    # Firebase configuration - Updated with actual values
    VITE_FIREBASE_API_KEY = "AIzaSyBD6mKc5JxZczg_0odXTBuTI8nIcyDJ2tU";
    VITE_FIREBASE_AUTH_DOMAIN = "warner-music-staging.firebaseapp.com";
    VITE_FIREBASE_PROJECT_ID = "warner-music-staging";
    VITE_FIREBASE_STORAGE_BUCKET = "warner-music-staging.firebasestorage.app";
    VITE_FIREBASE_MESSAGING_SENDER_ID = "346184616943";
    VITE_FIREBASE_APP_ID = "1:346184616943:web:7b98e60cedc7770503841a";
    
    # Agent Engine configuration
    VITE_AGENT_PROJECT_ID = "warner-music-staging";
    VITE_AGENT_LOCATION = "us-central1";
    VITE_AGENT_ENGINE_ID = "8470637580386304";
    VITE_AGENT_DISPLAY_NAME = "daisy-orchestrator";
    
    # Genkit environment variables
    GCLOUD_PROJECT = "warner-music-staging";
    GCLOUD_LOCATION = "us-central1";
    NODE_ENV = "development";
  };
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "bradlc.vscode-tailwindcss"
      "dsznajder.es7-react-js-snippets"
      "firebase.vscode-firestore"
    ];
    workspace = {
      onCreate = {
        default = ''
          npm install
          cd functions && npm install && cd ..
          echo "✅ Dependencies installed!"
          echo "📋 Next steps:"
          echo "  1. Run 'npm run dev' to start development server"
          echo "  2. Run 'firebase emulators:start' for local Firebase"
          echo "  3. Run './deploy-production.sh' to deploy"
        '';
      };
      onStart = {
        welcome = ''
          echo "🎵 Welcome to DaisyAI Chat!"
          echo "=============================="
          echo "📦 Available commands:"
          echo "  • npm run dev - Start development server"
          echo "  • npm run build - Build for production"
          echo "  • firebase emulators:start - Start Firebase emulators"
          echo "  • firebase deploy - Deploy to production"
          echo "  • ./deploy-production.sh - Automated deployment"
        '';
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
        emulators = {
          command = ["firebase" "emulators:start" "--host" "0.0.0.0"];
          manager = "web";
          port = 4000;
        };
      };
    };
  };
}