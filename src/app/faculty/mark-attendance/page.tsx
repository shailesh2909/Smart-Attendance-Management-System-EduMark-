"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ClassService } from "@/services/classService";
import { AttendanceService } from "@/services/attendanceService";
import { UserService } from "@/services/userService";
import { Class } from "@/models/Class";
import { User } from "@/models/User";
import { AttendanceRecord, AttendanceStatus, Attendance } from "@/models/Attendance";
import { Timestamp } from "firebase/firestore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function MarkAttendancePage() {
  const { user, userProfile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionDetails, setSessionDetails] = useState({
    topic: "",
    duration: 60, // default 60 minutes
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasAttendanceToday, setHasAttendanceToday] = useState(false);
  const [attendanceStatusByClass, setAttendanceStatusByClass] = useState<{[classId: string]: boolean}>({});
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);

  useEffect(() => {
    loadFacultyClasses();
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
      
      // Check attendance status for each class
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const statusByClass: {[classId: string]: boolean} = {};
      
      for (const classItem of facultyClasses) {
        try {
          const todayAttendanceRecords = await AttendanceService.getAttendanceRecords({
            classId: classItem.id!
          });
          
          const hasTodayRecord = todayAttendanceRecords.some(record => {
            const recordDate = record.date?.toDate ? record.date.toDate() : new Date(record.date as any);
            return recordDate >= todayStart && recordDate < todayEnd;
          });
          
          statusByClass[classItem.id!] = hasTodayRecord;
        } catch (error) {
          console.error(`Error checking attendance for class ${classItem.name}:`, error);
          statusByClass[classItem.id!] = false;
        }
      }
      
      setAttendanceStatusByClass(statusByClass);
    } catch (error) {
      console.error("Error loading classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = async (classData: Class) => {
    try {
      setLoading(true);
      setSelectedClass(classData);
      
      // Check if attendance has already been marked today for this class
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const todayAttendanceRecords = await AttendanceService.getAttendanceRecords({
        classId: classData.id!
      });
      
      // Filter for today's records
      const todayRecord = todayAttendanceRecords.find(record => {
        const recordDate = record.date?.toDate ? record.date.toDate() : new Date(record.date as any);
        return recordDate >= todayStart && recordDate < todayEnd;
      });

      if (todayRecord) {
        setHasAttendanceToday(true);
        setTodayAttendance(todayRecord);
        setLoading(false);
        return;
      } else {
        setHasAttendanceToday(false);
        setTodayAttendance(null);
      }
      
      // Get students for this class based on division/batch
      let classStudents: User[] = [];
      
      if (classData.type === 'class' && classData.division) {
        // Get students from specific division
        const allStudents = await UserService.getUsers({
          role: 'student',
          approved: true
        });
        classStudents = allStudents.filter(s => s.division === classData.division);
      } else if (classData.type === 'lab' && classData.batch) {
        // Get students from specific batch
        const allStudents = await UserService.getUsers({
          role: 'student',
          approved: true
        });
        classStudents = allStudents.filter(s => s.batch === classData.batch);
      }

      setStudents(classStudents);
      
      // Initialize attendance records
      const initialRecords: AttendanceRecord[] = classStudents.map(student => ({
        studentId: student.uid!,
        studentName: student.name,
        status: "present" as AttendanceStatus,
        remarks: ""
      }));
      
      setAttendanceRecords(initialRecords);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendanceStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, status }
          : record
      )
    );
  };

  const updateRemarks = (studentId: string, remarks: string) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, remarks }
          : record
      )
    );
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !user || !userProfile) return;

    try {
      setSubmitting(true);
      
      // Get next session number
      const existingAttendance = await AttendanceService.getAttendanceRecords({
        classId: selectedClass.id!
      });
      const sessionNumber = existingAttendance.length + 1;

      const attendanceData = {
        classId: selectedClass.id!,
        className: selectedClass.name,
        classCode: selectedClass.code,
        facultyId: user.uid,
        facultyName: userProfile.name,
        date: Timestamp.now(),
        sessionNumber,
        topic: sessionDetails.topic,
        duration: sessionDetails.duration,
        records: attendanceRecords
      };

      await AttendanceService.createAttendance(attendanceData);
      setIsSubmitted(true);
      
    } catch (error) {
      console.error("Error submitting attendance:", error);
      alert("Failed to submit attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNo?.toString().includes(searchQuery)
  );

  const presentCount = attendanceRecords.filter(r => r.status === "present").length;
  const absentCount = attendanceRecords.filter(r => r.status === "absent").length;
  const lateCount = attendanceRecords.filter(r => r.status === "late").length;

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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0a0118] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Attendance Submitted Successfully!</h1>
            <p className="text-gray-400 mb-8">
              Attendance for {selectedClass?.name} has been recorded and cannot be changed.
            </p>
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-600/30 max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Present:</span>
                  <span className="text-green-400 font-semibold">{presentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Absent:</span>
                  <span className="text-red-400 font-semibold">{absentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Late:</span>
                  <span className="text-yellow-400 font-semibold">{lateCount}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedClass(null);
                setIsSubmitted(false);
                setAttendanceRecords([]);
                setSessionDetails({ topic: "", duration: 60 });
              }}
              className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              Mark Another Session
            </button>
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
            📋 Mark Attendance
          </h1>
          <p className="text-gray-400 text-lg">
            Select a class and mark attendance for your students
          </p>
        </div>

        {!selectedClass ? (
          /* Class Selection */
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Select Class/Lab</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem) => {
                const hasAttendanceMarked = attendanceStatusByClass[classItem.id!] || false;
                return (
                  <div
                    key={classItem.id}
                    onClick={() => handleClassSelect(classItem)}
                    className={`group relative bg-gradient-to-br ${
                      classItem.type === 'lab'
                        ? 'from-blue-900/40 to-cyan-900/30 border-blue-500/30'
                        : 'from-purple-900/40 to-pink-900/30 border-purple-500/30'
                    } backdrop-blur-xl rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${
                      hasAttendanceMarked ? 'opacity-75' : ''
                    }`}
                  >
                    {/* Attendance Status Indicator */}
                    <div className="absolute top-4 right-4">
                      {hasAttendanceMarked ? (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                          <span className="text-green-400 text-xs">✅</span>
                          <span className="text-green-400 text-xs font-medium">Marked</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                          <span className="text-orange-400 text-xs">⏳</span>
                          <span className="text-orange-400 text-xs font-medium">Pending</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-3 ${
                        classItem.type === 'lab' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                      } rounded-xl`}>
                        <span className="text-2xl">{classItem.type === 'lab' ? '🔬' : '📚'}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{classItem.name}</h3>
                        <p className="text-gray-300 text-sm">{classItem.code}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subject:</span>
                        <span className="text-white font-medium">{classItem.subject}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{classItem.type === 'lab' ? 'Batch:' : 'Division:'}</span>
                        <span className="text-white font-medium">
                          {classItem.type === 'lab' ? classItem.batch : `Division ${classItem.division}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Students:</span>
                        <span className="text-white font-medium">{classItem.students?.length || 0}</span>
                      </div>
                      {hasAttendanceMarked && (
                        <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                          <span className="text-gray-400">Today's Status:</span>
                          <span className="text-green-400 font-medium">Attendance Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {classes.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Classes Assigned</h3>
                <p className="text-gray-400">You don't have any classes assigned yet.</p>
              </div>
            )}
          </div>
        ) : hasAttendanceToday ? (
          /* Attendance Already Marked Today */
          <div className="space-y-8">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Attendance Already Marked</h2>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                You have already marked attendance for <strong>{selectedClass?.name}</strong> today. 
                Attendance cannot be modified once submitted to maintain data integrity.
              </p>
              
              {/* Today's Attendance Summary */}
              {todayAttendance && (
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-600/30 max-w-2xl mx-auto mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Today's Session Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{todayAttendance.sessionNumber}</div>
                      <div className="text-gray-400 text-sm">Session Number</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{todayAttendance.presentCount}</div>
                      <div className="text-gray-400 text-sm">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{todayAttendance.lateCount}</div>
                      <div className="text-gray-400 text-sm">Late</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{todayAttendance.absentCount}</div>
                      <div className="text-gray-400 text-sm">Absent</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-600/30">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Session Topic:</span>
                      <span className="text-white font-medium">{todayAttendance.topic}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white font-medium">{todayAttendance.duration} minutes</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400">Attendance Rate:</span>
                      <span className="text-white font-medium">
                        {Math.round(((todayAttendance.presentCount + todayAttendance.lateCount) / todayAttendance.totalStudents) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setSelectedClass(null);
                    setHasAttendanceToday(false);
                    setTodayAttendance(null);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  ← Back to Classes
                </button>
                <a
                  href="/faculty/reports"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  📊 View Reports
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Attendance Marking Interface */
          <div className="space-y-8">
            {/* Class Header */}
            <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-600/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 ${
                    selectedClass.type === 'lab' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                  } rounded-xl`}>
                    <span className="text-2xl">{selectedClass.type === 'lab' ? '🔬' : '📚'}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedClass.name}</h2>
                    <p className="text-gray-400">{selectedClass.code} • {selectedClass.subject}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Back to Classes
                </button>
              </div>
              
              {/* Session Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Session Topic</label>
                  <input
                    type="text"
                    value={sessionDetails.topic}
                    onChange={(e) => setSessionDetails({...sessionDetails, topic: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="e.g., Database Normalization, React Components"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={sessionDetails.duration}
                    onChange={(e) => setSessionDetails({...sessionDetails, duration: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    min="15"
                    max="300"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-green-300 text-sm font-medium">Present</p>
                    <p className="text-white text-2xl font-bold">{presentCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="text-red-300 text-sm font-medium">Absent</p>
                    <p className="text-white text-2xl font-bold">{absentCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className="text-yellow-300 text-sm font-medium">Late</p>
                    <p className="text-white text-2xl font-bold">{lateCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Total</p>
                    <p className="text-white text-2xl font-bold">{attendanceRecords.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  placeholder="Search students by name, student ID, or roll number..."
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setAttendanceRecords(prev => prev.map(r => ({...r, status: "present" as AttendanceStatus})))}
                  className="px-4 py-3 bg-green-600/20 text-green-300 rounded-xl border border-green-600/30 hover:bg-green-600/30 transition-all duration-200"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => setAttendanceRecords(prev => prev.map(r => ({...r, status: "absent" as AttendanceStatus})))}
                  className="px-4 py-3 bg-red-600/20 text-red-300 rounded-xl border border-red-600/30 hover:bg-red-600/30 transition-all duration-200"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {/* Student List */}
            <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-600/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-white font-semibold">Student</th>
                      <th className="text-left px-6 py-4 text-white font-semibold">Student ID</th>
                      <th className="text-left px-6 py-4 text-white font-semibold">Roll No</th>
                      <th className="text-center px-6 py-4 text-white font-semibold">Attendance</th>
                      <th className="text-left px-6 py-4 text-white font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => {
                      const record = attendanceRecords.find(r => r.studentId === student.uid);
                      return (
                        <tr key={student.uid} className="border-t border-gray-700/30 hover:bg-gray-800/20">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <span className="text-white font-medium">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{student.studentId}</td>
                          <td className="px-6 py-4 text-gray-300">{student.rollNo}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => updateAttendanceStatus(student.uid!, "present")}
                                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                                  record?.status === "present"
                                    ? "bg-green-600 text-white"
                                    : "bg-green-600/20 text-green-300 hover:bg-green-600/30"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => updateAttendanceStatus(student.uid!, "late")}
                                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                                  record?.status === "late"
                                    ? "bg-yellow-600 text-white"
                                    : "bg-yellow-600/20 text-yellow-300 hover:bg-yellow-600/30"
                                }`}
                              >
                                Late
                              </button>
                              <button
                                onClick={() => updateAttendanceStatus(student.uid!, "absent")}
                                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                                  record?.status === "absent"
                                    ? "bg-red-600 text-white"
                                    : "bg-red-600/20 text-red-300 hover:bg-red-600/30"
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={record?.remarks || ""}
                              onChange={(e) => updateRemarks(student.uid!, e.target.value)}
                              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                              placeholder="Optional remarks..."
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmitAttendance}
                disabled={!sessionDetails.topic || submitting}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "📋 Submit Attendance"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
