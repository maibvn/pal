import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon, 
  DocumentIcon, 
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import ChatPage from './components/ChatPage';
import DocumentsPage from './components/DocumentsPage';
import SessionsPage from './components/SessionsPage';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                {/* Logo */}
                <div className="flex-shrink-0 flex items-center">
                  <CpuChipIcon className="h-8 w-8 text-primary-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">Pal</span>
                  <span className="ml-2 text-sm text-gray-500">AI Assistant</span>
                </div>
                
                {/* Navigation Links */}
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `${isActive 
                        ? 'border-primary-500 text-primary-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`
                    }
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    Chat
                  </NavLink>
                  
                  <NavLink
                    to="/documents"
                    className={({ isActive }) =>
                      `${isActive 
                        ? 'border-primary-500 text-primary-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`
                    }
                  >
                    <DocumentIcon className="h-4 w-4 mr-2" />
                    Documents
                  </NavLink>
                  
                  <NavLink
                    to="/sessions"
                    className={({ isActive }) =>
                      `${isActive 
                        ? 'border-primary-500 text-primary-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`
                    }
                  >
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Sessions
                  </NavLink>
                </div>
              </div>
              
              {/* Right side */}
              <div className="flex items-center">
                <span className="text-sm text-gray-500">
                  v{process.env.REACT_APP_VERSION || '1.0.0'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Mobile menu */}
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${isActive 
                    ? 'bg-primary-50 border-primary-500 text-primary-700' 
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`
                }
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-2" />
                Chat
              </NavLink>
              
              <NavLink
                to="/documents"
                className={({ isActive }) =>
                  `${isActive 
                    ? 'bg-primary-50 border-primary-500 text-primary-700' 
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`
                }
              >
                <DocumentIcon className="h-4 w-4 inline mr-2" />
                Documents
              </NavLink>
              
              <NavLink
                to="/sessions"
                className={({ isActive }) =>
                  `${isActive 
                    ? 'bg-primary-50 border-primary-500 text-primary-700' 
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`
                }
              >
                <ClockIcon className="h-4 w-4 inline mr-2" />
                Sessions
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
