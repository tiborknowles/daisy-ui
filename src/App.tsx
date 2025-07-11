/**
 * Main App Component
 * DaisyAI Chat Interface
 */

import { Routes, Route } from 'react-router-dom';
import RootLayout from '@/layout/RootLayout';
import { HomePage } from '@/pages/homepage';
import { ChatPage } from '@/pages/chatpage';
import { ProtectedRoute } from '@/components/protectedroute';

function App() {
  return (
    <RootLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </RootLayout>
  );
}

export default App;