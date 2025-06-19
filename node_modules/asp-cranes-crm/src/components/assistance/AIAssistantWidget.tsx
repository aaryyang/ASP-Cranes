import { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, X, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { assistantService } from '../../services/assistantService';
import { useAssistantStore } from '../../store/assistantStore';
import { useAuthStore } from '../../store/authStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistantWidget() {
  const { isOpen, toggleAssistant } = useAssistantStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const hasMounted = useRef(false);

  const { user } = useAuthStore();

  useEffect(() => {
    messagesRef.current = messages;
    if (messages.length > 0 && user?.id) {
      try {
        const userChatKey = `asp-cranes-chat-messages-${user.id}`;
        localStorage.setItem(userChatKey, JSON.stringify(messages));
      } catch (error) {
        console.error("Error saving messages to localStorage:", error);
      }
    }
  }, [messages, user?.id]);
  useEffect(() => {
    loadRecentMessages();
    hasMounted.current = true;
  }, []);

  useEffect(() => {
    if (isOpen && hasMounted.current && messages.length === 0) {
      const userName = user?.name || "MangoTheMonkey";
      const welcomeMessage = {
        role: 'assistant' as const,
        content: `Hello, ${userName}! How can I assist you with your crane equipment needs today?`
      };
      setMessages([welcomeMessage]);
      const userChatKey = user?.id ? `asp-cranes-chat-messages-${user.id}` : 'asp-cranes-chat-messages';
      localStorage.setItem(userChatKey, JSON.stringify([welcomeMessage]));
    }
  }, [isOpen, messages.length, user?.name]);

  const loadRecentMessages = async () => {
    try {
      setIsLoading(true);
      const userChatKey = user?.id ? `asp-cranes-chat-messages-${user.id}` : 'asp-cranes-chat-messages';
      const savedMessages = localStorage.getItem(userChatKey);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages) as Message[];
          if (parsedMessages.length > 0) {
            setMessages(parsedMessages);
            setError(null);
            setIsLoading(false);
            return;
          }
        } catch (parseError) {
          localStorage.removeItem(userChatKey);
        }
      }
      try {
        const recentMessages = await assistantService.getRecentMessages();
        if (recentMessages.length > 0) {
          setMessages(recentMessages);
          localStorage.setItem(userChatKey, JSON.stringify(recentMessages));
        }
      } catch (firestoreError) {
        console.error("Error loading from Firestore:", firestoreError);
      }
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
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedMessages);
    const userChatKey = user?.id ? `asp-cranes-chat-messages-${user.id}` : 'asp-cranes-chat-messages';
    localStorage.setItem(userChatKey, JSON.stringify(updatedMessages));

    setIsLoading(true);
    setError(null);

    try {
      const userId = user?.id || user?.name || "sales_staff";
      const response = await assistantService.sendMessage(userMessage, userId);
      const finalMessages = [...updatedMessages, { role: 'assistant' as const, content: response }];
      setMessages(finalMessages);
      localStorage.setItem(userChatKey, JSON.stringify(finalMessages));
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get a response from the assistant');
      const errorMessages = [...updatedMessages, {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.'
      }];
      setMessages(errorMessages);
      localStorage.setItem(userChatKey, JSON.stringify(errorMessages));
    } finally {
      setIsLoading(false);
    }
  };
  const toggleWidget = () => {
    toggleAssistant();
  };

  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem('asp-cranes-chat-messages');
    if (user?.id) {
      localStorage.removeItem(`asp-cranes-chat-messages-${user.id}`);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadRecentMessages();
    } else {
      clearChatHistory();
    }
  }, [user?.id]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleWidget}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors bg-primary-600 text-white hover:bg-primary-700 ${!isOpen ? 'animate-bounce-subtle' : ''}`}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 overflow-hidden animate-slide-in-bottom">
          <div className="fixed top-0 right-0 left-0 z-20 flex items-center justify-center p-3 bg-primary-600 text-white w-80 sm:w-96 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-medium text-sm">ASP Crane's Assistant</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 pt-16">
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
                className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                    }`}
                >                  {message.role === 'assistant' ? (
                    <div className="text-sm assistant-message prose prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
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
