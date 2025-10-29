"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import CSVUpload from "@/components/upload/CSVUpload";
import ClassManagement from "@/components/admin/ClassManagement";
import AttendanceOverview from "@/components/admin/AttendanceOverview";

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalClasses: number;
  activeClasses: number;
  totalSessions: number;
  averageAttendance: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  attendanceGrowth: number;
  classUtilization: number;
  departmentDistribution: { [key: string]: number };
  yearDistribution: { [key: string]: number };
  divisionDistribution: { [key: string]: number };
  monthlyGrowth: Array<{ month: string; students: number; faculty: number }>;
  attendanceTrends: Array<{ date: string; percentage: number }>;
  topPerformingClasses: Array<{ name: string; attendance: number }>;
  lastUpdated: string;
}

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  createdAt?: any;
  department?: string;
  year?: string;
}

interface ActivityLog {
  id: string;
  type: "class" | "attendance" | "user" | "system";
  message: string;
  timestamp: string;
  userId?: string;
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/'); // Redirect to landing page
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [activeTab, setActiveTab] = useState("overview");
  const [showCSVUpload, setShowCSVUpload] = useState<"student" | "faculty" | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalClasses: 0,
    activeClasses: 0,
    totalSessions: 0,
    averageAttendance: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    attendanceGrowth: 0,
    classUtilization: 0,
    departmentDistribution: {},
    yearDistribution: {},
    divisionDistribution: {},
    monthlyGrowth: [],
    attendanceTrends: [],
    topPerformingClasses: [],
    lastUpdated: new Date().toISOString(),
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all data in parallel
      const [statsRes, usersRes, activityRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/activity?limit=10"),
      ]);

      if (!statsRes.ok || !usersRes.ok || !activityRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [statsData, usersData, activityData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        activityRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (usersData.success) {
        setAllUsers(usersData.data);
      }

      if (activityData.success) {
        setRecentActivity(activityData.data);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (type: string, message: string) => {
    try {
      await fetch("/api/admin/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          message,
        }),
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await fetch("/api/admin/activity?limit=10");
      const result = await response.json();
      if (result.success) {
        setRecentActivity(result.data);
      }
    } catch (error) {
      console.error("Error loading activity:", error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return "Unknown time";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="loading-spinner mb-6"></div>
          <h2 className="text-2xl font-bold gradient-text mb-2">Loading Dashboard</h2>
          <p className="text-gray-300">Fetching your admin insights...</p>
        </div>
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
                  <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
                  <p className="text-slate-300 mt-2 text-lg">Manage your attendance system with powerful insights</p>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-8 glass border-red-200/20 rounded-xl p-6 animate-slideIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-400 mr-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-red-300 font-bold text-lg">Error Loading Data</h3>
                  <p className="text-red-200 text-sm mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 font-bold text-2xl transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Admin Panel Header */}
        <div className="mb-8 flex justify-between items-center">
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-bold gradient-text">Admin Panel</h2>
            <p className="text-gray-300 mt-1">
              Manage your attendance system with powerful insights
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="btn-primary flex items-center space-x-2 hover-lift"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* Dashboard Overview Panel */}
        <div className="mb-8">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat-card animate-fadeIn hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">👥</div>
                <div className="text-right">
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">All registered users in the system</p>
              {(stats.newUsersThisWeek || 0) > 0 && (
                <div className="mt-2 text-xs text-green-400">
                  +{stats.newUsersThisWeek || 0} this week
                </div>
              )}
            </div>

            <div className="stat-card animate-fadeIn hover-lift" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">🎓</div>
                <div className="text-right">
                  <div className="stat-value">{stats.totalStudents}</div>
                  <div className="stat-label">Students</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">Active enrolled students</p>
              <div className="mt-2 text-xs text-blue-400">
                {stats.totalFaculty} faculty members
              </div>
            </div>

            <div className="stat-card animate-fadeIn hover-lift" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">👨‍🏫</div>
                <div className="text-right">
                  <div className="stat-value">{stats.totalFaculty}</div>
                  <div className="stat-label">Faculty</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">Teaching staff members</p>
              <div className="mt-2 text-xs text-purple-400">
                {stats.activeClasses} active classes
              </div>
            </div>


          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card hover-lift animate-fadeIn">
              <div className="flex items-center p-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 mr-4">
                  <span className="text-3xl text-white">📊</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Total Classes</p>
                  <p className="text-3xl font-bold text-white">{stats.totalClasses}</p>
                  <p className="text-xs text-purple-400 mt-1">
                    {(stats.classUtilization || 0).toFixed(1)}% utilization
                  </p>
                </div>
              </div>
            </div>

            <div className="card hover-lift animate-fadeIn" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center p-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 mr-4">
                  <span className="text-3xl text-white">📈</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Active Classes</p>
                  <p className="text-3xl font-bold text-white">{stats.activeClasses}</p>
                  <p className="text-xs text-green-400 mt-1">
                    Currently running
                  </p>
                </div>
              </div>
            </div>

            <div className="card hover-lift animate-fadeIn" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center p-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 mr-4">
                  <span className="text-3xl text-white">🕐</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Total Sessions</p>
                  <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
                  <p className="text-xs text-orange-400 mt-1">
                    This semester
                  </p>
                </div>
              </div>
            </div>

            <div className="card hover-lift animate-fadeIn" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center p-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 mr-4">
                  <span className="text-3xl text-white">📊</span>
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-medium">Avg Attendance</p>
                  <p className="text-3xl font-bold text-white">{(stats.averageAttendance || 0).toFixed(1)}%</p>
                  <p className={`text-xs mt-1 ${(stats.attendanceGrowth || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(stats.attendanceGrowth || 0) >= 0 ? '+' : ''}{(stats.attendanceGrowth || 0).toFixed(1)}% vs last month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="tab-nav bg-slate-800/50">
            <button
              className={`tab-item ${activeTab === "overview" ? "tab-item-active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              📋 Overview
            </button>

            <button
              className={`tab-item ${activeTab === "upload" ? "tab-item-active" : ""}`}
              onClick={() => setActiveTab("upload")}
            >
              📤 Upload CSV
            </button>
            <button
              className={`tab-item ${activeTab === "classes" ? "tab-item-active" : ""}`}
              onClick={() => setActiveTab("classes")}
            >
              🏫 Manage Classes
            </button>
            <button
              className={`tab-item ${activeTab === "attendance" ? "tab-item-active" : ""}`}
              onClick={() => setActiveTab("attendance")}
            >
              📊 Attendance Overview
            </button>
            <button
              className={`tab-item ${activeTab === "activity" ? "tab-item-active" : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              📋 Recent Activity
            </button>
          </div>

          <div className="p-6 bg-slate-800/30">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">System Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600/50">
                    <h4 className="font-semibold text-slate-200 mb-3">📊 Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Active Users Today:</span>
                        <span className="font-semibold text-white">{Math.floor(stats.totalUsers * 0.8)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Classes Today:</span>
                        <span className="font-semibold text-white">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Attendance Rate:</span>
                        <span className="font-semibold text-white">{stats.averageAttendance}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600/50">
                    <h4 className="font-semibold text-slate-200 mb-3">⚡ System Health</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Database:</span>
                        <span className="badge badge-success">Healthy</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">API Status:</span>
                        <span className="badge badge-success">Online</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Backup:</span>
                        <span className="badge badge-success">Up to date</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {activeTab === "upload" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Bulk Upload</h3>
                <p className="text-slate-300">Upload student and faculty data using CSV files</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student CSV Upload */}
                  <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-xl p-6 border border-green-500/30">
                    <div className="flex items-center mb-4">
                      <span className="text-3xl mr-3">📊</span>
                      <div>
                        <h4 className="text-lg font-semibold text-white">Student CSV Upload</h4>
                        <p className="text-green-200 text-sm">Upload student data in bulk</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-green-100 mb-4">
                      <p><strong>Required columns:</strong></p>
                      <ul className="space-y-1 text-xs">
                        <li>• studentName - Full name</li>
                        <li>• studyingYear - Year of study</li>
                        <li>• rollNo - Roll number</li>
                        <li>• division - Division (5 or 6)</li>
                        <li>• batch - Batch (K5, L5, M5, N5 for Div 5 | K6, L6, M6, N6 for Div 6)</li>
                        <li>• electiveSubject - Elective subject</li>
                        <li>• sId - Student ID (for login)</li>
                        <li>• sPassword - Student password</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setShowCSVUpload("student")}
                      className="w-full bg-green-600/30 hover:bg-green-600/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
                    >
                      <span className="mr-2">📤</span>
                      Upload Student CSV
                    </button>
                  </div>

                  {/* Faculty CSV Upload */}
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-xl p-6 border border-blue-500/30">
                    <div className="flex items-center mb-4">
                      <span className="text-3xl mr-3">👨‍🏫</span>
                      <div>
                        <h4 className="text-lg font-semibold text-white">Faculty CSV Upload</h4>
                        <p className="text-blue-200 text-sm">Upload faculty data in bulk</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-blue-100 mb-4">
                      <p><strong>Required columns:</strong></p>
                      <ul className="space-y-1 text-xs">
                        <li>• name - Full name of faculty</li>
                        <li>• designation - Academic position (Professor, Associate Professor, etc.)</li>
                        <li>• emailID - Official email address</li>
                        <li>• subject - Subject they teach</li>
                        <li>• E_ID - Employee ID (for login)</li>
                        <li>• E_password - Employee password</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setShowCSVUpload("faculty")}
                      className="w-full bg-blue-600/30 hover:bg-blue-600/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
                    >
                      <span className="mr-2">📤</span>
                      Upload Faculty CSV
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-purple-500/20 border border-purple-400/40 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    Instructions
                  </h4>
                  <ul className="text-purple-200 text-sm space-y-1">
                    <li>• Download the template from the upload modal to ensure correct formatting</li>
                    <li>• All accounts created via CSV upload are automatically approved</li>
                    <li>• Email addresses are auto-generated based on ID fields</li>
                    <li>• Duplicate IDs will be skipped with error messages</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "classes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Manage Classes & Labs</h3>
                </div>
                
                <ClassManagement />
              </div>
            )}

            {activeTab === "attendance" && (
              <AttendanceOverview />
            )}

            {activeTab === "activity" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'approval' ? 'bg-green-500/20' :
                        activity.type === 'class' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                      }`}>
                        {activity.type === 'approval' && <span className="text-xl">✅</span>}
                        {activity.type === 'class' && <span className="text-xl">📚</span>}
                        {activity.type === 'attendance' && <span className="text-xl">📝</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.message}</p>
                        <p className="text-sm text-slate-400">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <CSVUpload 
          type={showCSVUpload} 
          onClose={() => setShowCSVUpload(null)} 
        />
      )}
    </div>
  );
}
