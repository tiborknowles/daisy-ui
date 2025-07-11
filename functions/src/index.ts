import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {GoogleAuth} from "google-auth-library";

admin.initializeApp();

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

export const queryAgentEngine = functions.https.onCall(async (data, context) => {
  // Verify the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const {message, agentEngineId} = data;
  
  if (!message || !agentEngineId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Message and agentEngineId are required"
    );
  }

  try {
    // Get Google Cloud access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    // Call Agent Engine API
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1beta1/projects/warner-music-staging/locations/us-central1/reasoningEngines/${agentEngineId}:query`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: message,
        config: {
          user_id: context.auth.uid,
          session_id: `session-${Date.now()}`,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new functions.https.HttpsError(
        "internal",
        `Agent Engine error: ${error}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("Error calling Agent Engine:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to query agent"
    );
  }
});