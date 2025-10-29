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
  limit,
  serverTimestamp,
  Timestamp,
  startAt,
  endAt,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import {
  Attendance,
  CreateAttendanceData,
  UpdateAttendanceData,
  AttendanceRecord,
  AttendanceStats,
  StudentAttendanceSummary,
  AttendanceStatus,
} from "@/models/Attendance";
import { ClassService } from "./classService";

const ATTENDANCE_COLLECTION = "attendance";

export class AttendanceService {
  // Create new attendance record
  static async createAttendance(attendanceData: CreateAttendanceData): Promise<string> {
    try {
      // Calculate counts
      const presentCount = attendanceData.records.filter(r => r.status === "present").length;
      const absentCount = attendanceData.records.filter(r => r.status === "absent").length;
      const lateCount = attendanceData.records.filter(r => r.status === "late").length;
      const totalStudents = attendanceData.records.length;

      const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), {
        ...attendanceData,
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        isFinalized: true, // Mark as finalized on creation to prevent changes
        createdAt: serverTimestamp(),
      });

      // Update the document with its ID
      await updateDoc(docRef, { id: docRef.id });

      // Increment session count for the class
      await ClassService.incrementSessionCount(attendanceData.classId);

      return docRef.id;
    } catch (error) {
      console.error("Error creating attendance:", error);
      throw new Error("Failed to create attendance record");
    }
  }

  // Get attendance by ID
  static async getAttendanceById(attendanceId: string): Promise<Attendance | null> {
    try {
      const attendanceRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
      const attendanceSnap = await getDoc(attendanceRef);
      
      if (attendanceSnap.exists()) {
        return { id: attendanceId, ...attendanceSnap.data() } as Attendance;
      }
      return null;
    } catch (error) {
      console.error("Error getting attendance:", error);
      throw new Error("Failed to fetch attendance data");
    }
  }

  // Update attendance record
  static async updateAttendance(attendanceId: string, attendanceData: UpdateAttendanceData): Promise<void> {
    try {
      // First check if the attendance record is finalized
      const existingAttendance = await this.getAttendanceById(attendanceId);
      if (existingAttendance?.isFinalized) {
        throw new Error("Cannot update finalized attendance record");
      }

      const updateData: any = {
        ...attendanceData,
        updatedAt: serverTimestamp(),
      };

      // Recalculate counts if records are updated
      if (attendanceData.records) {
        const presentCount = attendanceData.records.filter(r => r.status === "present").length;
        const absentCount = attendanceData.records.filter(r => r.status === "absent").length;
        const lateCount = attendanceData.records.filter(r => r.status === "late").length;
        const totalStudents = attendanceData.records.length;

        updateData.totalStudents = totalStudents;
        updateData.presentCount = presentCount;
        updateData.absentCount = absentCount;
        updateData.lateCount = lateCount;
      }

      const attendanceRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
      await updateDoc(attendanceRef, updateData);
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw new Error("Failed to update attendance record");
    }
  }

  // Delete attendance record
  static async deleteAttendance(attendanceId: string): Promise<void> {
    try {
      const attendanceRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
      await deleteDoc(attendanceRef);
    } catch (error) {
      console.error("Error deleting attendance:", error);
      throw new Error("Failed to delete attendance record");
    }
  }

  // Get attendance records with filters
  static async getAttendanceRecords(filters?: {
    classId?: string;
    facultyId?: string;
    studentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<Attendance[]> {
    try {
      // Start with a simple query to avoid index requirements
      let q = query(collection(db, ATTENDANCE_COLLECTION));
      
      // Add filters one by one, but avoid combining where clauses with orderBy
      if (filters?.classId) {
        q = query(q, where("classId", "==", filters.classId));
      } else if (filters?.facultyId) {
        q = query(q, where("facultyId", "==", filters.facultyId));
      } else {
        // Only add orderBy if we have no where clauses
        q = query(q, orderBy("date", "desc"));
        if (filters?.limit) {
          q = query(q, limit(filters.limit));
        }
      }

      const querySnapshot = await getDocs(q);
      let records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Attendance));

      // Apply additional filters in memory to avoid composite index requirements
      if (filters?.startDate || filters?.endDate) {
        records = records.filter(record => {
          const recordDate = record.date?.toDate ? record.date.toDate() : new Date(record.date as any);
          if (filters.startDate && recordDate < filters.startDate) return false;
          if (filters.endDate && recordDate > filters.endDate) return false;
          return true;
        });
      }

      // Sort in memory if we used where clauses
      if (filters?.classId || filters?.facultyId) {
        records.sort((a, b) => {
          const aDate = a.date?.toDate ? a.date.toDate() : new Date();
          const bDate = b.date?.toDate ? b.date.toDate() : new Date();
          return bDate.getTime() - aDate.getTime();
        });
      }

      // Apply limit in memory if we couldn't do it in the query
      if (filters?.limit && (filters?.classId || filters?.facultyId)) {
        records = records.slice(0, filters.limit);
      }

      // Filter by student ID on client side if needed
      if (filters?.studentId) {
        records = records.filter(record =>
          record.records.some(r => r.studentId === filters.studentId)
        );
      }

      return records;
    } catch (error) {
      console.error("Error getting attendance records:", error);
      throw new Error("Failed to fetch attendance records");
    }
  }

  // Get attendance for a specific class
  static async getClassAttendance(classId: string, limit?: number): Promise<Attendance[]> {
    return this.getAttendanceRecords({ classId, limit });
  }

  // Get attendance records for a faculty member
  static async getFacultyAttendance(facultyId: string, limit?: number): Promise<Attendance[]> {
    return this.getAttendanceRecords({ facultyId, limit });
  }

  // Get student attendance summary for a specific class
  static async getStudentAttendanceForClass(studentId: string, classId: string): Promise<AttendanceStats> {
    try {
      const records = await this.getAttendanceRecords({ classId });
      
      let totalSessions = 0;
      let presentSessions = 0;
      let absentSessions = 0;
      let lateSessions = 0;

      records.forEach(record => {
        const studentRecord = record.records.find(r => r.studentId === studentId);
        if (studentRecord) {
          totalSessions++;
          switch (studentRecord.status) {
            case "present":
              presentSessions++;
              break;
            case "absent":
              absentSessions++;
              break;
            case "late":
              lateSessions++;
              break;
          }
        }
      });

      const attendancePercentage = totalSessions > 0 
        ? Math.round(((presentSessions + lateSessions) / totalSessions) * 100 * 100) / 100
        : 0;

      return {
        totalSessions,
        presentSessions,
        absentSessions,
        lateSessions,
        attendancePercentage,
      };
    } catch (error) {
      console.error("Error getting student attendance for class:", error);
      throw new Error("Failed to fetch student attendance");
    }
  }

  // Get complete student attendance summary across all classes
  static async getStudentAttendanceSummary(studentId: string): Promise<StudentAttendanceSummary[]> {
    try {
      // Get all classes the student is enrolled in
      const classes = await ClassService.getStudentClasses(studentId);
      
      const summaries: StudentAttendanceSummary[] = [];
      
      for (const cls of classes) {
        const stats = await this.getStudentAttendanceForClass(studentId, cls.id);
        
        // Get student details from the first attendance record
        const records = await this.getAttendanceRecords({ classId: cls.id, limit: 1 });
        const studentRecord = records[0]?.records.find(r => r.studentId === studentId);
        
        summaries.push({
          studentId,
          studentName: studentRecord?.studentName || "Unknown",
          classId: cls.id,
          className: cls.name,
          classCode: cls.code,
          stats,
        });
      }
      
      return summaries;
    } catch (error) {
      console.error("Error getting student attendance summary:", error);
      throw new Error("Failed to fetch student attendance summary");
    }
  }

  // Get class attendance summary (all students in a class)
  static async getClassAttendanceSummary(classId: string): Promise<StudentAttendanceSummary[]> {
    try {
      const classData = await ClassService.getClassById(classId);
      if (!classData) {
        throw new Error("Class not found");
      }

      const summaries: StudentAttendanceSummary[] = [];
      
      for (const studentId of classData.students) {
        const stats = await this.getStudentAttendanceForClass(studentId, classId);
        
        // Get student name from attendance records
        const records = await this.getAttendanceRecords({ classId, limit: 1 });
        const studentRecord = records[0]?.records.find(r => r.studentId === studentId);
        
        summaries.push({
          studentId,
          studentName: studentRecord?.studentName || "Unknown",
          classId,
          className: classData.name,
          classCode: classData.code,
          stats,
        });
      }
      
      // Sort by attendance percentage (lowest first for attention)
      return summaries.sort((a, b) => a.stats.attendancePercentage - b.stats.attendancePercentage);
    } catch (error) {
      console.error("Error getting class attendance summary:", error);
      throw new Error("Failed to fetch class attendance summary");
    }
  }

  // Get attendance statistics
  static async getAttendanceStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    classId?: string;
    facultyId?: string;
  }): Promise<{
    totalSessions: number;
    totalStudentSessions: number;
    averageAttendance: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
  }> {
    try {
      const records = await this.getAttendanceRecords(filters);
      
      let totalSessions = records.length;
      let totalStudentSessions = 0;
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;

      records.forEach(record => {
        totalStudentSessions += record.totalStudents;
        presentCount += record.presentCount;
        absentCount += record.absentCount;
        lateCount += record.lateCount;
      });

      const averageAttendance = totalStudentSessions > 0 
        ? Math.round(((presentCount + lateCount) / totalStudentSessions) * 100 * 100) / 100
        : 0;

      return {
        totalSessions,
        totalStudentSessions,
        averageAttendance,
        presentCount,
        absentCount,
        lateCount,
      };
    } catch (error) {
      console.error("Error getting attendance stats:", error);
      throw new Error("Failed to fetch attendance statistics");
    }
  }

  // Check if attendance exists for a specific date and class
  static async checkAttendanceExists(classId: string, date: Date): Promise<boolean> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where("classId", "==", classId),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay)),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking attendance exists:", error);
      return false;
    }
  }

  // Get recent attendance activity
  static async getRecentActivity(limit: number = 10): Promise<Attendance[]> {
    return this.getAttendanceRecords({ limit });
  }

  // Mark individual student attendance
  static async markStudentAttendance(
    attendanceId: string,
    studentId: string,
    status: AttendanceStatus,
    remarks?: string
  ): Promise<void> {
    try {
      const attendance = await this.getAttendanceById(attendanceId);
      if (!attendance) {
        throw new Error("Attendance record not found");
      }

      // Update the specific student's record
      const updatedRecords = attendance.records.map(record => {
        if (record.studentId === studentId) {
          return { ...record, status, remarks };
        }
        return record;
      });

      await this.updateAttendance(attendanceId, { records: updatedRecords });
    } catch (error) {
      console.error("Error marking student attendance:", error);
      throw new Error("Failed to mark student attendance");
    }
  }
}