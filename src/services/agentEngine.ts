/**
 * DaisyAI Orchestrator Agent Engine Client
 * Connects to the deployed agent via Cloud Functions
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseApp } from '@/lib/firebase';

interface AgentEngineConfig {
  projectId: string;
  location: string;
  agentEngineId: string;
  displayName: string;
}

interface AgentResponse {
  output?: string;
  content?: {
    parts?: Array<{
      text?: string;
      functionCall?: {
        name: string;
        args?: any;
      };
    }>;
  };
  metadata?: {
    tool?: string;
    specialist?: string;
  };
}

export class DaisyOrchestratorClient {
  private config: AgentEngineConfig;
  private functions = getFunctions(firebaseApp);
  
  constructor() {
    this.config = {
      projectId: import.meta.env.VITE_AGENT_PROJECT_ID || 'warner-music-staging',
      location: import.meta.env.VITE_AGENT_LOCATION || 'us-central1',
      agentEngineId: import.meta.env.VITE_AGENT_ENGINE_ID || '8470637580386304',
      displayName: import.meta.env.VITE_AGENT_DISPLAY_NAME || 'daisy-orchestrator'
    };
  }
  
  /**
   * Query the DaisyAI Orchestrator via Cloud Function
   * @param message - User's query
   * @param userId - Unique user identifier (not used with Cloud Functions)
   * @param idToken - Firebase Auth ID token (not used with Cloud Functions)
   * @returns Async iterable of response chunks
   */
  async *queryOrchestrator(
    message: string, 
    _userId: string,
    _idToken?: string
  ): AsyncIterable<string> {
    try {
      // Call the Cloud Function
      const queryAgentEngine = httpsCallable<
        { message: string; agentEngineId: string },
        AgentResponse
      >(this.functions, 'queryAgentEngine');
      
      const result = await queryAgentEngine({
        message,
        agentEngineId: this.config.agentEngineId
      });
      
      const response = result.data;
      
      // Handle the response
      if (response.output) {
        yield response.output;
      } else if (response.content?.parts) {
        for (const part of response.content.parts) {
          if (part.text) {
            yield part.text;
          }
          if (part.functionCall) {
            yield `\n[Consulting ${part.functionCall.name}...]\n`;
          }
        }
      }
      
      // Handle metadata
      if (response.metadata?.specialist) {
        yield `\n[${response.metadata.specialist} specialist activated]\n`;
      }
    } catch (error: any) {
      console.error('Error querying orchestrator:', error);
      
      // Extract user-friendly error message
      if (error.code === 'functions/unauthenticated') {
        throw new Error('Please sign in to use the chat.');
      } else if (error.code === 'functions/invalid-argument') {
        throw new Error('Invalid request. Please try again.');
      } else {
        throw new Error('Failed to connect to the orchestrator. Please try again.');
      }
    }
  }
  
  /**
   * Get agent configuration
   */
  getConfig(): AgentEngineConfig {
    return { ...this.config };
  }
}