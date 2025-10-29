"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "../lib/firebaseClient";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { User, UserRole, CreateUserData } from "@/models/User";
import { UserService } from "@/services/userService";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isApproved: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      console.log("🔑 AuthContext: signIn started for", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("🔑 AuthContext: Firebase auth successful for", userCredential.user.uid);
      
      console.log("🔑 AuthContext: About to call UserService.getUserById...");
      let userDoc = await UserService.getUserById(userCredential.user.uid);
      console.log("🔑 AuthContext: User document fetched:", userDoc);
      
      // If approval seems pending, re-check once to avoid stale cache
      if (userDoc && !userDoc.approved && userDoc.role !== 'admin') {
        console.log("🔑 AuthContext: Approval false, forcing fresh recheck");
        userDoc = await UserService.getUserById(userCredential.user.uid);
        console.log("🔑 AuthContext: Re-fetched user document:", userDoc);
      }
      
      if (!userDoc) {
        throw new Error("User profile not found");
      }
      
      // Admins are automatically approved, others need approval
      if (!userDoc.approved && userDoc.role !== 'admin') {
        console.log("🔑 AuthContext: User not approved, signing out");
        await signOut(auth);
        throw new Error("Your account is pending approval. Please wait for admin approval.");
      }

      console.log("🔑 AuthContext: signIn completed successfully");
      return userDoc;
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw new Error(error.message || "Failed to sign in");
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout error:", error);
      throw new Error("Failed to logout");
    }
  };

  // Refresh user profile
  const refreshUserProfile = async (): Promise<void> => {
    if (user) {
      try {
        const userDoc = await UserService.getUserById(user.uid);
        setUserProfile(userDoc);
      } catch (error) {
        console.error("Error refreshing user profile:", error);
      }
    }
  };

  // Helper functions
  const isAuthenticated = !!user && !!userProfile;
  const isApproved = !!userProfile?.approved;
  const hasRole = (role: UserRole): boolean => userProfile?.role === role;

  useEffect(() => {
    console.log("🔑 AuthContext: Setting up auth state listener");
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log("🔑 AuthContext: Loading timeout reached, setting loading to false");
      setLoading(false);
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(loadingTimeout); // Clear the timeout once auth state is received
      
      console.log("🔑 AuthContext: Auth state changed:", {
        uid: currentUser?.uid || "No user",
        email: currentUser?.email || "No email",
        timestamp: new Date().toISOString()
      });
      
      setLoading(true);
      setUser(currentUser);
      
      if (currentUser) {
        try {
          console.log("🔑 AuthContext: Fetching user profile for", currentUser.uid);
          // Get user profile from Firestore
          let userDoc = await UserService.getUserById(currentUser.uid);
          console.log("🔑 AuthContext: User profile fetched:", {
            found: !!userDoc,
            role: userDoc?.role,
            approved: userDoc?.approved,
            name: userDoc?.name
          });
          
          // If approval seems pending, re-check once to avoid stale cache immediately after admin approval
          if (userDoc && !userDoc.approved && userDoc.role !== 'admin') {
            console.log("🔑 AuthContext: Approval false on listener, forcing fresh recheck");
            userDoc = await UserService.getUserById(currentUser.uid);
          }

          setUserProfile(userDoc);
          
          // Only sign out if user exists but is not approved AND is not an admin
          if (userDoc && !userDoc.approved && userDoc.role !== 'admin') {
            console.log("🔑 AuthContext: User not approved, signing out");
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
          }
        } catch (error) {
          console.error("🔑 AuthContext: Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        console.log("🔑 AuthContext: No current user, clearing profile");
        setUserProfile(null);
      }
      
      setLoading(false);
      console.log("🔑 AuthContext: Auth state processing complete");
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    logout,
    refreshUserProfile,
    isAuthenticated,
    isApproved,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
