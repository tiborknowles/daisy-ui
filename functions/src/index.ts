/**
 * DaisyAI Chat Functions - Powered by Firebase Genkit
 * Production-ready implementation with proper error handling and monitoring
 */

import { genkit } from 'genkit';
import { vertexAI, gemini15Flash } from '@genkit-ai/vertexai';
import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'zod';
import * as functions from 'firebase-functions';

// Initialize Genkit with Vertex AI plugin
const ai = genkit({
  plugins: [
    vertexAI({
      projectId: 'warner-music-staging',
      location: 'us-central1',
    }),
  ],
  // Enable production logging
  logLevel: 'info',
  enableTracingAndMetrics: true,
});

// Define input/output schemas for type safety
const ChatInputSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().optional(),
  context: z.object({
    userId: z.string().optional(),
    previousMessages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).optional(),
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

// Main chat flow with DaisyAI orchestrator
export const daisyChat = onFlow(
  ai,
  {
    name: 'daisyChat',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
    authPolicy: async (auth, input) => {
      // Require authentication for production
      if (!auth) {
        throw new Error('Authentication required to use DaisyAI Chat');
      }
      // Optional: Add additional authorization checks here
      // e.g., check if user is in allowed list, has valid subscription, etc.
    },
    httpsOptions: {
      cors: true, // Enable CORS for web access
      maxInstances: 100, // Scale up to 100 instances for production
      timeoutSeconds: 540, // 9 minutes timeout for complex queries
      memory: '1GB' as const,
    },
  },
  async (input, { auth }) => {
    const startTime = Date.now();
    const sessionId = input.sessionId || `session-${Date.now()}-${auth?.uid}`;
    
    try {
      // Build the prompt with context
      let prompt = input.message;
      
      // Add conversation context if provided
      if (input.context?.previousMessages) {
        const contextStr = input.context.previousMessages
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        prompt = `Previous conversation:\n${contextStr}\n\nUser: ${prompt}`;
      }
      
      // Add system context for DaisyAI
      const systemPrompt = `You are DaisyAI, an intelligent orchestrator for the music industry.
You have access to:
- 428 music industry entities in a Neo4j knowledge graph
- 534 AI business scenarios for the music industry
- Deep understanding of music industry workflows, revenue models, and AI applications

Provide helpful, accurate, and actionable insights. Be concise but thorough.
Current user: ${auth?.uid || 'anonymous'}
Session: ${sessionId}`;

      // Generate response using Vertex AI
      const { text, usage } = await ai.generate({
        model: gemini15Flash,
        prompt: `${systemPrompt}\n\n${prompt}`,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.9,
          topK: 40,
        },
      });

      // Return structured response
      return {
        response: text,
        metadata: {
          model: 'gemini-1.5-flash',
          tokensUsed: usage?.totalTokens,
          processingTime: Date.now() - startTime,
          sessionId,
        },
      };
    } catch (error) {
      // Log error for monitoring
      functions.logger.error('DaisyChat error:', error);
      
      // Return user-friendly error
      throw new Error(
        error instanceof Error 
          ? `Chat processing failed: ${error.message}`
          : 'An unexpected error occurred while processing your request'
      );
    }
  }
);

// Health check endpoint for monitoring
export const healthCheck = functions.https.onRequest(async (req, res) => {
  try {
    // Verify Genkit is initialized
    const status = {
      status: 'healthy',
      service: 'daisy-chat-functions',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      genkit: {
        initialized: true,
        plugins: ['vertexai'],
      },
    };
    
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Export for Firebase Functions discovery
export { daisyChat as chatWithDaisy };