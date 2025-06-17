import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { UserRole } from '../../types/auth';

interface InitialUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

const INITIAL_USERS: InitialUser[] = [
  {
    email: 'admin@aspcranes.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    email: 'john@aspcranes.com',
    password: 'sales123',
    name: 'John Sales',
    role: 'sales_agent',
  },
  {
    email: 'sara@aspcranes.com',
    password: 'manager123',
    name: 'Sara Manager',
    role: 'operations_manager',
  },
  {
    email: 'mike@aspcranes.com',
    password: 'operator123',
    name: 'Mike Operator',
    role: 'operator',
  },
];

// Separate signup logic to avoid circular dependency
const createInitialUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole
) => {
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
    // Don't log as error if user already exists - this is expected behavior
    if (error instanceof Error && 'code' in error && error.code === 'auth/email-already-in-use') {
      console.info(`Skipping user creation: ${email} (already exists)`);
      return null;
    }
    console.error('Error creating user:', error);
    throw error;
  }
};

export const setupInitialUsers = async () => {
  console.info('Starting initial users setup...');
  try {
    for (const user of INITIAL_USERS) {
      try {
        const result = await createInitialUser(user.email, user.password, user.name, user.role);
        if (result) {
          console.info(`✓ Created user: ${user.email}`);
        }
      } catch (error: any) {
        // Only throw if it's not the expected "already exists" case
        if (error.code !== 'auth/email-already-in-use') {
          throw error;
        }
      }
    }
    console.info('✓ Initial users setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up initial users:', error);
    throw error;
  }
};