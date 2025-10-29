'use client';

import { useState, useEffect } from 'react';
import { ClassService } from '@/services/classService';
import { AttendanceService } from '@/services/attendanceService';
import { UserService } from '@/services/userService';
import { Class } from '@/models/Class';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ClassAttendanceStats {
  class: Class;
  totalSessions: number;
  lastSessionDate?: Date;
  totalStudents: number;
  averageAttendance: number;
  faculty?: User;
  recentSessions: Attendance[];
}

const AttendanceOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [classStats, setClassStats] = useState<ClassAttendanceStats[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalClasses: 0,
    totalSessions: 0,
    totalStudents: 0,
    averageAttendance: 0,
    classesWithSessions: 0,
    sessionsToday: 0
  });

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Get all active classes
      const classes = await ClassService.getClasses({ isActive: true });
      
      // Get all faculty
      const facultyData = await UserService.getUsers({ role: 'faculty', approved: true });
      setFaculty(facultyData);

      // Process each class to get attendance statistics
      const classStatsPromises = classes.map(async (cls) => {
        // Get attendance records for this class
        const attendanceRecords = await AttendanceService.getAttendanceRecords({
          classId: cls.id!
        });

        // Get recent sessions (last 3)
        const recentSessions = attendanceRecords
          .sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date as any);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date as any);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 3);

        // Calculate average attendance
        let totalPresent = 0;
        let totalPossible = 0;
        
        attendanceRecords.forEach(record => {
          totalPresent += record.presentCount + record.lateCount; // Count late as present
          totalPossible += record.totalStudents;
        });

        const averageAttendance = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

        // Get last session date
        const lastSessionDate = attendanceRecords.length > 0 
          ? (attendanceRecords[0].date?.toDate ? attendanceRecords[0].date.toDate() : new Date(attendanceRecords[0].date as any))
          : undefined;

        // Find assigned faculty
        const assignedFaculty = facultyData.find(f => f.uid === cls.facultyId);

        // Get total students (from division/batch)
        let totalStudents = 0;
        try {
          if (cls.type === 'class' && cls.division) {
            const allStudents = await UserService.getUsers({
              role: 'student',
              approved: true
            });
            const divisionStudents = allStudents.filter(s => s.division === cls.division);
            totalStudents = divisionStudents.length;
          } else if (cls.type === 'lab' && cls.batch) {
            const allStudents = await UserService.getUsers({
              role: 'student',
              approved: true
            });
            const batchStudents = allStudents.filter(s => s.batch === cls.batch);
            totalStudents = batchStudents.length;
          }
        } catch (error) {
          console.error('Error getting students for class:', cls.name, error);
        }

        return {
          class: cls,
          totalSessions: attendanceRecords.length,
          lastSessionDate,
          totalStudents,
          averageAttendance,
          faculty: assignedFaculty,
          recentSessions
        };
      });

      const resolvedClassStats = await Promise.all(classStatsPromises);
      setClassStats(resolvedClassStats);

      // Calculate overall statistics
      const totalSessions = resolvedClassStats.reduce((sum, stat) => sum + stat.totalSessions, 0);
      const totalStudentsCount = resolvedClassStats.reduce((sum, stat) => sum + stat.totalStudents, 0);
      const classesWithSessions = resolvedClassStats.filter(stat => stat.totalSessions > 0).length;
      
      // Calculate weighted average attendance
      let totalAttendancePoints = 0;
      let totalSessions2 = 0;
      resolvedClassStats.forEach(stat => {
        if (stat.totalSessions > 0) {
          totalAttendancePoints += (stat.averageAttendance * stat.totalSessions);
          totalSessions2 += stat.totalSessions;
        }
      });
      const averageAttendance = totalSessions2 > 0 ? Math.round(totalAttendancePoints / totalSessions2) : 0;

      // Calculate sessions today
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      let sessionsToday = 0;
      resolvedClassStats.forEach(stat => {
        stat.recentSessions.forEach(session => {
          const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date as any);
          if (sessionDate >= todayStart && sessionDate < todayEnd) {
            sessionsToday++;
          }
        });
      });

      setOverallStats({
        totalClasses: classes.length,
        totalSessions,
        totalStudents: totalStudentsCount,
        averageAttendance,
        classesWithSessions,
        sessionsToday
      });

    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (percentage >= 75) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getSessionStatus = (sessions: number) => {
    if (sessions === 0) return { text: 'No Sessions', color: 'text-gray-400 bg-gray-500/20 border-gray-500/30' };
    if (sessions < 5) return { text: `${sessions} Sessions`, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' };
    return { text: `${sessions} Sessions`, color: 'text-green-400 bg-green-500/20 border-green-500/30' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white">Attendance Overview</h3>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          📊 Attendance Overview
        </h3>
        <button
          onClick={loadAttendanceData}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏫</span>
            <div>
              <p className="text-blue-300 text-sm font-medium">Total Classes</p>
              <p className="text-white text-2xl font-bold">{overallStats.totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📚</span>
            <div>
              <p className="text-green-300 text-sm font-medium">Total Sessions</p>
              <p className="text-white text-2xl font-bold">{overallStats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-purple-300 text-sm font-medium">Total Students</p>
              <p className="text-white text-2xl font-bold">{overallStats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="text-orange-300 text-sm font-medium">Avg Attendance</p>
              <p className="text-white text-2xl font-bold">{overallStats.averageAttendance}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-cyan-300 text-sm font-medium">Active Classes</p>
              <p className="text-white text-2xl font-bold">{overallStats.classesWithSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 backdrop-blur-xl rounded-2xl p-6 border border-pink-500/20">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-pink-300 text-sm font-medium">Today's Sessions</p>
              <p className="text-white text-2xl font-bold">{overallStats.sessionsToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class-wise Attendance */}
      <div className="space-y-6">
        <h4 className="text-xl font-semibold text-white">Class-wise Attendance Status</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {classStats.map((stat) => {
            const isLab = stat.class.type === 'lab';
            const sessionStatus = getSessionStatus(stat.totalSessions);
            
            return (
              <div
                key={stat.class.id}
                className={`group relative bg-gradient-to-br ${
                  isLab
                    ? 'from-blue-900/40 to-cyan-900/30 border-blue-500/30'
                    : 'from-purple-900/40 to-pink-900/30 border-purple-500/30'
                } backdrop-blur-xl rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 ${isLab ? 'bg-blue-500/20' : 'bg-purple-500/20'} rounded-xl`}>
                      <span className="text-2xl">{isLab ? '🔬' : '📚'}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{stat.class.name}</h3>
                      <p className="text-gray-300 text-sm">{stat.class.code}</p>
                    </div>
                  </div>
                  
                  {/* Attendance Percentage */}
                  <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getAttendanceColor(stat.averageAttendance)}`}>
                    {stat.averageAttendance}%
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Faculty</span>
                    <span className="text-white font-medium">
                      {stat.faculty ? stat.faculty.name : 'Not Assigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{isLab ? 'Batch' : 'Division'}</span>
                    <span className="text-white font-medium">
                      {isLab ? stat.class.batch : `Division ${stat.class.division}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Students</span>
                    <span className="text-white font-medium">{stat.totalStudents}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Sessions</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${sessionStatus.color}`}>
                      {sessionStatus.text}
                    </span>
                  </div>

                  {stat.lastSessionDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Last Session</span>
                      <span className="text-white font-medium text-sm">
                        {formatDate(stat.lastSessionDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Recent Sessions */}
                {stat.recentSessions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h5 className="text-white font-medium text-sm mb-2">Recent Sessions</h5>
                    <div className="space-y-1">
                      {stat.recentSessions.slice(0, 2).map((session, index) => (
                        <div key={session.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 truncate">
                            Session {session.sessionNumber}: {session.topic || 'No topic'}
                          </span>
                          <span className="text-gray-300 ml-2">
                            {Math.round(((session.presentCount + session.lateCount) / session.totalStudents) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="absolute top-4 right-4">
                  {stat.totalSessions === 0 ? (
                    <div className="w-3 h-3 bg-gray-500 rounded-full" title="No sessions conducted" />
                  ) : stat.averageAttendance >= 75 ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full" title="Good attendance" />
                  ) : (
                    <div className="w-3 h-3 bg-red-500 rounded-full" title="Low attendance" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {classStats.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Classes Found</h3>
            <p className="text-gray-400">Create some classes to view attendance statistics.</p>
          </div>
        )}
      </div>

      {/* Attendance Guidelines */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
        <h4 className="text-lg font-semibold text-white mb-4">📋 Attendance Status Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-400 font-medium">Excellent (85%+)</span>
            </div>
            <p className="text-gray-300 text-xs">Classes with strong attendance rates</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-400 font-medium">Good (75-84%)</span>
            </div>
            <p className="text-gray-300 text-xs">Classes meeting minimum requirements</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-400 font-medium">Needs Attention (&lt;75%)</span>
            </div>
            <p className="text-gray-300 text-xs">Classes requiring intervention</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceOverview;