import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyABVXrylOIescVfarC8WhtDcDvJa8bxDKU",
  authDomain: "ai-crm-database.firebaseapp.com",
  projectId: "ai-crm-database",
  storageBucket: "ai-crm-database.firebasestorage.app",
  messagingSenderId: "201042126488",
  appId: "1:201042126488:web:9c85da043d8db0686452ed"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 