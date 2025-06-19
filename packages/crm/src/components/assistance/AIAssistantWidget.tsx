import { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, X, MessageSquare } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const hasMounted = useRef(false);

  const { user } = useAuthStore();  // Keep a reference to messages for persistence
  useEffect(() => {
    messagesRef.current = messages;
    // Save to localStorage for persistence across page navigations
    // Only save if we have messages to avoid overwriting with empty array
    if (messages.length > 0 && user?.id) {
      try {
        // Use user-specific key for localStorage
        const userChatKey = `asp-cranes-chat-messages-${user.id}`;
        localStorage.setItem(userChatKey, JSON.stringify(messages));
        console.log(`Saved ${messages.length} messages to localStorage for user ${user.id}`);
      } catch (error) {
        console.error("Error saving messages to localStorage:", error);
      }
    }
  }, [messages, user?.id]);
  // Component mount effect - load messages but keep chat closed on login
  useEffect(() => {
    // Initialize session state
    setSessionActive(true);
    
    // Load messages regardless of chat state for persistence
    loadRecentMessages();
    
    // Mark as mounted
    hasMounted.current = true;
  }, []);
  // Handle chat state changes and welcome message
  useEffect(() => {
    // Don't auto-save the open state to localStorage to keep chat closed on login
    // Only show welcome message if chat is opened and no messages exist
    if (isOpen && hasMounted.current && messages.length === 0) {
      const userName = user?.name || "MangoTheMonkey";      const welcomeMessage = {
        role: 'assistant' as const,
        content: `Hello, ${userName}! How can I assist you with your crane equipment needs today?`
      };
      setMessages([welcomeMessage]);
      const userChatKey = user?.id ? `asp-cranes-chat-messages-${user.id}` : 'asp-cranes-chat-messages';
      localStorage.setItem(userChatKey, JSON.stringify([welcomeMessage]));
      console.log("Added welcome message for user:", userName);
    }
  }, [isOpen, messages.length, user?.name]);  const loadRecentMessages = async () => {
    try {
      setIsLoading(true);

      // Always try to load from localStorage first for immediate persistence
      const userChatKey = user?.id ? `asp-cranes-chat-messages-${user.id}` : 'asp-cranes-chat-messages';
      const savedMessages = localStorage.getItem(userChatKey);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages) as Message[];
          if (parsedMessages.length > 0) {
            console.log("Loaded messages from local storage for user:", user?.id, "messages:", parsedMessages.length);
            setMessages(parsedMessages);
            setError(null);
            setIsLoading(false);
            return;
          }
        } catch (parseError) {
          console.error("Error parsing saved messages:", parseError);
          // Clear invalid data
          localStorage.removeItem(userChatKey);
        }
      }

      // If no valid local storage messages, try loading from Firestore
      try {
        const recentMessages = await assistantService.getRecentMessages();
        if (recentMessages.length > 0) {
          setMessages(recentMessages);
          // Save to localStorage for future persistence
          localStorage.setItem(userChatKey, JSON.stringify(recentMessages));
        }
      } catch (firestoreError) {
        console.error("Error loading from Firestore:", firestoreError);
        // Don't show error if local storage worked
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
    if (!input.trim() || isLoading) return;    const userMessage = input.trim();
    setInput('');
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedMessages);
    const userChatKey = user?.id ? `asp-cranes-chat-messages-${user.id}` : 'asp-cranes-chat-messages';
    localStorage.setItem(userChatKey, JSON.stringify(updatedMessages));

    setIsLoading(true);
    setError(null);

    try {
      const userId = user?.id || "MangoTheMonkey" || "guest";
      console.log("Sending message with user ID:", userId);      const response = await assistantService.sendMessage(userMessage, userId);
      const finalMessages = [...updatedMessages, { role: 'assistant' as const, content: response }];
      setMessages(finalMessages);
      const userChatKey = user?.id ? `asp-cranes-chat-messages-${user.id}` : 'asp-cranes-chat-messages';
      localStorage.setItem(userChatKey, JSON.stringify(finalMessages));
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get a response from the assistant');
      const errorMessages = [...updatedMessages, {        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.'
      }];
      setMessages(errorMessages);
      const userChatKey = user?.id ? `asp-cranes-chat-messages-${user.id}` : 'asp-cranes-chat-messages';
      localStorage.setItem(userChatKey, JSON.stringify(errorMessages));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWidget = () => {
    toggleAssistant();
  };
  const convertMarkdownBold = (text: string): string => {
    // Convert **text** to <b>text</b> (double asterisk first)
    let converted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    
    // Convert remaining *text* to <b>text</b> (single asterisk, but not if already processed)
    converted = converted.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<b>$1</b>');
    
    // Clean up any remaining asterisks that weren't converted
    converted = converted.replace(/\*/g, '');
    
    // Ensure proper spacing around sentences and numbers
    converted = converted.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
    converted = converted.replace(/(\d+)\s*([A-Za-z])/g, '$1 $2');
    
    return converted;
  };
  // Function to clear chat history (can be called on logout)
  const clearChatHistory = () => {
    setMessages([]);
    // Clear both generic and user-specific keys
    localStorage.removeItem('asp-cranes-chat-messages');
    if (user?.id) {
      localStorage.removeItem(`asp-cranes-chat-messages-${user.id}`);
    }
    console.log("Chat history cleared");
  };

  // Clear chat history when user changes (logout/login)
  useEffect(() => {
    if (user?.id) {
      // User logged in, load their messages
      loadRecentMessages();
    } else {
      // User logged out, clear messages
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
                  <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.role === 'assistant' ? convertMarkdownBold(message.content) : message.content }}></p>
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
