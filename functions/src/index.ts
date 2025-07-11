/**
 * DaisyAI Chat Functions - Firebase Cloud Functions
 * Production-ready implementation for DaisyAI Chat
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Initialize Firebase Admin
admin.initializeApp();

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
    })).max(10).optional(),
  }).optional(),
});

// Type definitions
type ChatInput = z.infer<typeof ChatInputSchema>;

// Chat endpoint with CORS and authentication
export const chatWithDaisy = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', 'https://daisy-rocks.web.app');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const startTime = Date.now();

    try {
      // Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        res.status(401).json({ error: 'Invalid authentication token' });
        return;
      }

      // Validate input - Firebase callable functions wrap data in a 'data' field
      const requestData = req.body.data || req.body;
      let input: ChatInput;
      try {
        input = ChatInputSchema.parse(requestData);
      } catch (error) {
        res.status(400).json({ error: 'Invalid input format' });
        return;
      }

      const sessionId = input.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
Session: ${sessionId}
User: ${decodedToken.email || decodedToken.uid}`;

      // Generate response using Gemini
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `${systemPrompt}\n\n${conversationHistory}User: ${input.message}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Return response in Firebase callable function format
      res.status(200).json({
        result: {
          response,
          metadata: {
            model: 'gemini-1.5-flash',
            processingTime: Date.now() - startTime,
            sessionId,
          },
        },
      });

    } catch (error) {
      functions.logger.error('DaisyChat error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

// Health check endpoint
export const healthCheck = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
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