import { Timestamp } from "firebase/firestore";
import { AttendanceStats, StudentAttendanceSummary } from "./Attendance";

export interface ClassReport {
  classId: string;
  className: string;
  classCode: string;
  facultyId: string;
  facultyName: string;
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  studentSummaries: StudentAttendanceSummary[];
  generatedAt: Timestamp;
  reportPeriod: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
}

export interface StudentReport {
  studentId: string;
  studentName: string;
  department: string;
  year: string;
  overallAttendance: number;
  classSummaries: {
    classId: string;
    className: string;
    classCode: string;
    facultyName: string;
    stats: AttendanceStats;
  }[];
  generatedAt: Timestamp;
  reportPeriod: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
}

export interface FacultyReport {
  facultyId: string;
  facultyName: string;
  totalClasses: number;
  totalSessions: number;
  classSummaries: {
    classId: string;
    className: string;
    classCode: string;
    totalStudents: number;
    totalSessions: number;
    averageAttendance: number;
  }[];
  generatedAt: Timestamp;
  reportPeriod: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
}

export interface AdminReport {
  totalStudents: number;
  totalFaculty: number;
  totalClasses: number;
  totalSessions: number;
  overallAttendance: number;
  departmentStats: {
    department: string;
    totalStudents: number;
    totalClasses: number;
    averageAttendance: number;
  }[];
  monthlyStats: {
    month: string;
    totalSessions: number;
    averageAttendance: number;
  }[];
  generatedAt: Timestamp;
  reportPeriod: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  year?: string;
  classId?: string;
  studentId?: string;
  facultyId?: string;
}