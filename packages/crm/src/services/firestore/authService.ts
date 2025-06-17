import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { User, UserRole } from '../../types/auth';
import { usersCollection } from './collections';

export const signUp = async (
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user: firebaseUser } = userCredential;

    await updateProfile(firebaseUser, { displayName: name });

    const userData = {
      id: firebaseUser.uid,
      name,
      email,
      role,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return {
      id: firebaseUser.uid,
      name,
      email,
      role,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user: firebaseUser } = userCredential;

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('User data not found');
    }

    return {
      id: firebaseUser.uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('Error signing in:', authError);
    
    // Provide more user-friendly error messages
    switch (authError.code) {
      case 'auth/invalid-credential':
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      case 'auth/user-not-found':
        throw new Error('No account found with this email address.');
      case 'auth/wrong-password':
        throw new Error('Incorrect password. Please try again.');
      case 'auth/too-many-requests':
        throw new Error('Too many failed login attempts. Please try again later.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled. Please contact support.');
      default:
        throw new Error('An error occurred during sign in. Please try again.');
    }
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data();

    if (!userData) return null;

    return {
      id: firebaseUser.uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates, { merge: true });

    const updatedDoc = await getDoc(userRef);
    const userData = updatedDoc.data();

    if (!userData) {
      throw new Error('User data not found after update');
    }

    return {
      id: userId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};