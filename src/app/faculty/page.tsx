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

export default function FacultyDashboard() {
  const { user, userProfile, logout } = useAuth();
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
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    sessionsToday: 0,
    avgAttendance: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  // Define formatDate function before using it
  const formatDate = (timestamp: any) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const exportClassesData = useExportData(classes, (cls) => ({
    'Class Name': cls.name,
    'Class Code': cls.code,
    'Department': cls.department,
    'Year': cls.year,
    'Semester': cls.semester,
    'Students': cls.students?.length || 0,
    'Status': cls.isActive ? 'Active' : 'Inactive'
  }), 'faculty_classes');

  const exportAttendanceData = useExportData(recentAttendance, (record) => ({
    'Date': formatDate(record.date),
    'Class': record.className || 'N/A',
    'Session': record.sessionNumber,
    'Present': record.presentCount,
    'Total': record.totalStudents,
    'Attendance Rate': `${Math.round((record.presentCount / record.totalStudents) * 100)}%`
  }), 'recent_attendance');

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
      
      // Get faculty's classes
      const facultyClasses = await ClassService.getClasses({ 
        facultyId: user!.uid,
        isActive: true 
      });
      setClasses(facultyClasses);

      // Get recent attendance records
      const recentRecords = await AttendanceService.getAttendanceRecords({
        facultyId: user!.uid,
        limit: 5
      });
      setRecentAttendance(recentRecords);

      // Calculate statistics
      const totalStudents = facultyClasses.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
      
      // Get today's sessions
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const todaySessions = await AttendanceService.getAttendanceRecords({
        facultyId: user!.uid,
        startDate: todayStart,
        endDate: todayEnd
      });

      // Calculate average attendance
      const allRecords = await AttendanceService.getAttendanceRecords({
        facultyId: user!.uid
      });
      
      let totalPresent = 0;
      let totalPossible = 0;
      
      allRecords.forEach(record => {
        totalPresent += record.presentCount;
        totalPossible += record.totalStudents;
      });
      
      const avgAttendance = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

      setStats({
        totalClasses: facultyClasses.length,
        totalStudents,
        sessionsToday: todaySessions.length,
        avgAttendance
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 animate-slideIn">
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
                  <h1 className="text-4xl font-bold gradient-text">Faculty Dashboard</h1>
                  <p className="text-slate-300 mt-2 text-lg">
                    Welcome back, {userProfile?.name || 'Faculty'}! 
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {userProfile?.name && (
                  <div className="text-right hidden sm:block">
                    <p className="text-white font-medium">{userProfile.name}</p>
                    <p className="text-slate-400 text-sm">{userProfile.email}</p>
                  </div>
                )}
                <Button onClick={handleLogout} variant="secondary" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/faculty' }
            ]}
          />
        </div>

        {/* Faculty Profile Info */}
        <div className="mb-8">
          <Card className="glass p-6 border border-white/10">
            <div className="flex items-center space-x-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {userProfile?.name?.charAt(0)?.toUpperCase() || 'F'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{userProfile?.name || 'Faculty Name'}</h2>
                <div className="flex flex-wrap gap-4 text-slate-300">
                  {userProfile?.designation && (
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-400">🏛️</span>
                      <span>{userProfile.designation}</span>
                    </div>
                  )}
                  {userProfile?.subject && (
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400">📖</span>
                      <span>{userProfile.subject}</span>
                    </div>
                  )}
                  {userProfile?.employeeId && (
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-400">🆔</span>
                      <span>ID: {userProfile.employeeId}</span>
                    </div>
                  )}
                  {userProfile?.email && (
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400">📧</span>
                      <span>{userProfile.email}</span>
                    </div>
                  )}
                </div>
                {classes.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {classes.slice(0, 3).map((cls) => (
                        <span key={cls.id} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-500/30">
                          {cls.name} ({cls.code})
                        </span>
                      ))}
                      {classes.length > 3 && (
                        <span className="px-3 py-1 bg-slate-500/20 text-slate-300 rounded-full text-xs border border-slate-500/30">
                          +{classes.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="stat-card animate-fadeIn hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📚</div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{stats.totalClasses}</div>
                <div className="text-sm text-slate-400">Total Classes</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-3">
              <div className="text-blue-300 text-sm font-medium">Active courses you're teaching</div>
            </div>
          </div>

          <div className="stat-card animate-fadeIn hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">👥</div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{stats.totalStudents}</div>
                <div className="text-sm text-slate-400">Total Students</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-3">
              <div className="text-green-300 text-sm font-medium">Students across all classes</div>
            </div>
          </div>

          <div className="stat-card animate-fadeIn hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📋</div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{stats.sessionsToday}</div>
                <div className="text-sm text-slate-400">Today's Sessions</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-3">
              <div className="text-orange-300 text-sm font-medium">Attendance sessions conducted</div>
            </div>
          </div>

          <div className="stat-card animate-fadeIn hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">📊</div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{stats.avgAttendance}%</div>
                <div className="text-sm text-slate-400">Avg Attendance</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3">
              <div className="text-purple-300 text-sm font-medium">Overall attendance rate</div>
            </div>
          </div>
        </div>

        {/* Classes Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Card className="glass p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">My Classes</h3>
                <div className="flex items-center space-x-4">
                  <SearchBar 
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search classes..."
                    className="w-64"
                  />
                  <ExportButton 
                    data={exportClassesData}
                    filename="faculty_classes"
                    buttonText="Export"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredClasses.length > 0 ? filteredClasses.map((cls) => (
                  <div key={cls.id} className="class-card group p-4 rounded-xl border border-white/10 hover-lift">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white mb-1">{cls.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span>📖 {cls.code}</span>
                          {cls.department && <span>🏛️ {cls.department}</span>}
                          <span>👥 {cls.students?.length || 0} students</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/faculty/mark-attendance?classId=${cls.id}`}>
                          <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Mark Attendance
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-lg mb-4">No classes found.</p>
                    <p className="text-sm">Contact admin to assign classes to you.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div>
            <Card className="glass p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
                <ExportButton 
                  data={exportAttendanceData}
                  filename="recent_attendance"
                  buttonText="Export"
                />
              </div>
              
              <div className="space-y-4">
                {recentAttendance.map((record) => (
                  <div key={record.id} className="activity-item p-4 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Session {record.sessionNumber}</span>
                      <span className="text-xs text-slate-400">
                        {formatDate(record.date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{record.className || 'Class'}</span>
                      <span className={`font-medium ${
                        Math.round((record.presentCount / record.totalStudents) * 100) >= 75 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {Math.round((record.presentCount / record.totalStudents) * 100)}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>{record.presentCount} present</span>
                        <span>{record.totalStudents} total</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((record.presentCount / record.totalStudents) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentAttendance.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-lg mb-4">No attendance records yet.</p>
                    <Link href="/faculty/mark-attendance">
                      <button className="btn-success">Mark Your First Attendance</button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/faculty/mark-attendance" className="group">
              <div className="glass rounded-xl p-6 border border-white/10 hover-lift text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="font-bold text-white mb-2">Mark Attendance</h3>
                <p className="text-gray-300 text-sm">Take attendance for your classes</p>
              </div>
            </Link>
            <Link href="/faculty/classes" className="group">
              <div className="glass rounded-xl p-6 border border-white/10 hover-lift text-center">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="font-bold text-white mb-2">Manage Classes</h3>
                <p className="text-gray-300 text-sm">Create and organize your classes</p>
              </div>
            </Link>
            <Link href="/faculty/reports" className="group">
              <div className="glass rounded-xl p-6 border border-white/10 hover-lift text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="font-bold text-white mb-2">View Reports</h3>
                <p className="text-gray-300 text-sm">Analyze attendance data</p>
              </div>
            </Link>
            <Link href="/faculty/messaging" className="group">
              <div className="glass rounded-xl p-6 border border-white/10 hover-lift text-center bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="font-bold text-white mb-2">Message Admin</h3>
                <p className="text-gray-300 text-sm">Send messages, requests, and notifications</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}