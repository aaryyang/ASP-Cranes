import { getFirestore } from 'firebase/firestore';
import { collection, addDoc, query, orderBy, getDocs, where, limit as firestoreLimit } from 'firebase/firestore';
import { getUserId } from '../lib/utils';

const db = getFirestore();
// Updated to use the ASP Cranes agent endpoint
const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:5000/agent/chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const assistantService = {
  // Cache session IDs for each user
  _sessionIds: new Map<string, string>(),
  
  // Load session IDs from localStorage on module initialization
  _loadSessionIds() {
    try {
      const savedSessionIds = localStorage.getItem('asp-cranes-session-ids');
      if (savedSessionIds) {
        const sessions = JSON.parse(savedSessionIds);
        Object.entries(sessions).forEach(([userId, sessionId]) => {
          this._sessionIds.set(userId, sessionId as string);
        });
        console.log("Loaded saved session IDs from localStorage");
      }
    } catch (e) {
      console.error("Error loading session IDs:", e);
    }
  },
  
  // Initialize sessions from localStorage
  _initSessions() {
    if (this._sessionIds.size === 0) {
      this._loadSessionIds();
    }
  },
  
  async sendMessage(message: string, specificUserId?: string): Promise<string> {
    // Initialize sessions from localStorage on first use
    this._initSessions();
    
    try {
      // Use the provided user ID or get it from the current auth state
      // IMPORTANT: specificUserId should come from the auth store, not just a parameter
      const userId = specificUserId || getUserId() || 'crm_user';
      
      console.log("Using user ID for message:", userId);
      
      // Store the user message
      await addDoc(collection(db, 'assistant_messages'), {
        role: 'user',
        content: message,
        timestamp: new Date(),
        userId
      });

      // Get the session ID for this user if it exists
      const sessionId = this._sessionIds.get(userId);
      console.log('Sending message to ASP Cranes Agent:', { message, userId, sessionId });

      // Call the ASP Cranes Agent API
      const response = await fetch(AGENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          user_id: userId,
          session_id: sessionId, // Pass existing session ID or null to create new one
          crm_access: true // Indicate that the agent should have CRM access
        }),
      });

      if (!response.ok) {
        console.error('Error response from agent:', await response.text());
        throw new Error('Failed to get response from ASP Cranes Agent');
      }

      const data = await response.json();
      console.log('Agent response received:', data);
      
      // Verify we have a response field in the returned data
      if (!data.response) {
        console.error('Missing response field in agent reply:', data);
        throw new Error('Invalid response format from ASP Cranes Agent');
      }
        // Save the session ID for future messages from this user
      if (data.session_id) {
        this._sessionIds.set(userId, data.session_id);
        console.log('Saved session ID for user:', { userId, sessionId: data.session_id });
        
        // Save to localStorage for persistence across page refreshes
        const sessionsObj: Record<string, string> = {};
        this._sessionIds.forEach((value, key) => {
          sessionsObj[key] = value;
        });
        localStorage.setItem('asp-cranes-session-ids', JSON.stringify(sessionsObj));
      }

      // Store the assistant's response
      await addDoc(collection(db, 'assistant_messages'), {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        userId,
        sessionId: data.session_id
      });

      return data.response;
    } catch (error) {
      console.error('Error in assistant service:', error);
      throw new Error('Failed to get response from ASP Cranes Agent');
    }
  },

  async getRecentMessages(messageLimit = 10): Promise<Message[]> {
    try {
      const userId = getUserId() || 'crm_user';
      const messagesRef = collection(db, 'assistant_messages');
      const q = query(
        messagesRef, 
        // Filter by user ID if available
        where("userId", "==", userId),
        orderBy('timestamp', 'desc'), 
        firestoreLimit(messageLimit)
      );
      
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          role: data.role,
          content: data.content,
          timestamp: data.timestamp.toDate()
        };
      }).reverse(); // Reverse to get chronological order
      
      return messages;
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      return [];
    }
  }
}