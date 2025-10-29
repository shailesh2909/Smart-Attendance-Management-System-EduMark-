import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Class, CreateClassData, UpdateClassData } from "@/models/Class";
import { UserService } from "./userService";

const CLASSES_COLLECTION = "classes";

export class ClassService {
  // Create a new class
  static async createClass(classData: CreateClassData): Promise<string> {
    try {
      // Filter out undefined values to avoid Firestore errors
      const cleanData: any = {
        name: classData.name,
        code: classData.code,
        type: classData.type,
        subject: classData.subject,
        department: classData.department,
        year: classData.year,
        semester: classData.semester,
        facultyId: classData.facultyId,
        facultyName: classData.facultyName,
        schedule: classData.schedule,
        students: classData.students || [],
        totalSessions: 0,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      // Only add division if it's defined (for classes)
      if (classData.division !== undefined && classData.division !== '') {
        cleanData.division = classData.division;
      }

      // Only add batch if it's defined (for labs)
      if (classData.batch !== undefined && classData.batch !== '') {
        cleanData.batch = classData.batch;
      }

      // Only add room if it's defined
      if (classData.room !== undefined && classData.room !== '') {
        cleanData.room = classData.room;
      }

      const docRef = await addDoc(collection(db, CLASSES_COLLECTION), cleanData);
      
      // Update the class document with its ID
      await updateDoc(docRef, { id: docRef.id });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating class:", error);
      throw new Error("Failed to create class");
    }
  }

  // Get class by ID
  static async getClassById(classId: string): Promise<Class | null> {
    try {
      const classRef = doc(db, CLASSES_COLLECTION, classId);
      const classSnap = await getDoc(classRef);
      
      if (classSnap.exists()) {
        return { id: classId, ...classSnap.data() } as Class;
      }
      return null;
    } catch (error) {
      console.error("Error getting class:", error);
      throw new Error("Failed to fetch class data");
    }
  }

  // Update class data
  static async updateClass(classId: string, classData: UpdateClassData): Promise<void> {
    try {
      const classRef = doc(db, CLASSES_COLLECTION, classId);
      await updateDoc(classRef, {
        ...classData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating class:", error);
      throw new Error("Failed to update class");
    }
  }

  // Delete class
  static async deleteClass(classId: string): Promise<void> {
    try {
      const classRef = doc(db, CLASSES_COLLECTION, classId);
      await deleteDoc(classRef);
    } catch (error) {
      console.error("Error deleting class:", error);
      throw new Error("Failed to delete class");
    }
  }

  // Get all classes with optional filters
  static async getClasses(filters?: {
    facultyId?: string;
    department?: string;
    year?: string;
    semester?: string;
    isActive?: boolean;
  }): Promise<Class[]> {
    try {
      // Start with a simple query to avoid index requirements
      let q = query(collection(db, CLASSES_COLLECTION));
      
      // Only add orderBy if no other filters are applied to avoid composite index requirement
      const hasFilters = filters && Object.keys(filters).length > 0;
      if (!hasFilters) {
        q = query(q, orderBy("createdAt", "desc"));
      }
      
      if (filters?.facultyId) {
        q = query(q, where("facultyId", "==", filters.facultyId));
      }
      
      if (filters?.department) {
        q = query(q, where("department", "==", filters.department));
      }
      
      if (filters?.year) {
        q = query(q, where("year", "==", filters.year));
      }
      
      if (filters?.semester) {
        q = query(q, where("semester", "==", filters.semester));
      }
      
      if (filters?.isActive !== undefined) {
        q = query(q, where("isActive", "==", filters.isActive));
      }

      const querySnapshot = await getDocs(q);
      let classes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Class));
      
      // If we have filters and couldn't use orderBy, sort in memory
      if (hasFilters) {
        classes.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
          return bDate.getTime() - aDate.getTime();
        });
      }
      
      return classes;
    } catch (error) {
      console.error("Error getting classes:", error);
      throw new Error("Failed to fetch classes");
    }
  }

  // Get classes assigned to a faculty member
  static async getFacultyClasses(facultyId: string): Promise<Class[]> {
    return this.getClasses({ facultyId, isActive: true });
  }

  // Get classes for a student
  static async getStudentClasses(studentId: string): Promise<Class[]> {
    try {
      const q = query(
        collection(db, CLASSES_COLLECTION),
        where("students", "array-contains", studentId),
        where("isActive", "==", true),
        orderBy("name")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Class));
    } catch (error) {
      console.error("Error getting student classes:", error);
      throw new Error("Failed to fetch student classes");
    }
  }

  // Add students to a class
  static async addStudentsToClass(classId: string, studentIds: string[]): Promise<void> {
    try {
      const classRef = doc(db, CLASSES_COLLECTION, classId);
      
      for (const studentId of studentIds) {
        await updateDoc(classRef, {
          students: arrayUnion(studentId),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error adding students to class:", error);
      throw new Error("Failed to add students to class");
    }
  }

  // Remove students from a class
  static async removeStudentsFromClass(classId: string, studentIds: string[]): Promise<void> {
    try {
      const classRef = doc(db, CLASSES_COLLECTION, classId);
      
      for (const studentId of studentIds) {
        await updateDoc(classRef, {
          students: arrayRemove(studentId),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error removing students from class:", error);
      throw new Error("Failed to remove students from class");
    }
  }

  // Auto-enroll students based on department and year
  static async autoEnrollStudents(classId: string): Promise<void> {
    try {
      const classData = await this.getClassById(classId);
      if (!classData) {
        throw new Error("Class not found");
      }

      // Get all students from the same department and year
      const students = await UserService.getStudentsByClass(
        classData.department,
        classData.year
      );

      const studentIds = students.map(student => student.uid);
      
      // Update the class with all eligible students
      await updateDoc(doc(db, CLASSES_COLLECTION, classId), {
        students: studentIds,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error auto-enrolling students:", error);
      throw new Error("Failed to auto-enroll students");
    }
  }

  // Assign faculty to class
  static async assignFaculty(classId: string, facultyId: string, facultyName: string): Promise<void> {
    try {
      const classRef = doc(db, CLASSES_COLLECTION, classId);
      await updateDoc(classRef, {
        facultyId,
        facultyName,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error assigning faculty:", error);
      throw new Error("Failed to assign faculty to class");
    }
  }

  // Get class statistics
  static async getClassStats(): Promise<{
    totalClasses: number;
    activeClasses: number;
    totalStudents: number;
    averageClassSize: number;
  }> {
    try {
      const allClasses = await this.getClasses();
      const activeClasses = allClasses.filter(cls => cls.isActive);
      const totalStudents = activeClasses.reduce((sum, cls) => sum + cls.students.length, 0);
      const averageClassSize = activeClasses.length > 0 ? totalStudents / activeClasses.length : 0;

      return {
        totalClasses: allClasses.length,
        activeClasses: activeClasses.length,
        totalStudents,
        averageClassSize: Math.round(averageClassSize * 100) / 100,
      };
    } catch (error) {
      console.error("Error getting class stats:", error);
      throw new Error("Failed to fetch class statistics");
    }
  }

  // Search classes
  static async searchClasses(searchTerm: string): Promise<Class[]> {
    try {
      const classes = await this.getClasses({ isActive: true });
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return classes.filter(cls =>
        cls.name.toLowerCase().includes(lowerSearchTerm) ||
        cls.code.toLowerCase().includes(lowerSearchTerm) ||
        cls.department.toLowerCase().includes(lowerSearchTerm) ||
        cls.facultyName.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error("Error searching classes:", error);
      throw new Error("Failed to search classes");
    }
  }

  // Increment total sessions count
  static async incrementSessionCount(classId: string): Promise<void> {
    try {
      const classData = await this.getClassById(classId);
      if (!classData) {
        throw new Error("Class not found");
      }

      const classRef = doc(db, CLASSES_COLLECTION, classId);
      await updateDoc(classRef, {
        totalSessions: (classData.totalSessions || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error incrementing session count:", error);
      throw new Error("Failed to update session count");
    }
  }
}