/**
 * DaisyAI Orchestrator Client - Streamlined with Firebase Genkit
 * Production-ready implementation with proper error handling
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from '@/lib/firebase';

interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    userId?: string;
    previousMessages?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  };
}

interface ChatResponse {
  response: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    processingTime: number;
    sessionId: string;
  };
}

interface AgentEngineConfig {
  projectId: string;
  location: string;
  agentEngineId: string;
  displayName: string;
}

export class DaisyOrchestratorClient {
  private config: AgentEngineConfig;
  private functions = getFunctions(firebaseApp, 'us-central1');
  private chatFunction = httpsCallable<ChatRequest, ChatResponse>(
    this.functions, 
    'chatWithDaisy'
  );
  private sessionId: string;
  private messageHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  constructor() {
    this.config = {
      projectId: import.meta.env.VITE_AGENT_PROJECT_ID || 'warner-music-staging',
      location: import.meta.env.VITE_AGENT_LOCATION || 'us-central1',
      agentEngineId: import.meta.env.VITE_AGENT_ENGINE_ID || '8470637580386304',
      displayName: import.meta.env.VITE_AGENT_DISPLAY_NAME || 'daisy-orchestrator'
    };
    
    // Initialize session ID
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Query the DaisyAI Orchestrator using Genkit-powered Cloud Function
   * @param message - User's query
   * @param userId - Unique user identifier
   * @param _idToken - Not used with Genkit (auth handled automatically)
   * @returns Async iterable of response chunks
   */
  async *queryOrchestrator(
    message: string, 
    userId: string,
    _idToken?: string
  ): AsyncIterable<string> {
    try {
      // Add message to history
      this.messageHistory.push({ role: 'user', content: message });
      
      // Keep only last 10 messages for context (to avoid token limits)
      const recentHistory = this.messageHistory.slice(-10);
      
      // Call the Genkit-powered Cloud Function
      const result = await this.chatFunction({
        message,
        sessionId: this.sessionId,
        context: {
          userId,
          previousMessages: recentHistory.slice(0, -1), // Exclude current message
        },
      });
      
      const response = result.data;
      
      // Add response to history
      this.messageHistory.push({ role: 'assistant', content: response.response });
      
      // Log metadata for debugging (in production, send to analytics)
      if (response.metadata) {
        console.log('Chat metadata:', {
          model: response.metadata.model,
          processingTime: `${response.metadata.processingTime}ms`,
          tokensUsed: response.metadata.tokensUsed,
          sessionId: response.metadata.sessionId,
        });
      }
      
      // Yield the response as chunks for UI streaming effect
      // Split by sentences for natural streaming
      const sentences = response.response.match(/[^.!?]+[.!?]+/g) || [response.response];
      
      for (const sentence of sentences) {
        yield sentence;
        // Add slight delay for better UX
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error: any) {
      console.error('Error querying orchestrator:', error);
      
      // Handle specific error types
      if (error.code === 'functions/unauthenticated') {
        throw new Error('Please sign in to use DaisyAI Chat');
      } else if (error.code === 'functions/permission-denied') {
        throw new Error('You do not have permission to use this service');
      } else if (error.code === 'functions/resource-exhausted') {
        throw new Error('Service is currently busy. Please try again in a moment');
      } else if (error.code === 'functions/deadline-exceeded') {
        throw new Error('Request timed out. Please try a simpler query');
      } else {
        // Generic error message for production
        throw new Error('Unable to process your request. Please try again');
      }
    }
  }
  
  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }
  
  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
  
  /**
   * Start a new session
   */
  startNewSession(): void {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.clearHistory();
  }
  
  /**
   * Get agent configuration
   */
  getConfig(): AgentEngineConfig {
    return { ...this.config };
  }
}