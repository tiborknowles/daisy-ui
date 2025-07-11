{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];
  env = {
    # Environment variables for Firebase Studio
    VITE_FIREBASE_API_KEY = "API_KEY";
    VITE_FIREBASE_AUTH_DOMAIN = "PROJECT_ID.firebaseapp.com";
    VITE_FIREBASE_PROJECT_ID = "PROJECT_ID";
    VITE_FIREBASE_STORAGE_BUCKET = "PROJECT_ID.appspot.com";
    VITE_FIREBASE_MESSAGING_SENDER_ID = "SENDER_ID";
    VITE_FIREBASE_APP_ID = "APP_ID";
  };
  idx.extensions = [
    "dbaeumer.vscode-eslint"
    "esbenp.prettier-vscode"
  ];
  idx.workspace = {
    onCreate = {
      npm-install = "npm install";
    };
  };
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
        manager = "web";
      };
    };
  };
}