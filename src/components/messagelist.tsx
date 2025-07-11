/**
 * Message List Component
 * Following Firebase Studio template patterns
 */

import { Message } from './chatinterface';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-2xl rounded-lg px-4 py-2 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : message.role === 'system'
                ? 'bg-gray-200 text-gray-800'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.metadata?.specialist && (
              <p className="text-xs mt-1 opacity-75">
                via {message.metadata.specialist}
              </p>
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-200 rounded-lg px-4 py-2">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageList;