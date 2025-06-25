import React, { useState, useEffect } from 'react';
import { chatAPI, ChatSession } from '../services/api';
import { 
  ChatBubbleLeftRightIcon, 
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';

const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const sessionsData = await chatAPI.getSessions();
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load chat sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const sessionData = await chatAPI.getSession(sessionId);
      setSelectedSession(sessionData);
    } catch (error) {
      console.error('Error loading session details:', error);
      setError('Failed to load session details');
    }
  };

  const deleteSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    if (!window.confirm(`Are you sure you want to delete the session "${session.title}"?`)) return;

    try {
      await chatAPI.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
      
      setSuccess(`Session "${session.title}" deleted successfully!`);
    } catch (error: any) {
      console.error('Error deleting session:', error);
      setError(error.response?.data?.error || 'Failed to delete session');
    }
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    try {
      const updatedSession = await chatAPI.updateSession(sessionId, newTitle);
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      
      if (selectedSession?.id === sessionId) {
        setSelectedSession(updatedSession);
      }
      
      setSuccess('Session title updated successfully!');
    } catch (error: any) {
      console.error('Error updating session:', error);
      setError(error.response?.data?.error || 'Failed to update session');
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const formatFullDate = (timestamp: string) => {
    return format(new Date(timestamp), 'PPP p');
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Sessions</h1>
        <p className="text-gray-600">
          View and manage your chat history with Pal
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <span className="text-red-700">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <span className="text-green-700">{success}</span>
          <button 
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions List */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              All Sessions ({sessions.length})
            </h2>
          </div>
          
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chat sessions</h3>
              <p className="text-gray-600">Start a conversation to see your chat history here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto scrollbar-thin">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedSession?.id === session.id ? 'bg-primary-50 border-r-4 border-primary-600' : ''
                  }`}
                  onClick={() => loadSessionDetails(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                        {session.title}
                      </h3>
                      
                      {session.lastMessage && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          <span className="font-medium">
                            {session.lastMessage.role === 'user' ? 'You' : 'Pal'}:
                          </span>{' '}
                          {session.lastMessage.content}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {formatMessageTime(session.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <ChatBubbleLeftRightIcon className="h-3 w-3" />
                          {session.messageCount || 0} messages
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadSessionDetails(session.id);
                        }}
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title="View details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete session"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session Details */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedSession ? 'Session Details' : 'Select a Session'}
            </h2>
          </div>
          
          {!selectedSession ? (
            <div className="p-8 text-center">
              <EyeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No session selected</h3>
              <p className="text-gray-600">Click on a session to view its details and messages.</p>
            </div>
          ) : (
            <div>
              {/* Session Info */}
              <div className="p-6 border-b border-gray-200">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Title
                  </label>
                  <input
                    type="text"
                    value={selectedSession.title}
                    onChange={(e) => {
                      setSelectedSession(prev => prev ? { ...prev, title: e.target.value } : null);
                    }}
                    onBlur={(e) => {
                      if (e.target.value !== selectedSession.title) {
                        updateSessionTitle(selectedSession.id, e.target.value);
                      }
                    }}
                    className="input-field"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <p className="text-gray-600">{formatFullDate(selectedSession.createdAt)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <p className="text-gray-600">{formatFullDate(selectedSession.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Messages ({selectedSession.messages?.length || 0})
                </h3>
                
                {!selectedSession.messages || selectedSession.messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No messages in this session</p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                    {selectedSession.messages.map((message) => (
                      <div 
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-primary-50 border-l-4 border-primary-600' 
                            : 'bg-gray-50 border-l-4 border-gray-400'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">
                            {message.role === 'user' ? 'You' : 'Pal'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;
