'use client';

import { useState, useEffect } from 'react';
import { ClassService } from '@/services/classService';
import { UserService } from '@/services/userService';
import { Class } from '@/models/Class';
import { User } from '@/models/User';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ClassManagementProps {}

const ClassManagement: React.FC<ClassManagementProps> = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const [newClass, setNewClass] = useState({
    name: '',
    code: '',
    type: 'class' as 'class' | 'lab',
    subject: '',
    division: '',
    batch: '',
    facultyId: '',
    room: '',
    schedule: {
      day: '',
      startTime: '',
      endTime: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, facultyData, studentsData] = await Promise.all([
        ClassService.getClasses(),
        UserService.getUsers({ role: 'faculty', approved: true }),
        UserService.getUsers({ role: 'student', approved: true })
      ]);
      
      setClasses(classesData);
      setFaculty(facultyData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    try {
      // Determine eligible students based on class type
      let eligibleStudents: string[] = [];
      
      if (newClass.type === 'class') {
        // For classes: filter by division
        eligibleStudents = students
          .filter(student => student.division === newClass.division)
          .map(student => student.uid);
      } else {
        // For labs: filter by batch
        eligibleStudents = students
          .filter(student => student.batch === newClass.batch)
          .map(student => student.uid);
      }

      const facultyName = faculty.find(f => f.uid === newClass.facultyId)?.name || '';

      const classData = {
        name: newClass.name,
        code: newClass.code,
        type: newClass.type,
        subject: newClass.subject,
        division: newClass.type === 'class' ? newClass.division : undefined,
        batch: newClass.type === 'lab' ? newClass.batch : undefined,
        facultyId: newClass.facultyId,
        facultyName: facultyName,
        room: newClass.room,
        schedule: [{
          day: newClass.schedule.day,
          startTime: newClass.schedule.startTime,
          endTime: newClass.schedule.endTime,
          room: newClass.room
        }],
        students: eligibleStudents,
        isActive: true,
        department: 'Computer Engineering', // Default
        year: 'TE', // Default
        semester: '5' // Default
      };

      await ClassService.createClass(classData);
      await loadData();
      setShowCreateModal(false);
      setNewClass({
        name: '',
        code: '',
        type: 'class',
        subject: '',
        division: '',
        batch: '',
        facultyId: '',
        room: '',
        schedule: { day: '', startTime: '', endTime: '' }
      });
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleAssignStudents = async (classId: string, studentIds: string[]) => {
    try {
      await ClassService.updateClass(classId, { students: studentIds });
      await loadData();
      setShowAssignModal(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Error assigning students:', error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      try {
        await ClassService.deleteClass(classId);
        await loadData();
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            🎓 Classes & Labs Management
          </h2>
          <p className="text-gray-400 text-lg">
            Create and manage academic sessions. Classes are division-based, Labs are batch-based.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="group relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl border border-white/20"
        >
          <span className="flex items-center space-x-2">
            <span className="text-xl">✨</span>
            <span>Create New Session</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <p className="text-purple-300 text-sm font-medium">Total Classes</p>
              <p className="text-white text-2xl font-bold">{classes.filter(c => c.type === 'class').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <span className="text-2xl">🔬</span>
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium">Total Labs</p>
              <p className="text-white text-2xl font-bold">{classes.filter(c => c.type === 'lab').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <div>
              <p className="text-green-300 text-sm font-medium">Active Faculty</p>
              <p className="text-white text-2xl font-bold">{faculty.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-orange-300 text-sm font-medium">Total Enrolled</p>
              <p className="text-white text-2xl font-bold">{classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Classes/Labs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {classes.map((cls) => {
          const assignedFaculty = faculty.find(f => f.uid === cls.facultyId);
          const studentCount = cls.students?.length || 0;
          const isLab = cls.type === 'lab';
          
          return (
            <div key={cls.id} className={`group relative bg-gradient-to-br ${isLab 
              ? 'from-blue-900/40 to-cyan-900/30 border-blue-500/30' 
              : 'from-purple-900/40 to-pink-900/30 border-purple-500/30'
            } backdrop-blur-xl rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]`}>
              
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 ${isLab ? 'bg-blue-500/20' : 'bg-purple-500/20'} rounded-xl`}>
                    <span className="text-2xl">{isLab ? '🔬' : '📚'}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{cls.name}</h3>
                    <p className="text-gray-300 text-sm font-medium">{cls.code}</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      setShowAssignModal(true);
                    }}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl border border-blue-500/30 transition-all duration-200"
                    title="Manage Students"
                  >
                    <span className="text-blue-400">👥</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClass(cls.id!)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl border border-red-500/30 transition-all duration-200"
                    title="Delete"
                  >
                    <span className="text-red-400">🗑️</span>
                  </button>
                </div>
              </div>

              {/* Class Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Subject</span>
                  <span className="text-white font-medium">{cls.subject}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">{isLab ? 'Batch' : 'Division'}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isLab 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {isLab ? cls.batch : `Division ${cls.division}`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Faculty</span>
                  <span className="text-white font-medium">
                    {assignedFaculty ? `${assignedFaculty.name}` : 'Not assigned'}
                  </span>
                </div>
                
                {cls.room && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Room</span>
                    <span className="text-white font-medium">{cls.room}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-gray-400 text-sm">Students Enrolled</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold text-lg">{studentCount}</span>
                    <span className="text-green-400">👥</span>
                  </div>
                </div>
              </div>

              {/* Hover Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${isLab 
                ? 'from-blue-600/10 to-cyan-600/10' 
                : 'from-purple-600/10 to-pink-600/10'
              } rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          );
        })}
        
        {classes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 bg-gray-800/50 rounded-2xl mb-6">
              <span className="text-6xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Classes Created Yet</h3>
            <p className="text-gray-400 mb-6">Start by creating your first class or lab session</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
            >
              Create First Session
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Create Class Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title=""
      >
        <div className="space-y-8">
          {/* Enhanced Modal Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 rounded-3xl mb-6 shadow-2xl shadow-cyan-500/25">
              <span className="text-3xl">🎓</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
              Create New Academic Session
            </h2>
            <p className="text-cyan-200 text-lg font-medium">Configure your class or lab session details</p>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mx-auto mt-4"></div>
          </div>

          {/* Enhanced Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Session Name */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-cyan-200 uppercase tracking-wider">Session Name</label>
              <input
                type="text"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                className="w-full px-5 py-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 border-2 border-cyan-500/30 rounded-2xl text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/30 transition-all duration-300 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20"
                placeholder="e.g., Database Management"
              />
            </div>

            {/* Course Code */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-emerald-200 uppercase tracking-wider">Course Code</label>
              <input
                type="text"
                value={newClass.code}
                onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                className="w-full px-5 py-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 border-2 border-emerald-500/30 rounded-2xl text-white placeholder-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/30 transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                placeholder="e.g., CS301"
              />
            </div>

            {/* Session Type */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-blue-200 uppercase tracking-wider">Session Type</label>
              <select
                value={newClass.type}
                onChange={(e) => setNewClass({ ...newClass, type: e.target.value as 'class' | 'lab', division: '', batch: '' })}
                className="w-full px-5 py-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 border-2 border-blue-500/30 rounded-2xl text-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 transition-all duration-300 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
              >
                <option value="class">📚 Class (Division-based)</option>
                <option value="lab">🔬 Lab (Batch-based)</option>
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-indigo-200 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                value={newClass.subject}
                onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                className="w-full px-5 py-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 border-2 border-indigo-500/30 rounded-2xl text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/30 transition-all duration-300 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
                placeholder="e.g., DBMS, Data Structures"
              />
            </div>
          </div>

          {/* Enhanced Division/Batch Selection */}
          {newClass.type === 'class' && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-violet-200 uppercase tracking-wider">Division</label>
              <div className="grid grid-cols-2 gap-6">
                {['5', '6'].map((div) => (
                  <button
                    key={div}
                    type="button"
                    onClick={() => setNewClass({ ...newClass, division: div })}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      newClass.division === div
                        ? 'border-violet-400 bg-gradient-to-br from-violet-500/30 to-purple-600/20 text-violet-200 shadow-xl shadow-violet-500/25'
                        : 'border-slate-600/40 bg-gradient-to-br from-slate-800/60 to-slate-700/40 text-slate-400 hover:border-violet-400/60 hover:shadow-lg hover:shadow-violet-500/10'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3 group-hover:animate-bounce">📚</div>
                      <div className="font-bold text-lg">Division {div}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {newClass.type === 'lab' && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-orange-200 uppercase tracking-wider">Batch</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['L5', 'L6', 'K5', 'K6'].map((batch) => (
                  <button
                    key={batch}
                    type="button"
                    onClick={() => setNewClass({ ...newClass, batch })}
                    className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      newClass.batch === batch
                        ? 'border-orange-400 bg-gradient-to-br from-orange-500/30 to-amber-600/20 text-orange-200 shadow-xl shadow-orange-500/25'
                        : 'border-slate-600/40 bg-gradient-to-br from-slate-800/60 to-slate-700/40 text-slate-400 hover:border-orange-400/60 hover:shadow-lg hover:shadow-orange-500/10'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2 group-hover:animate-pulse">🔬</div>
                      <div className="font-bold">{batch}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Faculty Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-rose-200 uppercase tracking-wider">Assign Faculty</label>
            <div className="relative">
              <select
                value={newClass.facultyId}
                onChange={(e) => setNewClass({ ...newClass, facultyId: e.target.value })}
                className="w-full px-5 py-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 border-2 border-rose-500/30 rounded-2xl text-white focus:border-rose-400 focus:ring-4 focus:ring-rose-400/30 transition-all duration-300 shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 appearance-none cursor-pointer"
              >
                <option value="">👨‍🏫 Select Faculty Member</option>
                {faculty.map((fac) => (
                  <option key={fac.uid} value={fac.uid}>
                    {fac.name} ({fac.designation}) - {fac.subject}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Enhanced Room */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-teal-200 uppercase tracking-wider">Room/Location</label>
            <input
              type="text"
              value={newClass.room}
              onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
              className="w-full px-5 py-4 bg-gradient-to-r from-slate-800/60 to-slate-700/40 border-2 border-teal-500/30 rounded-2xl text-white placeholder-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/30 transition-all duration-300 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20"
              placeholder="e.g., Lab 1, Room 301, Computer Lab A"
            />
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center justify-end space-x-6 pt-8 border-t border-gradient-to-r from-cyan-500/20 to-blue-500/20">
            <button
              onClick={() => setShowCreateModal(false)}
              className="group px-8 py-4 text-slate-400 hover:text-white transition-all duration-300 font-semibold rounded-xl hover:bg-slate-700/30"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Cancel</span>
              </span>
            </button>
            <button
              onClick={handleCreateClass}
              disabled={!newClass.name || !newClass.code || !newClass.facultyId || 
                (newClass.type === 'class' && !newClass.division) ||
                (newClass.type === 'lab' && !newClass.batch)}
              className="group relative bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-cyan-500/25 hover:shadow-2xl hover:shadow-cyan-500/40 disabled:shadow-none"
            >
              <span className="flex items-center space-x-3">
                <span className="text-2xl group-hover:animate-spin">✨</span>
                <span>Create {newClass.type === 'lab' ? 'Lab' : 'Class'}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Enhanced Student Assignment Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title=""
      >
        <div className="space-y-6">
          {selectedClass && (
            <>
              {/* Modal Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${
                  selectedClass.type === 'lab' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                } rounded-2xl mb-4`}>
                  <span className="text-2xl">{selectedClass.type === 'lab' ? '🔬' : '📚'}</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedClass.name}</h2>
                <p className="text-gray-400">
                  {selectedClass.type === 'class' 
                    ? `Students from Division ${selectedClass.division}` 
                    : `Students from Batch ${selectedClass.batch}`}
                </p>
              </div>

              {/* Class Info Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                  <div className="text-gray-400 text-sm">Course Code</div>
                  <div className="text-white font-semibold">{selectedClass.code}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                  <div className="text-gray-400 text-sm">Subject</div>
                  <div className="text-white font-semibold">{selectedClass.subject}</div>
                </div>
              </div>

              {/* Students List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Auto-Enrolled Students</h3>
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30">
                    {students.filter(student => 
                      selectedClass.type === 'class' 
                        ? student.division === selectedClass.division
                        : student.batch === selectedClass.batch
                    ).length} Students
                  </span>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-3 bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
                  {students
                    .filter(student => 
                      selectedClass.type === 'class' 
                        ? student.division === selectedClass.division
                        : student.batch === selectedClass.batch
                    )
                    .map((student, index) => (
                      <div key={student.uid} className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-600/20 hover:bg-gray-700/40 transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-white font-medium">{student.name}</div>
                            <div className="text-gray-400 text-sm">Roll No: {student.rollNo}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400 text-sm">{student.studentId}</span>
                          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            <span className="text-green-400 text-sm font-medium">Enrolled</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {students.filter(student => 
                    selectedClass.type === 'class' 
                      ? student.division === selectedClass.division
                      : student.batch === selectedClass.batch
                  ).length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">👥</div>
                      <div className="text-gray-400">No students found for this {selectedClass.type === 'class' ? 'division' : 'batch'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t border-gray-700/50">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  ✓ Done
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ClassManagement;