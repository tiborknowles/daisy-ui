/**
 * Chat Header Component
 * Following Firebase Studio template patterns
 */

import { useAuth } from '@/contexts/AuthContext';

export function ChatHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">DaisyAI Orchestrator</h1>
          <p className="text-sm text-gray-500">Music Industry AI Assistant</p>
        </div>
        {user && (
          <button
            onClick={signOut}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
}

export default ChatHeader;