import { Timestamp } from "firebase/firestore";
import {
  ClassReport,
  StudentReport,
  FacultyReport,
  AdminReport,
  ReportFilters,
} from "@/models/Report";
import { AttendanceService } from "./attendanceService";
import { ClassService } from "./classService";
import { UserService } from "./userService";

export class ReportService {
  // Generate class attendance report
  static async generateClassReport(
    classId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ClassReport> {
    try {
      // Set default date range (current semester - last 4 months)
      const defaultEndDate = endDate || new Date();
      const defaultStartDate = startDate || new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000);

      // Get class details
      const classData = await ClassService.getClassById(classId);
      if (!classData) {
        throw new Error("Class not found");
      }

      // Get attendance records for the period
      const attendanceRecords = await AttendanceService.getAttendanceRecords({
        classId,
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      });

      // Get student summaries
      const studentSummaries = await AttendanceService.getClassAttendanceSummary(classId);

      // Calculate average attendance
      const totalStudentSessions = attendanceRecords.reduce(
        (sum, record) => sum + record.totalStudents,
        0
      );
      const totalPresentSessions = attendanceRecords.reduce(
        (sum, record) => sum + (record.presentCount + record.lateCount),
        0
      );
      const averageAttendance = totalStudentSessions > 0 
        ? Math.round((totalPresentSessions / totalStudentSessions) * 100 * 100) / 100
        : 0;

      return {
        classId,
        className: classData.name,
        classCode: classData.code,
        facultyId: classData.facultyId,
        facultyName: classData.facultyName,
        totalStudents: classData.students.length,
        totalSessions: attendanceRecords.length,
        averageAttendance,
        studentSummaries,
        generatedAt: Timestamp.now(),
        reportPeriod: {
          startDate: Timestamp.fromDate(defaultStartDate),
          endDate: Timestamp.fromDate(defaultEndDate),
        },
      };
    } catch (error) {
      console.error("Error generating class report:", error);
      throw new Error("Failed to generate class report");
    }
  }

  // Generate student attendance report
  static async generateStudentReport(
    studentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<StudentReport> {
    try {
      // Set default date range
      const defaultEndDate = endDate || new Date();
      const defaultStartDate = startDate || new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000);

      // Get student details
      const student = await UserService.getUserById(studentId);
      if (!student || student.role !== "student") {
        throw new Error("Student not found");
      }

      // Get student's attendance summary
      const attendanceSummary = await AttendanceService.getStudentAttendanceSummary(studentId);

      // Filter by date range if needed
      const classSummaries = await Promise.all(
        attendanceSummary.map(async (summary) => {
          // Get class details
          const classData = await ClassService.getClassById(summary.classId);
          return {
            classId: summary.classId,
            className: summary.className,
            classCode: summary.classCode,
            facultyName: classData?.facultyName || "Unknown",
            stats: summary.stats,
          };
        })
      );

      // Calculate overall attendance
      const totalSessions = classSummaries.reduce((sum, cls) => sum + cls.stats.totalSessions, 0);
      const totalPresent = classSummaries.reduce(
        (sum, cls) => sum + cls.stats.presentSessions + cls.stats.lateSessions,
        0
      );
      const overallAttendance = totalSessions > 0 
        ? Math.round((totalPresent / totalSessions) * 100 * 100) / 100
        : 0;

      return {
        studentId,
        studentName: student.name,
        department: student.department || "Unknown",
        year: student.year || "Unknown",
        overallAttendance,
        classSummaries,
        generatedAt: Timestamp.now(),
        reportPeriod: {
          startDate: Timestamp.fromDate(defaultStartDate),
          endDate: Timestamp.fromDate(defaultEndDate),
        },
      };
    } catch (error) {
      console.error("Error generating student report:", error);
      throw new Error("Failed to generate student report");
    }
  }

