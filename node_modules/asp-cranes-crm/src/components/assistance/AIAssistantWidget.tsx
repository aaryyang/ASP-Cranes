import { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, X, MessageSquare } from 'lucide-react';
import { assistantService } from '../../services/assistantService';
import { useAssistantStore } from '../../store/assistantStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistantWidget() {
  const { isOpen, toggleAssistant, closeAssistant } = useAssistantStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent messages when component mounts if widget is open
    if (isOpen) {
      loadRecentMessages();
    }
  }, []);

  // Load messages when widget is opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadRecentMessages();
    }
  }, [isOpen]);

  const loadRecentMessages = async () => {
    try {
      setIsLoading(true);
      const recentMessages = await assistantService.getRecentMessages();
      setMessages(recentMessages);
      setError(null);
    } catch (error) {
      console.error('Error loading recent messages:', error);
      setError('Unable to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await assistantService.sendMessage(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get a response from the assistant');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  const toggleWidget = () => {
    toggleAssistant();
  };
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Widget toggle button - only show if widget is not open */}      {!isOpen && (
        <button
          onClick={toggleWidget}
          className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 animate-bounce-subtle"
          aria-label="Toggle AI Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Widget popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 overflow-hidden animate-slide-in-bottom">
          <div className="flex items-center justify-between p-3 bg-primary-600 text-white">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-medium text-sm">ASP Crane's Assistant</h3>
            </div>
            <button              onClick={closeAssistant}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {messages.length === 0 && !isLoading && !error && (
              <div className="flex justify-center items-center h-full text-gray-500">
                <p>Start a conversation with ASP Crane's Assistant</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="p-3 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
