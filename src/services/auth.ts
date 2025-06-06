import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, onSnapshot, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'sonner';

const INITIAL_CREDITS = 50;
const CREDITS_PER_GENERATION = 10;

// Add error logging
const logError = (error: any, context: string) => {
  console.error(`Auth Error (${context}):`, error);
  throw error;
};

// Function to clean up duplicate user documents
const cleanupDuplicateUsers = async (email: string, currentUserId: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    // Delete all documents except the current user's document
    const deletePromises = querySnapshot.docs
      .filter(doc => doc.id !== currentUserId)
      .map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    console.log('Cleaned up duplicate user documents');
  } catch (error) {
    console.error('Error cleaning up duplicate users:', error);
  }
};

export const signUp = async (email: string, password: string, name?: string): Promise<User> => {
  try {
    console.log('Attempting to sign up user:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User created successfully:', user.uid);
    
    // Update profile with name if provided
    if (name) {
      await updateProfile(user, {
        displayName: name
      });
      console.log('User profile updated with name');
    }
    
    // Send verification email
    await sendEmailVerification(user);
    console.log('Verification email sent to:', email);
    
    // Clean up any existing duplicate documents
    await cleanupDuplicateUsers(email, user.uid);
    
    // Update user document with name if provided
    await setDoc(doc(db, 'users', user.uid), {
      email,
      name: name || '',
      credits: INITIAL_CREDITS,
      createdAt: new Date().toISOString(),
      emailVerified: false
    });
    console.log('User document created in Firestore with initial credits');
    
    return user;
  } catch (error) {
    logError(error, 'signUp');
  }
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
    console.log('Attempting to login user:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in successfully:', userCredential.user.uid);
    
    // Update email verification status in Firestore
    if (userCredential.user.emailVerified) {
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        emailVerified: true
      });
    }
    
    return userCredential.user;
  } catch (error) {
    logError(error, 'login');
  }
};

export const loginWithGoogle = async (): Promise<{ user: User; credits: number }> => {
  try {
    console.log('Attempting Google login');
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    console.log('Google login successful:', userCredential.user.uid);
    
    // Clean up any existing duplicate documents
    await cleanupDuplicateUsers(userCredential.user.email!, userCredential.user.uid);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    let credits = INITIAL_CREDITS;
    
    if (!userDoc.exists()) {
      console.log('Creating new user document in Firestore');
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        credits: INITIAL_CREDITS,
        createdAt: new Date().toISOString(),
        emailVerified: true // Google login is pre-verified
      });
    } else {
      credits = userDoc.data().credits;
      // Update email verification status
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        emailVerified: true
      });
    }
    
    return {
      user: userCredential.user,
      credits
    };
  } catch (error: any) {
    console.error('Google login failed:', error);
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for authentication. Please check your Firebase configuration.');
    }
    throw error;
  }
};

export const sendVerificationEmail = async (user: User): Promise<void> => {
  try {
    console.log('Sending verification email to:', user.email);
    await sendEmailVerification(user);
    toast.success('Verification email sent! Please check your inbox.');
  } catch (error) {
    console.error('Failed to send verification email:', error);
    toast.error('Failed to send verification email. Please try again later.');
    throw error;
  }
};

export const isEmailVerified = async (userId: string): Promise<boolean> => {
  try {
    // Check Firebase Auth status
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId) {
      // Force refresh the token to get the latest emailVerified status
      await currentUser.reload();
      
      // Update Firestore if email is verified
      if (currentUser.emailVerified) {
        await updateDoc(doc(db, 'users', userId), {
          emailVerified: true
        });
        return true;
      }
    }
    
    // If no current user or email not verified in Auth, check Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().emailVerified === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
};

export const logout = async (): Promise<void> => {
  try {
    console.log('Attempting to logout user');
    await signOut(auth);
    console.log('User logged out successfully');
  } catch (error) {
    logError(error, 'logout');
  }
};

export const getUserCredits = async (userId: string): Promise<number> => {
  try {
    console.log('Fetching credits for user:', userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    const credits = userDoc.exists() ? userDoc.data().credits : 0;
    console.log('User credits:', credits);
    return credits;
  } catch (error) {
    logError(error, 'getUserCredits');
  }
};

export const deductCredits = async (userId: string, amount: number = CREDITS_PER_GENERATION): Promise<boolean> => {
  try {
    console.log(`Attempting to deduct ${amount} credits from user:`, userId);
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('User document not found');
      return false;
    }

    const currentCredits = userDoc.data().credits;
    if (currentCredits < amount) {
      console.log('Insufficient credits');
      return false;
    }

    await updateDoc(userRef, {
      credits: increment(-amount)
    });
    console.log('Credits deducted successfully');
    return true;
  } catch (error) {
    logError(error, 'deductCredits');
  }
};

export const hasEnoughCredits = async (userId: string, amount: number = CREDITS_PER_GENERATION): Promise<boolean> => {
  try {
    const credits = await getUserCredits(userId);
    return credits >= amount;
  } catch (error) {
    logError(error, 'hasEnoughCredits');
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log('Setting up auth state change listener');
  return onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
    callback(user);
  });
};

export const onCreditUpdate = (userId: string, callback: (credits: number) => void) => {
  return onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) {
      callback(doc.data().credits || 0);
    }
  });
};

export const purchaseCredits = async (userId: string, amount: number, price: number): Promise<boolean> => {
  try {
    console.log(`Attempting to purchase ${amount} credits for user:`, userId);
    const userRef = doc(db, 'users', userId);
    
    // Here you would typically integrate with a payment processor
    // For now, we'll just update the credits directly
    await updateDoc(userRef, {
      credits: increment(amount)
    });
    
    console.log('Credits purchased successfully');
    return true;
  } catch (error) {
    logError(error, 'purchaseCredits');
  }
}; 