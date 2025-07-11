/**
 * DaisyAI Chat Functions - Aligned with Firebase Genkit Best Practices
 * Production-ready implementation following firebase/genkit examples
 */

import { genkit } from 'genkit';
import { firebase } from '@genkit-ai/firebase';
import { vertexAI, gemini15Flash } from '@genkit-ai/vertexai';
import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'zod';
import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

// Define secrets for production (optional - for future API keys)
// const apiKey = defineSecret('DAISY_API_KEY');

// Initialize Genkit with Firebase and Vertex AI plugins
const ai = genkit({
  plugins: [
    // Firebase plugin for monitoring and telemetry
    firebase({
      projectId: process.env.GCLOUD_PROJECT || 'warner-music-staging',
      telemetry: {
        // Privacy: don't log user inputs/outputs in production
        disableLoggingInputAndOutput: process.env.NODE_ENV === 'production',
        forceDevExport: process.env.NODE_ENV === 'development',
      }
    }),
    // Vertex AI for LLM capabilities
    vertexAI({
      projectId: process.env.GCLOUD_PROJECT || 'warner-music-staging',
      location: process.env.GCLOUD_LOCATION || 'us-central1',
    }),
  ],
  // Production logging configuration
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableTracingAndMetrics: true,
});

// Define input/output schemas for type safety (following Genkit patterns)
const ChatInputSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().optional(),
  context: z.object({
    userId: z.string().optional(),
    previousMessages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).max(10).optional(), // Limit context to prevent token overflow
  }).optional(),
});

const ChatOutputSchema = z.object({
  response: z.string(),
  metadata: z.object({
    model: z.string(),
    tokensUsed: z.number().optional(),
    processingTime: z.number(),
    sessionId: z.string(),
  }).optional(),
});

// Define the chat flow (following firebase/genkit examples)
const daisyChatFlow = ai.defineFlow({
  name: 'daisyChat',
  inputSchema: ChatInputSchema,
  outputSchema: ChatOutputSchema,
}, async (input) => {
  const startTime = Date.now();
  const sessionId = input.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Build conversation context
    let conversationHistory = '';
    if (input.context?.previousMessages && input.context.previousMessages.length > 0) {
      conversationHistory = input.context.previousMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n') + '\n\n';
    }
    
    // System prompt for DaisyAI
    const systemPrompt = `You are DaisyAI, an intelligent orchestrator for the music industry.
You have access to:
- 428 music industry entities in a Neo4j knowledge graph
- 534 AI business scenarios for the music industry
- Deep understanding of music industry workflows, revenue models, and AI applications

Provide helpful, accurate, and actionable insights. Be concise but thorough.
Session: ${sessionId}`;

    // Generate response using Vertex AI
    const llmResponse = await ai.generate({
      model: gemini15Flash,
      prompt: `${systemPrompt}\n\n${conversationHistory}User: ${input.message}`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.9,
        topK: 40,
      },
    });

    // Return structured response
    return {
      response: llmResponse.text(),
      metadata: {
        model: 'gemini-1.5-flash',
        tokensUsed: llmResponse.usage?.totalTokens,
        processingTime: Date.now() - startTime,
        sessionId,
      },
    };
  } catch (error) {
    // Log error for monitoring (will appear in Firebase Console)
    functions.logger.error('DaisyChat flow error:', error);
    
    // Re-throw with user-friendly message
    throw new Error(
      error instanceof Error 
        ? `Chat processing failed: ${error.message}`
        : 'An unexpected error occurred while processing your request'
    );
  }
});

// Export as Firebase Function with authentication (following firebase/genkit patterns)
export const chatWithDaisy = onFlow({
  name: 'chatWithDaisy',
  flow: daisyChatFlow,
  // Authentication policy - require any authenticated user
  authPolicy: (auth) => {
    if (!auth) {
      throw new Error('Authentication required');
    }
    // Optional: Add custom claims check
    // if (!auth.token?.email_verified) {
    //   throw new Error('Email verification required');
    // }
    return true;
  },
  // HTTPS options for production
  httpsOptions: {
    cors: true, // Enable CORS for web access
    maxInstances: 100, // Scale up to 100 instances
    timeoutSeconds: 540, // 9 minutes timeout
    memory: '1GB' as const,
    // secrets: [apiKey], // Uncomment if using secrets
  },
});

// Health check endpoint (following Firebase Studio patterns)
export const healthCheck = functions.https.onRequest(async (req, res) => {
  // Set CORS headers (following Firebase Studio examples)
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const status = {
      status: 'healthy',
      service: 'daisy-chat-functions',
      timestamp: new Date().toISOString(),
      version: process.env.K_REVISION || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      genkit: {
        initialized: true,
        plugins: ['firebase', 'vertexai'],
      },
    };
    
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Development helper - list available flows (only in dev)
if (process.env.NODE_ENV !== 'production') {
  export const listFlows = functions.https.onRequest(async (req, res) => {
    res.json({
      flows: ['chatWithDaisy'],
      message: 'Use POST /chatWithDaisy to interact with the AI',
    });
  });
}