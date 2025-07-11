/**
 * DaisyAI Chat Functions - Firebase Cloud Functions
 * Production-ready implementation for DaisyAI Chat
 */

import * as functions from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyBD6mKc5JxZczg_0odXTBuTI8nIcyDJ2tU');

// Define input/output schemas for type safety
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

// Type definitions
type ChatInput = z.infer<typeof ChatInputSchema>;
type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Export the chat function with authentication
export const chatWithDaisy = onCall({
  cors: true,
  maxInstances: 100,
  timeoutSeconds: 540,
  memory: '1GiB',
}, async (request) => {
  const startTime = Date.now();

  // Require authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  // Validate input
  let input: ChatInput;
  try {
    input = ChatInputSchema.parse(request.data);
  } catch (error) {
    throw new HttpsError('invalid-argument', 'Invalid input');
  }

  const sessionId = input.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Build conversation context
    let conversationHistory = '';
    if (input.context?.previousMessages && input.context.previousMessages.length > 0) {
      conversationHistory = input.context.previousMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
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

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `${systemPrompt}\n\n${conversationHistory}User: ${input.message}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Return structured response
    const output: ChatOutput = {
      response,
      metadata: {
        model: 'gemini-1.5-flash',
        processingTime: Date.now() - startTime,
        sessionId,
      },
    };

    return output;
  } catch (error) {
    // Log error for monitoring
    functions.logger.error('DaisyChat error:', error);

    // Re-throw with user-friendly message
    throw new HttpsError(
      'internal',
      error instanceof Error 
        ? `Chat processing failed: ${error.message}`
        : 'An unexpected error occurred while processing your request'
    );
  }
});

// Health check endpoint
export const healthCheck = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
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