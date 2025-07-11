/**
 * DaisyAI Orchestrator Client - Direct HTTP implementation
 * Works around Firebase callable function CORS issues
 */

import { getAuth } from 'firebase/auth';
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


interface AgentEngineConfig {
  projectId: string;
  location: string;
  agentEngineId: string;
  displayName: string;
}

export class DaisyOrchestratorClient {
  private config: AgentEngineConfig;
  private auth = getAuth(firebaseApp);
  private functionUrl = `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'warner-music-staging'}.cloudfunctions.net/chatWithDaisy`;
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
   * Query the DaisyAI Orchestrator using direct HTTP calls
   * @param message - User's query
   * @param userId - Unique user identifier
   * @param _idToken - Not used (we get token from auth)
   * @returns Async iterable of response chunks
   */
  async *queryOrchestrator(
    message: string, 
    userId: string,
    _idToken?: string
  ): AsyncIterable<string> {
    try {
      // Get current user's ID token
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Please sign in to use DaisyAI Chat');
      }
      
      const idToken = await currentUser.getIdToken();
      
      // Add message to history
      this.messageHistory.push({ role: 'user', content: message });
      
      // Keep only last 10 messages for context (to avoid token limits)
      const recentHistory = this.messageHistory.slice(-10);
      
      // Prepare request data
      const requestData: ChatRequest = {
        message,
        sessionId: this.sessionId,
        context: {
          userId,
          previousMessages: recentHistory.slice(0, -1), // Exclude current message
        },
      };
      
      // Call the function directly with HTTP
      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ data: requestData }), // Wrap in data field for compatibility
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.result || data; // Handle both wrapped and unwrapped responses
      
      // Add response to history
      this.messageHistory.push({ role: 'assistant', content: result.response });
      
      // Log metadata for debugging (in production, send to analytics)
      if (result.metadata) {
        console.log('Chat metadata:', {
          model: result.metadata.model,
          processingTime: `${result.metadata.processingTime}ms`,
          sessionId: result.metadata.sessionId,
        });
      }
      
      // Yield the response as chunks for UI streaming effect
      // Split by sentences for natural streaming
      const sentences = result.response.match(/[^.!?]+[.!?]+/g) || [result.response];
      
      for (const sentence of sentences) {
        yield sentence;
        // Add slight delay for better UX
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error: any) {
      console.error('Error querying orchestrator:', error);
      
      // Handle specific error types
      if (error.message.includes('sign in')) {
        throw error;
      } else if (error.message.includes('Unauthorized')) {
        throw new Error('Authentication failed. Please sign in again');
      } else if (error.message.includes('Invalid input')) {
        throw new Error('Invalid message format. Please try again');
      } else if (error.message.includes('timeout')) {
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