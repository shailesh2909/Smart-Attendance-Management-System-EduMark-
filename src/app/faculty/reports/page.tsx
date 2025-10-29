"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ClassService } from "@/services/classService";
import { AttendanceService } from "@/services/attendanceService";
import { UserService } from "@/services/userService";
import { Class } from "@/models/Class";
import { Attendance } from "@/models/Attendance";
import { User } from "@/models/User";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface StudentAttendanceReport {
  student: User;
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  lateSessions: number;
  attendancePercentage: number;
  sessionsData: Array<{
    sessionNumber: number;
    date: Date;
    topic: string;
    status: "present" | "absent" | "late";
    remarks?: string;
  }>;
}

interface ClassReport {
  class: Class;
  subject: string;
  divisionOrBatch: string;
  totalClasses: number; // Number of different class instances for this subject
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number;
  studentReports: StudentAttendanceReport[];
  sessionsOverview: Array<{
    sessionNumber: number;
    date: Date;
    topic: string;
    duration: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
  }>;
}

export default function FacultyReportsPage() {
  const { user, userProfile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classReport, setClassReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    if (user) {
      loadFacultyClasses();
    }
  }, [user]);

  const loadFacultyClasses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const facultyClasses = await ClassService.getClasses({
        facultyId: user.uid,
        isActive: true
      });
      setClasses(facultyClasses);
      
      if (facultyClasses.length > 0) {
        setSelectedClass(facultyClasses[0]);
        await generateClassReport(facultyClasses[0]);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateClassReport = async (classData: Class) => {
    if (!classData.id) return;
    
    try {
      setGeneratingReport(true);
      
      // Get all classes taught by this faculty for the same subject and division/batch
      // If there's only one class, just use that class
      let allFacultyClasses = classes.filter(c => 
        c.subject === classData.subject && 
        c.type === classData.type &&
        ((classData.type === 'class' && c.division === classData.division) ||
         (classData.type === 'lab' && c.batch === classData.batch))
      );

      // If no matching classes found (which shouldn't happen), fall back to just the current class
      if (allFacultyClasses.length === 0) {
        allFacultyClasses = [classData];
      }

      console.log(`Found ${allFacultyClasses.length} matching classes for subject "${classData.subject}":`, 
        allFacultyClasses.map(c => ({ name: c.name, id: c.id, subject: c.subject })));

      // Get attendance records for all matching classes
      let allAttendanceRecords: Attendance[] = [];
      for (const cls of allFacultyClasses) {
        if (cls.id) {
          try {
            const records = await AttendanceService.getAttendanceRecords({
              classId: cls.id
            });
            console.log(`Records for class ${cls.name} (${cls.id}):`, records.length, 'records');
            allAttendanceRecords.push(...records);
          } catch (error) {
            console.error(`Error fetching records for class ${cls.name}:`, error);
          }
        }
      }

      console.log(`Total attendance records found: ${allAttendanceRecords.length}`);
      console.log('All records:', allAttendanceRecords);

      // Filter by date range if specified
      let filteredRecords = allAttendanceRecords;
      if (dateRange.startDate || dateRange.endDate) {
        filteredRecords = allAttendanceRecords.filter(record => {
          const recordDate = record.date?.toDate ? record.date.toDate() : new Date(record.date as any);
          const start = dateRange.startDate ? new Date(dateRange.startDate) : new Date('1900-01-01');
          const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date('2100-12-31');
          return recordDate >= start && recordDate <= end;
        });
      }

      // Get students for this class
      let classStudents: User[] = [];
      if (classData.type === 'class' && classData.division) {
        const allStudents = await UserService.getUsers({ role: 'student', approved: true });
        classStudents = allStudents.filter(s => s.division === classData.division);
      } else if (classData.type === 'lab' && classData.batch) {
        const allStudents = await UserService.getUsers({ role: 'student', approved: true });
        classStudents = allStudents.filter(s => s.batch === classData.batch);
      }

      // Generate student reports
      const studentReports: StudentAttendanceReport[] = classStudents.map(student => {
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        const sessionsData: StudentAttendanceReport['sessionsData'] = [];

        // Create sessions data with proper sorting and numbering
        const tempSessionsData: Array<{
          date: Date;
          topic: string;
          status: "present" | "absent" | "late";
          remarks?: string;
          originalDate: number;
        }> = [];

        filteredRecords.forEach(record => {
          const studentRecord = record.records.find(r => r.studentId === student.uid);
          if (studentRecord) {
            const sessionDate = record.date?.toDate ? record.date.toDate() : new Date(record.date as any);
            tempSessionsData.push({
              date: sessionDate,
              topic: record.topic,
              status: studentRecord.status,
              remarks: studentRecord.remarks,
              originalDate: sessionDate.getTime()
            });

            switch (studentRecord.status) {
              case 'present':
                presentCount++;
                break;
              case 'absent':
                absentCount++;
                break;
              case 'late':
                lateCount++;
                break;
            }
          }
        });

        const totalSessions = filteredRecords.length;
        const attendedSessions = presentCount + lateCount;
        const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

        // Debug log for first student
        if (student.name === 'Student 58') {
          console.log(`Debug for ${student.name}:`, {
            totalFilteredRecords: filteredRecords.length,
            tempSessionsDataLength: tempSessionsData.length,
            presentCount,
            lateCount,
            absentCount,
            totalSessions,
            attendancePercentage
          });
        }

        // Sort sessions by actual date and renumber sequentially
        tempSessionsData.sort((a, b) => a.originalDate - b.originalDate);
        tempSessionsData.forEach((session, index) => {
          sessionsData.push({
            sessionNumber: index + 1,
            date: session.date,
            topic: session.topic,
            status: session.status,
            remarks: session.remarks
          });
        });

        return {
          student,
          totalSessions,
          presentSessions: presentCount,
          absentSessions: absentCount,
          lateSessions: lateCount,
          attendancePercentage,
          sessionsData
        };
      });

      // Generate sessions overview with proper numbering across all classes
      const sessionsOverview = filteredRecords
        .map(record => {
          const recordDate = record.date?.toDate ? record.date.toDate() : new Date(record.date as any);
          const attendancePercentage = record.totalStudents > 0 ? 
            Math.round(((record.presentCount + record.lateCount) / record.totalStudents) * 100) : 0;

          return {
            sessionNumber: record.sessionNumber,
            date: recordDate,
            topic: record.topic,
            duration: record.duration,
            presentCount: record.presentCount,
            absentCount: record.absentCount,
            lateCount: record.lateCount,
            attendancePercentage,
            originalDate: recordDate.getTime() // For sorting by actual date
          };
        })
        .sort((a, b) => a.originalDate - b.originalDate) // Sort by actual date
        .map((session, index) => ({
          ...session,
          sessionNumber: index + 1 // Renumber sessions sequentially
        }));

      // Calculate overall statistics
      const totalSessions = filteredRecords.length;
      const totalStudents = classStudents.length;
      let totalAttendancePoints = 0;
      studentReports.forEach(report => {
        totalAttendancePoints += report.attendancePercentage;
      });
      const averageAttendance = totalStudents > 0 ? Math.round(totalAttendancePoints / totalStudents) : 0;

      const report: ClassReport = {
        class: classData,
        subject: classData.subject,
        divisionOrBatch: classData.type === 'class' ? `Division ${classData.division}` : `Batch ${classData.batch}`,
        totalClasses: allFacultyClasses.length,
        totalSessions,
        totalStudents,
        averageAttendance,
        studentReports,
        sessionsOverview
      };

      setClassReport(report);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleClassChange = async (classData: Class) => {
    setSelectedClass(classData);
    await generateClassReport(classData);
  };

  const handleDateRangeChange = async () => {
    if (selectedClass) {
      await generateClassReport(selectedClass);
    }
  };

  const exportToCSV = () => {
    if (!classReport) return;

    const csvData = [];
    
    // Add header information
    csvData.push([`Subject: ${classReport.subject}`]);
    csvData.push([`${classReport.class.type === 'class' ? 'Division' : 'Batch'}: ${classReport.divisionOrBatch}`]);
    if (classReport.totalClasses > 1) {
      csvData.push([`Combined Data from ${classReport.totalClasses} different class instances`]);
    }
    csvData.push([`Total Sessions: ${classReport.totalSessions}`]);
    csvData.push([`Average Attendance: ${classReport.averageAttendance}%`]);
    csvData.push([`Report Generated: ${new Date().toLocaleDateString()}`]);
    csvData.push([]); // Empty row separator
    
    csvData.push([
      'Student Name',
      'Student ID',
      'Roll No',
      'Total Sessions',
      'Present',
      'Late', 
      'Absent',
      'Attendance %'
    ]);

    classReport.studentReports.forEach(report => {
      csvData.push([
        report.student.name,
        report.student.studentId || '',
        report.student.rollNo || '',
        report.totalSessions.toString(),
        report.presentSessions.toString(),
        report.lateSessions.toString(),
        report.absentSessions.toString(),
        `${report.attendancePercentage}%`
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classReport.subject}_${classReport.divisionOrBatch}_aggregated_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-400';
    if (percentage >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0118] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-96">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0118] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            📊 Attendance Reports
          </h1>
          <p className="text-gray-400 text-lg">
            Generate detailed attendance reports for your classes and labs
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-600/30 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Class Selection */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Select Class/Lab</label>
              <select
                value={selectedClass?.id || ""}
                onChange={(e) => {
                  const classData = classes.find(c => c.id === e.target.value);
                  if (classData) handleClassChange(classData);
                }}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              />
            </div>

            <div className="flex flex-col justify-end space-y-2">
              <button
                onClick={handleDateRangeChange}
                disabled={generatingReport}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                {generatingReport ? 'Generating...' : '🔄 Refresh'}
              </button>
              {classReport && (
                <button
                  onClick={exportToCSV}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  📥 Export CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {generatingReport ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : classReport ? (
          <div className="space-y-8">
            {/* Report Summary */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* New Aggregation Info Card */}
              {classReport.totalClasses > 1 && (
                <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔗</span>
                    <div>
                      <p className="text-cyan-300 text-sm font-medium">Combined Classes</p>
                      <p className="text-white text-2xl font-bold">{classReport.totalClasses}</p>
                      <p className="text-cyan-200 text-xs">for {classReport.subject}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Total Sessions</p>
                    <p className="text-white text-2xl font-bold">{classReport.totalSessions}</p>
                    {classReport.totalClasses > 1 && (
                      <p className="text-blue-200 text-xs">across {classReport.totalClasses} classes</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="text-purple-300 text-sm font-medium">Total Students</p>
                    <p className="text-white text-2xl font-bold">{classReport.totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="text-green-300 text-sm font-medium">Average Attendance</p>
                    <p className="text-white text-2xl font-bold">{classReport.averageAttendance}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-orange-300 text-sm font-medium">Above 75%</p>
                    <p className="text-white text-2xl font-bold">
                      {classReport.studentReports.filter(r => r.attendancePercentage >= 75).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Class Information */}
            <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-600/30 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                📊 Aggregated Subject Report
                {classReport.totalClasses > 1 && (
                  <span className="ml-2 text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                    {classReport.totalClasses} Classes Combined
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Subject:</span>
                  <p className="text-white font-medium">{classReport.subject}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Course Code:</span>
                  <p className="text-white font-medium">{classReport.class.code}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">{classReport.class.type === 'lab' ? 'Batch:' : 'Division:'}</span>
                  <p className="text-white font-medium">{classReport.divisionOrBatch}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Total Sessions:</span>
                  <p className="text-white font-medium text-lg">
                    {classReport.totalSessions}
                    {classReport.totalClasses > 1 && (
                      <span className="text-sm text-green-400 block">from {classReport.totalClasses} different classes</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Student-wise Report */}
            <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-600/30 overflow-hidden">
              <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
                <h3 className="text-xl font-semibold text-white">Student-wise Attendance Report</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/30">
                    <tr>
                      <th className="text-left px-6 py-4 text-white font-semibold">Student</th>
                      <th className="text-center px-6 py-4 text-white font-semibold">Total Sessions</th>
                      <th className="text-center px-6 py-4 text-white font-semibold">Present</th>
                      <th className="text-center px-6 py-4 text-white font-semibold">Late</th>
                      <th className="text-center px-6 py-4 text-white font-semibold">Absent</th>
                      <th className="text-center px-6 py-4 text-white font-semibold">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classReport.studentReports
                      .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
                      .map((report, index) => (
                      <tr key={report.student.uid} className="border-t border-gray-700/30 hover:bg-gray-800/20">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">{report.student.name}</p>
                              <p className="text-gray-400 text-sm">{report.student.studentId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-6 py-4 text-white">{report.totalSessions}</td>
                        <td className="text-center px-6 py-4 text-green-400">{report.presentSessions}</td>
                        <td className="text-center px-6 py-4 text-yellow-400">{report.lateSessions}</td>
                        <td className="text-center px-6 py-4 text-red-400">{report.absentSessions}</td>
                        <td className="text-center px-6 py-4">
                          <span className={`font-bold ${getAttendanceColor(report.attendancePercentage)}`}>
                            {report.attendancePercentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sessions Overview */}
            <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-600/30 overflow-hidden">
              <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
                <h3 className="text-xl font-semibold text-white">Sessions Overview</h3>
              </div>
              
              <div className="divide-y divide-gray-700/30">
                {classReport.sessionsOverview.map((session) => (
                  <div key={session.sessionNumber} className="p-6 hover:bg-gray-800/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold">
                          Session {session.sessionNumber}: {session.topic}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {formatDate(session.date)} • {session.duration} minutes
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getAttendanceColor(session.attendancePercentage)}`}>
                          {session.attendancePercentage}%
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <span className="text-green-400">✅ {session.presentCount}</span>
                          <span className="text-yellow-400">⏰ {session.lateCount}</span>
                          <span className="text-red-400">❌ {session.absentCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
            <p className="text-gray-400">Select a class and date range to generate reports.</p>
          </div>
        )}

        {classes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Classes Assigned</h3>
            <p className="text-gray-400">You don't have any classes assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