  // Generate faculty attendance report
  static async generateFacultyReport(
    facultyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FacultyReport> {
    try {
      // Set default date range
      const defaultEndDate = endDate || new Date();
      const defaultStartDate = startDate || new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000);

      // Get faculty details
      const faculty = await UserService.getUserById(facultyId);
      if (!faculty || faculty.role !== "faculty") {
        throw new Error("Faculty not found");
      }

      // Get faculty's classes
      const facultyClasses = await ClassService.getFacultyClasses(facultyId);

      // Generate summaries for each class
      const classSummaries = await Promise.all(
        facultyClasses.map(async (classData) => {
          const attendanceRecords = await AttendanceService.getAttendanceRecords({
            classId: classData.id,
            startDate: defaultStartDate,
            endDate: defaultEndDate,
          });

          const totalStudentSessions = attendanceRecords.reduce(
            (sum, record) => sum + record.totalStudents,
            0
          );
          const totalPresentSessions = attendanceRecords.reduce(
            (sum, record) => sum + (record.presentCount + record.lateCount),
            0
          );
          const averageAttendance = totalStudentSessions > 0 
            ? Math.round((totalPresentSessions / totalStudentSessions) * 100 * 100) / 100
            : 0;

          return {
            classId: classData.id,
            className: classData.name,
            classCode: classData.code,
            totalStudents: classData.students.length,
            totalSessions: attendanceRecords.length,
            averageAttendance,
          };
        })
      );

      const totalSessions = classSummaries.reduce((sum, cls) => sum + cls.totalSessions, 0);

      return {
        facultyId,
        facultyName: faculty.name,
        totalClasses: facultyClasses.length,
        totalSessions,
        classSummaries,
        generatedAt: Timestamp.now(),
        reportPeriod: {
          startDate: Timestamp.fromDate(defaultStartDate),
          endDate: Timestamp.fromDate(defaultEndDate),
        },
      };
    } catch (error) {
      console.error("Error generating faculty report:", error);
      throw new Error("Failed to generate faculty report");
    }
  }

  // Generate admin overview report
  static async generateAdminReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<AdminReport> {
    try {
      // Set default date range
      const defaultEndDate = endDate || new Date();
      const defaultStartDate = startDate || new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000);

      // Get overall statistics
      const [userStats, classStats, attendanceStats] = await Promise.all([
        UserService.getUserStats(),
        ClassService.getClassStats(),
        AttendanceService.getAttendanceStats({
          startDate: defaultStartDate,
          endDate: defaultEndDate,
        }),
      ]);

      // Get department statistics
      const allStudents = await UserService.getUsersByRole("student");
      const departments = [...new Set(allStudents.map(s => s.department).filter(Boolean))] as string[];
      
      const departmentStats = await Promise.all(
        departments.map(async (department) => {
          const deptStudents = allStudents.filter(s => s.department === department);
          const deptClasses = await ClassService.getClasses({ department });
          
          // Calculate average attendance for department
          let totalAttendance = 0;
          let classCount = 0;
          
          for (const cls of deptClasses) {
            const deptAttendanceStats = await AttendanceService.getAttendanceStats({
              classId: cls.id,
              startDate: defaultStartDate,
              endDate: defaultEndDate,
            });
            if (deptAttendanceStats.totalStudentSessions > 0) {
              totalAttendance += deptAttendanceStats.averageAttendance;
              classCount++;
            }
          }
          
          const averageAttendance = classCount > 0 ? totalAttendance / classCount : 0;

          return {
            department,
            totalStudents: deptStudents.length,
            totalClasses: deptClasses.length,
            averageAttendance: Math.round(averageAttendance * 100) / 100,
          };
        })
      );

      // Generate monthly statistics (last 6 months)
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthStats = await AttendanceService.getAttendanceStats({
          startDate: monthStart,
          endDate: monthEnd,
        });

        monthlyStats.push({
          month: monthStart.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
          totalSessions: monthStats.totalSessions,
          averageAttendance: monthStats.averageAttendance,
        });
      }

