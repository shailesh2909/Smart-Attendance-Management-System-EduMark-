'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { ClassService } from '@/services/classService';
import { AttendanceService } from '@/services/attendanceService';
import { Class } from '@/models/Class';
import { Attendance } from '@/models/Attendance';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SearchBar from '@/components/ui/SearchBar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ExportButton, { useExportData } from '@/components/ui/ExportButton';
import { StatCardSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

interface StudentAttendanceStats {
  classId: string;
  className: string;
  classCode: string;
  totalSessions: number;
  attendedSessions: number;
  absentSessions: number;
  lateSessions: number;
  attendancePercentage: number;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/'); // Redirect to landing page
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [classes, setClasses] = useState<Class[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<StudentAttendanceStats[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalClasses: 0,
    averageAttendance: 0,
    totalSessions: 0,
    attendedSessions: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  const exportClassesData = useExportData(classes, (cls) => ({
    'Class Name': cls.name,
    'Class Code': cls.code,
    'Department': cls.department,
    'Year': cls.year,
    'Semester': cls.semester,
    'Faculty': cls.facultyName || 'N/A',
    'Status': cls.isActive ? 'Active' : 'Inactive'
  }));

  const exportAttendanceData = useExportData(attendanceStats, (stat) => ({
    'Class Name': stat.className,
    'Class Code': stat.classCode,
    'Total Sessions': stat.totalSessions,
    'Attended': stat.attendedSessions,
    'Absent': stat.absentSessions,
    'Late': stat.lateSessions,
    'Attendance %': `${stat.attendancePercentage}%`
  }));

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    // Filter classes based on search query
    const filtered = classes.filter(cls =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClasses(filtered);
  }, [classes, searchQuery]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get all classes where this student is enrolled
      const allClasses = await ClassService.getClasses({ isActive: true });
      const studentClasses = allClasses.filter(cls => 
        cls.students?.includes(user!.uid)
      );
      setClasses(studentClasses);

      // Get attendance statistics for each class
      const stats: StudentAttendanceStats[] = [];
      let totalSessions = 0;
      let totalAttended = 0;

      for (const cls of studentClasses) {
        // Get all attendance records for this class
        const classAttendance = await AttendanceService.getAttendanceRecords({
          classId: cls.id!
        });

        let attended = 0;
        let absent = 0;
        let late = 0;

        classAttendance.forEach(record => {
          const studentRecord = record.records.find(r => r.studentId === user!.uid);
          if (studentRecord) {
            switch (studentRecord.status) {
              case 'present':
                attended++;
                break;
              case 'absent':
                absent++;
                break;
              case 'late':
                late++;
                attended++; // Count late as attended for percentage calculation
                break;
            }
          }
        });

        const totalClassSessions = classAttendance.length;
        const attendancePercentage = totalClassSessions > 0 
          ? Math.round((attended / totalClassSessions) * 100) 
          : 0;

        stats.push({
          classId: cls.id!,
          className: cls.name,
          classCode: cls.code,
          totalSessions: totalClassSessions,
          attendedSessions: attended,
          absentSessions: absent,
          lateSessions: late,
          attendancePercentage
        });

        totalSessions += totalClassSessions;
        totalAttended += attended;
      }

      setAttendanceStats(stats);

      // Calculate overall statistics
      const averageAttendance = totalSessions > 0 
        ? Math.round((totalAttended / totalSessions) * 100) 
        : 0;

      setOverallStats({
        totalClasses: studentClasses.length,
        averageAttendance,
        totalSessions,
        attendedSessions: totalAttended
      });

      // Get recent attendance records (last 10 sessions across all classes)
      const allRecentRecords: Attendance[] = [];
      for (const cls of studentClasses) {
        const classRecords = await AttendanceService.getAttendanceRecords({
          classId: cls.id!,
          limit: 5
        });
        allRecentRecords.push(...classRecords);
      }
      
      // Sort by date and take the most recent 5
      allRecentRecords.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date as any);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date as any);
        return dateB.getTime() - dateA.getTime();
      });
      
      setRecentAttendance(allRecentRecords.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="glass rounded-2xl p-8 mb-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-white p-1">
                  <Image
                    src="/Logo.jpg"
                    alt="Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold gradient-text mb-2">Student Dashboard</h1>
                  <p className="text-slate-300 text-lg">Track your attendance and academic progress</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleLogout}
                  className="btn-outline hover-lift"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '/student' }
              ]}
            />
          </div>

          {/* Overall Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="stat-card animate-fadeIn hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📚</div>
                <div className="text-right">
                  <div className="stat-value">{overallStats.totalClasses}</div>
                  <div className="stat-label">My Classes</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">Active class enrollments</p>
            </div>

            <div className="stat-card animate-fadeIn hover-lift" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📊</div>
                <div className="text-right">
                  <div className="stat-value">{overallStats.averageAttendance}%</div>
                  <div className="stat-label">Avg Attendance</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">Overall attendance rate</p>
            </div>

            <div className="stat-card animate-fadeIn hover-lift" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📅</div>
                <div className="text-right">
                  <div className="stat-value">{overallStats.totalSessions}</div>
                  <div className="stat-label">Total Sessions</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">Sessions attended</p>
            </div>

            <div className="stat-card animate-fadeIn hover-lift" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">✅</div>
                <div className="text-right">
                  <div className="stat-value">{overallStats.attendedSessions}</div>
                  <div className="stat-label">Attended</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">Sessions marked present</p>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Class Attendance Summary */}
        <div className="card hover-lift">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Class Attendance</h2>
              <div className="flex gap-3">
                <ExportButton
                  data={exportAttendanceData}
                  filename="my-attendance"
                  className="text-sm"
                />
                <Link href="/student/attendance">
                  <button className="btn-outline">View Details</button>
                </Link>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar
                placeholder="Search classes by name, code, or department..."
                onSearch={setSearchQuery}
              />
            </div>
            
            <div className="space-y-4">
              {(filteredClasses.length > 0 ? 
                attendanceStats.filter(stat => 
                  filteredClasses.some(cls => cls.id === stat.classId)
                ) : attendanceStats).map((stat) => (
                <div key={stat.classId} className="glass rounded-xl p-6 border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">{stat.className}</h3>
                      <p className="text-gray-300 text-sm">{stat.classCode}</p>
                    </div>
                    <span className={`text-xl font-bold ${
                      stat.attendancePercentage >= 75 ? 'text-green-400' :
                      stat.attendancePercentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {stat.attendancePercentage}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-green-400">
                        {stat.attendedSessions}
                      </span>
                      <span className="text-gray-300">Present</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-red-400">
                        {stat.absentSessions}
                      </span>
                      <span className="text-gray-300">Absent</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-yellow-400">
                        {stat.lateSessions}
                      </span>
                      <span className="text-gray-300">Late</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 text-sm">Attendance Progress</span>
                      <span className="text-white font-semibold">
                        {stat.attendedSessions}/{stat.totalSessions} sessions
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          stat.attendancePercentage >= 75 ? 'bg-gradient-to-r from-green-400 to-purple-500' :
                          stat.attendancePercentage >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${stat.attendancePercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-300 mt-2">
                      <span>
                        {stat.attendancePercentage >= 75 ? '✓ Good Standing' :
                         stat.attendancePercentage >= 60 ? '⚠ Warning Zone' : '✗ Critical - Contact Faculty'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {attendanceStats.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-lg mb-4">No classes assigned yet.</p>
                  <p className="text-gray-300">Contact your faculty to get enrolled in classes.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="card hover-lift">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Sessions</h2>
              <div className="flex gap-3">
                <ExportButton
                  data={exportClassesData}
                  filename="my-classes"
                  className="text-sm"
                />
                <Link href="/student/attendance">
                  <button className="btn-outline">View All</button>
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              {recentAttendance.map((record) => {
                const studentRecord = record.records.find(r => r.studentId === user?.uid);
                
                return (
                  <div key={record.id} className="glass rounded-xl p-6 border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-white text-lg">{record.className}</h3>
                        <p className="text-gray-300 text-sm">{record.classCode}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-300 text-sm">
                          {formatDate(record.date)}
                        </span>
                        {studentRecord && (
                          <div className="mt-2">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              studentRecord.status === 'present' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              studentRecord.status === 'absent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {studentRecord.status.charAt(0).toUpperCase() + studentRecord.status.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {record.topic && (
                      <p className="text-gray-300 mb-4 text-sm">
                        <span className="font-semibold">Topic:</span> {record.topic}
                      </p>
                    )}
                    
                    {studentRecord?.remarks && (
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-gray-300 text-sm italic">
                          <span className="font-semibold">Note:</span> {studentRecord.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {recentAttendance.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg mb-4">No attendance records yet.</p>
                  <p className="text-gray-300">Your attendance sessions will appear here once they start.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Alerts */}
      {attendanceStats.some(stat => stat.attendancePercentage < 75) && (
        <div className="card hover-lift border-l-4 border-yellow-400">
          <div className="p-8">
            <div className="flex items-center mb-6">
              <div className="text-3xl mr-4">⚠️</div>
              <div>
                <h2 className="text-2xl font-bold text-white">Attendance Alerts</h2>
                <p className="text-gray-300">Classes requiring attention</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {attendanceStats
                .filter(stat => stat.attendancePercentage < 75)
                .map(stat => (
                  <div key={stat.classId} className="glass rounded-xl p-6 border border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white text-lg">{stat.className}</h3>
                        <p className="text-gray-300 text-sm">{stat.classCode}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${
                          stat.attendancePercentage < 60 ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {stat.attendancePercentage}%
                        </span>
                        <p className="text-gray-300 text-sm">
                          {stat.attendancePercentage < 60 ? 'Critical - Contact Faculty' : 'Below 75% - Improve Attendance'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card hover-lift">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/student/attendance" className="group">
              <div className="glass rounded-xl p-6 border border-white/10 hover-lift text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="font-bold text-white mb-2">View Detailed Attendance</h3>
                <p className="text-gray-300 text-sm">See complete attendance history and analytics</p>
              </div>
            </Link>
            <Link href="/student/profile" className="group">
              <div className="glass rounded-xl p-6 border border-white/10 hover-lift text-center">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="font-bold text-white mb-2">Update Profile</h3>
                <p className="text-gray-300 text-sm">Manage your personal information and settings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}