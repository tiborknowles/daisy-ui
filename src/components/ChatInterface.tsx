/**
 * Main Chat Interface Component
 * Connects to DaisyAI Orchestrator Agent Engine
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DaisyOrchestratorClient } from '@/services/agentEngine';
import { MessageList } from './messagelist';
import { MessageInput } from './messageinput';
import { ChatHeader } from './chatheader';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    specialist?: string;
    tools?: string[];
  };
}

export function ChatInterface() {
  const { user, getIdToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to DaisyAI! I\'m your music industry AI orchestrator with access to 428 music industry entities and 534 business scenarios. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const client = useRef(new DaisyOrchestratorClient());
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      metadata: {}
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    try {
      // Get auth token
      const idToken = await getIdToken();
      const userId = user?.uid || 'anonymous';
      
      // Stream response from orchestrator
      let fullResponse = '';
      const streamStartTime = Date.now();
      
      for await (const chunk of client.current.queryOrchestrator(
        input, 
        userId, 
        idToken || undefined
      )) {
        fullResponse += chunk;
        
        // Update message with streaming content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: fullResponse }
            : msg
        ));
        
        // Extract metadata from special markers
        if (chunk.includes('[Neo4j Knowledge Graph specialist activated]')) {
          assistantMessage.metadata!.specialist = 'Neo4j Knowledge Graph';
        } else if (chunk.includes('[Business Scenarios specialist activated]')) {
          assistantMessage.metadata!.specialist = 'Business Scenarios';
        }
      }
      
      // Log performance metrics
      const streamDuration = Date.now() - streamStartTime;
      console.log(`Response streamed in ${streamDuration}ms`);
      
    } catch (error) {
      console.error('Error querying orchestrator:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: 'I apologize, but I encountered an error while processing your request. Please try again.',
              metadata: { ...msg.metadata, error: true }
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ChatHeader />
      
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={isLoading}
        placeholder="Ask about music industry AI, artist revenue, streaming strategies..."
      />
    </div>
  );
}

export default ChatInterface;