import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const userData = result.user;
      
      // Transform email to match document ID format (replace @ and . with _)
      const transformedEmail = userData.email.replace(/[@.]/g, "_");
      
      // Try to get user document directly by transformed ID
      try {
        const userRef = doc(db, "users", transformedEmail);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userDoc = userSnap.data();
          
          // Set the role from the user document
          setRole(userDoc.role || 'member');
        } else {
          // Sign out the user if they're not registered
          await signOut(auth);
          throw new Error("You are not registered. Please contact the admin.");
        }
      } catch (docError) {
        // Sign out the user if there's an error
        await signOut(auth);
        throw new Error("Access denied. Please contact the admin.");
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
    } catch (error) {
      // Handle logout error silently
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Transform email to match document ID format
          const transformedEmail = user.email.replace(/[@.]/g, "_");
          
          // Get user document
          const userRef = doc(db, "users", transformedEmail);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userDoc = userSnap.data();
            const userRole = userDoc.role || 'member';
            setRole(userRole);
          } else {
            setRole(null);
          }
        } catch (error) {
          setRole(null);
        }
      } else {
        setRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    role,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 
