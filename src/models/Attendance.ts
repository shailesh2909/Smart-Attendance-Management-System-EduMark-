import { Timestamp } from "firebase/firestore";

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface Attendance {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  facultyId: string;
  facultyName: string;
  date: Timestamp;
  sessionNumber: number;
  topic: string;
  duration: number; // in minutes
  records: AttendanceRecord[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  isFinalized: boolean; // Prevents changes after final submission
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateAttendanceData {
  classId: string;
  className: string;
  classCode: string;
  facultyId: string;
  facultyName: string;
  date: Timestamp;
  sessionNumber: number;
  topic: string;
  duration: number;
  records: AttendanceRecord[];
}

export interface UpdateAttendanceData {
  topic?: string;
  duration?: number;
  records?: AttendanceRecord[];
}

export interface AttendanceStats {
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  lateSessions: number;
  attendancePercentage: number;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  classCode: string;
  stats: AttendanceStats;
}