      return {
        totalStudents: userStats.totalStudents,
        totalFaculty: userStats.totalFaculty,
        totalClasses: classStats.activeClasses,
        totalSessions: attendanceStats.totalSessions,
        overallAttendance: attendanceStats.averageAttendance,
        departmentStats,
        monthlyStats,
        generatedAt: Timestamp.now(),
        reportPeriod: {
          startDate: Timestamp.fromDate(defaultStartDate),
          endDate: Timestamp.fromDate(defaultEndDate),
        },
      };
    } catch (error) {
      console.error("Error generating admin report:", error);
      throw new Error("Failed to generate admin report");
    }
  }

  // Get low attendance students (below threshold)
  static async getLowAttendanceStudents(
    threshold: number = 75,
    classId?: string
  ): Promise<{
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    attendancePercentage: number;
  }[]> {
    try {
      let classes: string[] = [];
      
      if (classId) {
        classes = [classId];
      } else {
        const allClasses = await ClassService.getClasses({ isActive: true });
        classes = allClasses.map(cls => cls.id);
      }

      const lowAttendanceStudents = [];

      for (const clsId of classes) {
        const classSummary = await AttendanceService.getClassAttendanceSummary(clsId);
        const lowAttendanceInClass = classSummary
          .filter(summary => summary.stats.attendancePercentage < threshold)
          .map(summary => ({
            studentId: summary.studentId,
            studentName: summary.studentName,
            classId: summary.classId,
            className: summary.className,
            attendancePercentage: summary.stats.attendancePercentage,
          }));
        
        lowAttendanceStudents.push(...lowAttendanceInClass);
      }

      // Sort by attendance percentage (lowest first)
      return lowAttendanceStudents.sort((a, b) => a.attendancePercentage - b.attendancePercentage);
    } catch (error) {
      console.error("Error getting low attendance students:", error);
      throw new Error("Failed to fetch low attendance students");
    }
  }

  // Export report data (for CSV/PDF generation)
  static async exportClassReport(classId: string): Promise<any[]> {
    try {
      const report = await this.generateClassReport(classId);
      
      return report.studentSummaries.map(student => ({
        "Student Name": student.studentName,
        "Total Sessions": student.stats.totalSessions,
        "Present": student.stats.presentSessions,
        "Absent": student.stats.absentSessions,
        "Late": student.stats.lateSessions,
        "Attendance %": student.stats.attendancePercentage,
      }));
    } catch (error) {
      console.error("Error exporting class report:", error);
      throw new Error("Failed to export class report");
    }
  }

  // Get attendance trends (weekly/monthly)
  static async getAttendanceTrends(
    period: "weekly" | "monthly" = "weekly",
    classId?: string,
    facultyId?: string
  ): Promise<{
    period: string;
    totalSessions: number;
    averageAttendance: number;
  }[]> {
    try {
      const trends = [];
      const periodsToCheck = period === "weekly" ? 12 : 6; // 12 weeks or 6 months
      
      for (let i = periodsToCheck - 1; i >= 0; i--) {
        const endDate = new Date();
        const startDate = new Date();
        
        if (period === "weekly") {
          startDate.setDate(endDate.getDate() - (i + 1) * 7);
          endDate.setDate(endDate.getDate() - i * 7);
        } else {
          startDate.setMonth(endDate.getMonth() - (i + 1));
          startDate.setDate(1);
          endDate.setMonth(endDate.getMonth() - i);
          endDate.setDate(0);
        }

        const stats = await AttendanceService.getAttendanceStats({
          startDate,
          endDate,
          classId,
          facultyId,
        });

        const periodLabel = period === "weekly" 
          ? `Week of ${startDate.toLocaleDateString()}`
          : startDate.toLocaleDateString("en-US", { year: "numeric", month: "short" });

        trends.push({
          period: periodLabel,
          totalSessions: stats.totalSessions,
          averageAttendance: stats.averageAttendance,
        });
      }

      return trends;
    } catch (error) {
      console.error("Error getting attendance trends:", error);
      throw new Error("Failed to fetch attendance trends");
    }
  }
}