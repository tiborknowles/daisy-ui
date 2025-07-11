/**
 * DaisyAI Orchestrator Agent Engine Client
 * Connects to the deployed agent at:
 * projects/warner-music-staging/locations/us-central1/reasoningEngines/8470637580386304
 */

import { GoogleAuth } from 'google-auth-library';

interface AgentEngineConfig {
  projectId: string;
  location: string;
  agentEngineId: string;
  displayName: string;
}

interface StreamEvent {
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
  private auth: GoogleAuth | null = null;
  
  constructor() {
    this.config = {
      projectId: import.meta.env.VITE_AGENT_PROJECT_ID || 'warner-music-staging',
      location: import.meta.env.VITE_AGENT_LOCATION || 'us-central1',
      agentEngineId: import.meta.env.VITE_AGENT_ENGINE_ID || '8470637580386304',
      displayName: import.meta.env.VITE_AGENT_DISPLAY_NAME || 'daisy-orchestrator'
    };
    
    // Only initialize GoogleAuth on server-side
    if (typeof window === 'undefined') {
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    }
  }
  
  /**
   * Query the DaisyAI Orchestrator
   * @param message - User's query
   * @param userId - Unique user identifier
   * @param idToken - Firebase Auth ID token (for client-side calls)
   * @returns Async iterable of response chunks
   */
  async *queryOrchestrator(
    message: string, 
    userId: string,
    idToken?: string
  ): AsyncIterable<string> {
    const endpoint = `${import.meta.env.VITE_AGENT_ENGINE_ENDPOINT || 'https://us-central1-aiplatform.googleapis.com'}/v1beta1/projects/${this.config.projectId}/locations/${this.config.location}/reasoningEngines/${this.config.agentEngineId}:streamQuery`;
    
    // Get authentication token
    let authToken: string;
    if (idToken) {
      // Client-side: use Firebase ID token
      authToken = idToken;
    } else if (this.auth) {
      // Server-side: use service account
      const client = await this.auth.getClient();
      const { token } = await client.getAccessToken();
      authToken = token!;
    } else {
      throw new Error('No authentication method available');
    }
    
    const requestBody = {
      input: message,
      config: {
        user_id: userId,
        session_id: `session-${Date.now()}`,
        // Enable all specialists
        enable_neo4j: true,
        enable_scenarios: true
      }
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Agent Engine error: ${response.status} - ${error}`);
    }
    
    // Stream the response
    yield* this.streamResponse(response);
  }
  
  /**
   * Parse streaming response from Agent Engine
   */
  private async *streamResponse(response: Response): AsyncIterable<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamEvent;
              
              // Extract text from the response
              if (data.content?.parts) {
                for (const part of data.content.parts) {
                  if (part.text) {
                    yield part.text;
                  }
                  
                  // Optionally handle tool calls
                  if (part.functionCall) {
                    yield `\n[Consulting ${part.functionCall.name}...]\n`;
                  }
                }
              }
              
              // Handle metadata (which specialist is being used)
              if (data.metadata?.specialist) {
                yield `\n[${data.metadata.specialist} specialist activated]\n`;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  /**
   * Get agent configuration details
   */
  getConfig() {
    return {
      ...this.config,
      description: 'A base ReAct agent built with Google\'s Agent Development Kit (ADK)',
      capabilities: [
        'Neo4j Knowledge Graph (428 music industry entities)',
        'Business Scenarios (534 AI use cases and strategies)',
        'Gemini 2.0 Flash for reasoning and synthesis'
      ],
      pythonVersion: '3.12',
      framework: 'google-adk',
      createTime: new Date('2025-01-10T09:52:49Z'),
      updateTime: new Date('2025-01-10T14:03:35Z')
    };
  }
}