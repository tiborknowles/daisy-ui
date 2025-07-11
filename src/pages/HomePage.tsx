/**
 * Home Page - Landing page for DaisyAI Chat
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signInAnonymous } = useAuth();

  const handleGetStarted = async () => {
    if (user) {
      navigate('/chat');
    } else {
      // Sign in anonymously for quick access
      await signInAnonymous();
      navigate('/chat');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to DaisyAI
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Your intelligent music industry AI orchestrator
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">What I Can Help With</h2>
          
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">📊 Music Industry Knowledge</h3>
              <p className="text-gray-700">
                Access insights from {import.meta.env.VITE_AGENT_NEO4J_ENTITIES || '428'} music industry entities including Artists, 
                Revenue streams, Rights management, and more
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">🚀 AI Business Strategies</h3>
              <p className="text-gray-700">
                Explore {import.meta.env.VITE_AGENT_BUSINESS_SCENARIOS || '534'} AI-powered business scenarios for 
                streaming, marketing, artist development, and revenue optimization
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="w-full md:w-auto"
          >
            Start Chatting
          </Button>
          
          {!user && (
            <div className="text-sm text-gray-500">
              or{' '}
              <button
                onClick={signInWithGoogle}
                className="text-blue-600 hover:underline"
              >
                Sign in with Google
              </button>
              {' '}for personalized experience
            </div>
          )}
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>Powered by Gemini 2.0 Flash • Agent Engine ID: {import.meta.env.VITE_AGENT_ENGINE_ID}</p>
          <p>Built with Google's Agent Development Kit (ADK)</p>
        </div>
      </div>
    </div>
  );
}