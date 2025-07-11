/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_AGENT_PROJECT_ID: string
  readonly VITE_AGENT_LOCATION: string
  readonly VITE_AGENT_ENGINE_ID: string
  readonly VITE_AGENT_DISPLAY_NAME: string
  readonly VITE_AGENT_DESCRIPTION: string
  readonly VITE_AGENT_ENGINE_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}