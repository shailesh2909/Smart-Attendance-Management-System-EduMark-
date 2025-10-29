import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { User, CreateUserData, UpdateUserData, UserRole } from "@/models/User";

const USERS_COLLECTION = "users";

export class UserService {
  // Create a new user document in Firestore
  static async createUser(uid: string, userData: CreateUserData): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await setDoc(userRef, {
        ...userData,
        uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user profile");
    }
  }

  // Get user by UID
  static async getUserById(uid: string): Promise<User | null> {
    try {
      console.log("🔍 UserService: Looking for user with UID:", uid);
      
      // First, try to find document using UID as document ID (new structure)
      const userRef = doc(db, USERS_COLLECTION, uid);
      let userSnap;
      try {
        userSnap = await getDocFromServer(userRef as any);
      } catch {
        userSnap = await getDoc(userRef);
      }
      
      if (userSnap.exists()) {
        const data = userSnap.data() as Record<string, any> | undefined;
        console.log("🔍 UserService: Found user with UID as document ID");
        return data ? ({ uid, ...data } as User) : null;
      }
      
      // If not found, search by UID field in documents (old structure)
      console.log("🔍 UserService: Document not found with UID as ID, searching by UID field...");
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data() as Record<string, any>;
        console.log("🔍 UserService: Found user with UID field match:", data);
        return { uid, ...data } as User;
      }
      
      console.log("🔍 UserService: User not found anywhere");
      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw new Error("Failed to fetch user data");
    }
  }

  // Update user data
  static async updateUser(uid: string, userData: UpdateUserData): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, uid);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user profile");
    }
  }

  // Get all users with optional filters
  static async getUsers(filters?: {
    role?: UserRole;
    department?: string;
  }): Promise<User[]> {
    try {
      // Simplified query - just get all users first, then filter client-side
      const q = query(collection(db, USERS_COLLECTION));
      const querySnapshot = await getDocs(q);
      
      let users = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      } as User));

      // Apply filters client-side to avoid index requirements
      if (filters?.role) {
        users = users.filter(user => user.role === filters.role);
      }
      
      if (filters?.department) {
        users = users.filter(user => user.department === filters.department);
      }

      // Sort by creation date (newest first)
      users.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      return users;
    } catch (error) {
      console.error("Error getting users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  // Get users by role
  static async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.getUsers({ role });
  }

  // Helper method to log activities
  private static async logActivity(type: string, message: string, userId?: string): Promise<void> {
    try {
      const activityRef = collection(db, "activity_logs");
      await addDoc(activityRef, {
        type,
        message,
        userId,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging activity:", error);
      // Don't throw error for logging failures
    }
  }

  // Get students by department and year
  static async getStudentsByClass(department: string, year: string): Promise<User[]> {
    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where("role", "==", "student"),
        where("department", "==", department),
        where("year", "==", year),
        where("approved", "==", true),
        orderBy("name")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User));
    } catch (error) {
      console.error("Error getting students by class:", error);
      throw new Error("Failed to fetch students");
    }
  }

  // Get faculty members
  static async getFaculty(): Promise<User[]> {
    return this.getUsers({ role: "faculty", approved: true });
  }

  // Search users by name or email
  static async searchUsers(searchTerm: string, role?: UserRole): Promise<User[]> {
    try {
      // Note: Firestore doesn't support full-text search, so we'll fetch and filter client-side
      // For production, consider using Algolia or similar search service
      const users = await this.getUsers({ role });
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return users.filter(user =>
        user.name.toLowerCase().includes(lowerSearchTerm) ||
        user.email.toLowerCase().includes(lowerSearchTerm) ||
        (user.studentId && user.studentId.toLowerCase().includes(lowerSearchTerm)) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(lowerSearchTerm))
      );
    } catch (error) {
      console.error("Error searching users:", error);
      throw new Error("Failed to search users");
    }
  }

  // Get user statistics
  static async getUserStats(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalFaculty: number;
  }> {
    try {
      const allUsers = await this.getUsers();

      const totalStudents = allUsers.filter(user => user.role === "student").length;
      const totalFaculty = allUsers.filter(user => user.role === "faculty").length;

      return {
        totalUsers: totalStudents + totalFaculty,
        totalStudents,
        totalFaculty,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw new Error("Failed to fetch user statistics");
    }
  }
}