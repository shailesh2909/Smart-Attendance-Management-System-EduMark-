"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ClassService } from "@/services/classService";
import { AttendanceService } from "@/services/attendanceService";
import { Class } from "@/models/Class";
import { Attendance } from "@/models/Attendance";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface StudentAttendanceRecord {
  attendance: Attendance;
  studentStatus: "present" | "absent" | "late";
  remarks?: string;
}

export default function StudentAttendancePage() {
  const { user, userProfile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    presentSessions: 0,
    absentSessions: 0,
    lateSessions: 0,
    attendancePercentage: 0
  });

  useEffect(() => {
    if (user && userProfile) {
      loadStudentClasses();
    }
  }, [user, userProfile]);

  const loadStudentClasses = async () => {
    if (!user || !userProfile) return;

    try {
      setLoading(true);
      
      // Get classes based on student's division/batch
      const allClasses = await ClassService.getClasses({ isActive: true });
      const studentClasses = allClasses.filter(cls => {
        if (cls.type === 'class' && cls.division) {
          return userProfile.division === cls.division;
        } else if (cls.type === 'lab' && cls.batch) {
          return userProfile.batch === cls.batch;
        }
        return false;
      });

      setClasses(studentClasses);
      
      if (studentClasses.length > 0) {
        await handleClassSelect(studentClasses[0]);
      }
    } catch (error) {
      console.error("Error loading student classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = async (classData: Class) => {
    try {
      setLoading(true);
      setSelectedClass(classData);

      // Get all attendance records for this class
      const classAttendance = await AttendanceService.getAttendanceRecords({
        classId: classData.id!
      });

      // Filter records where this student was present/absent/late
      const studentRecords: StudentAttendanceRecord[] = [];
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;

      classAttendance.forEach(attendance => {
        const studentRecord = attendance.records.find(r => r.studentId === user!.uid);
        if (studentRecord) {
          studentRecords.push({
            attendance,
            studentStatus: studentRecord.status,
            remarks: studentRecord.remarks
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

      // Sort by date (newest first)
      studentRecords.sort((a, b) => {
        const dateA = a.attendance.date?.toDate ? a.attendance.date.toDate() : new Date(a.attendance.date as any);
        const dateB = b.attendance.date?.toDate ? b.attendance.date.toDate() : new Date(b.attendance.date as any);
        return dateB.getTime() - dateA.getTime();
      });

      setAttendanceRecords(studentRecords);

      const totalSessions = studentRecords.length;
      const attendedSessions = presentCount + lateCount; // Count late as attended
      const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      setStats({
        totalSessions,
        presentSessions: presentCount,
        absentSessions: absentCount,
        lateSessions: lateCount,
        attendancePercentage
      });

    } catch (error) {
      console.error("Error loading attendance records:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: any) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return '✅';
      case 'absent':
        return '❌';
      case 'late':
        return '⏰';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'absent':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'late':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  if (loading && !selectedClass) {
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
            📊 My Attendance
          </h1>
          <p className="text-gray-400 text-lg">
            Track your attendance across all classes and labs
          </p>
        </div>

        {/* Class Selector */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Select Class/Lab</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                onClick={() => handleClassSelect(classItem)}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedClass?.id === classItem.id
                    ? classItem.type === 'lab'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-600/50 bg-gray-800/30 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{classItem.type === 'lab' ? '🔬' : '📚'}</span>
                  <div>
                    <h3 className="text-white font-semibold">{classItem.name}</h3>
                    <p className="text-gray-400 text-sm">{classItem.code}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedClass && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Total Sessions</p>
                    <p className="text-white text-2xl font-bold">{stats.totalSessions}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-green-300 text-sm font-medium">Present</p>
                    <p className="text-white text-2xl font-bold">{stats.presentSessions}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className="text-yellow-300 text-sm font-medium">Late</p>
                    <p className="text-white text-2xl font-bold">{stats.lateSessions}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="text-red-300 text-sm font-medium">Absent</p>
                    <p className="text-white text-2xl font-bold">{stats.absentSessions}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="text-purple-300 text-sm font-medium">Percentage</p>
                    <p className="text-white text-2xl font-bold">{stats.attendancePercentage}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Records */}
            <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-600/30 overflow-hidden">
              <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
                <h3 className="text-xl font-semibold text-white">
                  Attendance History - {selectedClass.name}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedClass.code} • {selectedClass.type === 'lab' ? `Batch ${selectedClass.batch}` : `Division ${selectedClass.division}`}
                </p>
              </div>
              
              {attendanceRecords.length > 0 ? (
                <div className="divide-y divide-gray-700/30">
                  {attendanceRecords.map((record, index) => (
                    <div key={record.attendance.id} className="p-6 hover:bg-gray-800/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{getStatusIcon(record.studentStatus)}</div>
                          <div>
                            <h4 className="text-white font-semibold">
                              Session {record.attendance.sessionNumber}: {record.attendance.topic}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {formatDate(record.attendance.date)} • {formatTime(record.attendance.date)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Duration: {record.attendance.duration} minutes
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(record.studentStatus)}`}>
                            {record.studentStatus.charAt(0).toUpperCase() + record.studentStatus.slice(1)}
                          </div>
                          {record.remarks && (
                            <p className="text-gray-400 text-sm mt-1 max-w-xs">
                              Note: {record.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Attendance Records</h3>
                  <p className="text-gray-400">No sessions have been conducted for this class yet.</p>
                </div>
              )}
            </div>

            {/* Attendance Tips */}
            <div className="mt-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">📝 Attendance Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <p className="mb-2">✅ <strong>Present:</strong> You attended the full session</p>
                  <p className="mb-2">⏰ <strong>Late:</strong> You arrived after the session started</p>
                </div>
                <div>
                  <p className="mb-2">❌ <strong>Absent:</strong> You missed the session</p>
                  <p className="mb-2">🎯 <strong>Target:</strong> Maintain at least 75% attendance</p>
                </div>
              </div>
            </div>
          </>
        )}

        {classes.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Classes Found</h3>
            <p className="text-gray-400">You are not enrolled in any active classes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

