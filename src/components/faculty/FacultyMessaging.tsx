"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MessageService } from '@/services/messageService';
import { UserService } from '@/services/userService';
import { ClassService } from '@/services/classService';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { Class } from '@/models/Class';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';

interface MessageFormData {
  subject: string;
  message: string;
  type: Message['type'];
  priority: Message['priority'];
  classesAffected: string[];
  dateFrom?: string;
  dateTo?: string;
  duration?: string;
  reason?: string;
}

export default function FacultyMessaging() {
  const { user, userProfile } = useAuth();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [facultyClasses, setFacultyClasses] = useState<Class[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState<MessageFormData>({
    subject: '',
    message: '',
    type: 'general',
    priority: 'medium',
    classesAffected: [],
    duration: '',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Load admins
      const adminUsers = await UserService.getUsers({ role: 'admin', approved: true });
      setAdmins(adminUsers);
      if (adminUsers.length > 0) {
        setSelectedAdmin(adminUsers[0].uid);
      }

      // Load faculty messages
      const facultyMessages = await MessageService.getFacultyMessages(user.uid);
      setMessages(facultyMessages);

      // Load faculty classes
      const classes = await ClassService.getClasses({ facultyId: user.uid });
      setFacultyClasses(classes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedAdmin || !formData.subject || !formData.message) return;

    try {
      setSending(true);
      
      const adminUser = admins.find(a => a.uid === selectedAdmin);
      if (!adminUser) return;

      const messageData: Omit<Message, 'id' | 'timestamp' | 'status'> = {
        senderId: user!.uid,
        senderName: userProfile?.name || user!.email || 'Faculty',
        senderRole: 'faculty',
        recipientId: selectedAdmin,
        recipientRole: 'admin',
        subject: formData.subject,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        metadata: {
          classesAffected: formData.classesAffected,
          dateFrom: formData.dateFrom ? new Date(formData.dateFrom) : undefined,
          dateTo: formData.dateTo ? new Date(formData.dateTo) : undefined,
          duration: formData.duration,
          reason: formData.reason
        }
      };

      await MessageService.sendMessage(messageData);
      
      // Reset form
      setFormData({
        subject: '',
        message: '',
        type: 'general',
        priority: 'medium',
        classesAffected: [],
        duration: '',
        reason: ''
      });
      
      setShowMessageModal(false);
      loadData(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getMessageTypeIcon = (type: Message['type']) => {
    switch (type) {
      case 'leave_request': return '🏖️';
      case 'busy_notification': return '⏰';
      case 'technical_issue': return '🔧';
      case 'urgent': return '🚨';
      default: return '💬';
    }
  };

  const getMessageTypeColor = (type: Message['type']) => {
    switch (type) {
      case 'leave_request': return 'bg-blue-500/20 text-blue-300';
      case 'busy_notification': return 'bg-orange-500/20 text-orange-300';
      case 'technical_issue': return 'bg-red-500/20 text-red-300';
      case 'urgent': return 'bg-red-600/30 text-red-200';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getPriorityColor = (priority: Message['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'sent': return 'text-blue-400';
      case 'read': return 'text-yellow-400';
      case 'acknowledged': return 'text-green-400';
      case 'resolved': return 'text-emerald-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">📨 Send Message to Admin</h2>
          <p className="text-gray-400">Communicate with administration about leave, issues, or urgent matters</p>
        </div>
        <button
          onClick={() => setShowMessageModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          ✉️ New Message
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              type: 'leave_request',
              priority: 'medium',
              subject: 'Leave Request'
            }));
            setShowMessageModal(true);
          }}
          className="group bg-gradient-to-br from-blue-900/50 to-blue-800/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300"
        >
          <div className="text-center">
            <div className="text-3xl mb-3 group-hover:animate-bounce">🏖️</div>
            <h3 className="text-blue-300 font-semibold">Request Leave</h3>
            <p className="text-blue-200/70 text-sm mt-1">Apply for leave or time off</p>
          </div>
        </button>

        <button
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              type: 'busy_notification',
              priority: 'high',
              subject: 'Busy/Unavailable Notification'
            }));
            setShowMessageModal(true);
          }}
          className="group bg-gradient-to-br from-orange-900/50 to-orange-800/30 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300"
        >
          <div className="text-center">
            <div className="text-3xl mb-3 group-hover:animate-pulse">⏰</div>
            <h3 className="text-orange-300 font-semibold">Report Busy</h3>
            <p className="text-orange-200/70 text-sm mt-1">Notify about busy schedule</p>
          </div>
        </button>

        <button
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              type: 'technical_issue',
              priority: 'high',
              subject: 'Technical Issue Report'
            }));
            setShowMessageModal(true);
          }}
          className="group bg-gradient-to-br from-red-900/50 to-red-800/30 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20 hover:border-red-400/40 transition-all duration-300"
        >
          <div className="text-center">
            <div className="text-3xl mb-3 group-hover:animate-spin">🔧</div>
            <h3 className="text-red-300 font-semibold">Technical Issue</h3>
            <p className="text-red-200/70 text-sm mt-1">Report system problems</p>
          </div>
        </button>

        <button
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              type: 'urgent',
              priority: 'urgent',
              subject: 'Urgent Matter'
            }));
            setShowMessageModal(true);
          }}
          className="group bg-gradient-to-br from-red-900/60 to-pink-800/40 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all duration-300"
        >
          <div className="text-center">
            <div className="text-3xl mb-3 group-hover:animate-bounce">🚨</div>
            <h3 className="text-red-200 font-semibold">Urgent</h3>
            <p className="text-red-200/70 text-sm mt-1">Immediate attention needed</p>
          </div>
        </button>
      </div>

      {/* Message History */}
      <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-gray-600/30 overflow-hidden">
        <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
          <h3 className="text-xl font-semibold text-white">📝 Message History</h3>
        </div>
        
        <div className="p-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-400">No messages sent yet</p>
              <p className="text-gray-500 text-sm">Click "New Message" to send your first message to admin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getMessageTypeIcon(message.type)}</span>
                      <div>
                        <h4 className="text-white font-semibold">{message.subject}</h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMessageTypeColor(message.type)}`}>
                            {message.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(message.priority)}`}>
                            {message.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${getStatusColor(message.status)}`}>
                        {message.status.toUpperCase()}
                      </span>
                      <p className="text-gray-500 text-xs mt-1">
                        {message.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-3">{message.message}</p>
                  
                  {message.adminResponse && (
                    <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/20">
                      <h5 className="text-blue-300 font-medium mb-2">📋 Admin Response:</h5>
                      <p className="text-blue-200">{message.adminResponse}</p>
                      {message.responseAt && (
                        <p className="text-blue-400/70 text-xs mt-2">
                          Responded on {message.responseAt.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title=""
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">✉️ Send Message to Admin</h2>
            <p className="text-gray-400">Communicate important information to administration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admin Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-cyan-200">Admin</label>
              <select
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-500/30 rounded-xl text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
              >
                {admins.map((admin) => (
                  <option key={admin.uid} value={admin.uid}>
                    {admin.name} ({admin.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Message Type */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-blue-200">Message Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Message['type'] }))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-blue-500/30 rounded-xl text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
              >
                <option value="general">💬 General Message</option>
                <option value="leave_request">🏖️ Leave Request</option>
                <option value="busy_notification">⏰ Busy/Unavailable</option>
                <option value="technical_issue">🔧 Technical Issue</option>
                <option value="urgent">🚨 Urgent Matter</option>
              </select>
            </div>
          </div>

          {/* Priority and Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-purple-200">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Message['priority'] }))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-xl text-white focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🟠 High Priority</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-green-200">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-green-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400/50 focus:border-green-400"
                placeholder="Enter subject..."
              />
            </div>
          </div>

          {/* Affected Classes (for leave/busy notifications) */}
          {(formData.type === 'leave_request' || formData.type === 'busy_notification') && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-orange-200">Affected Classes</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {facultyClasses.map((cls) => (
                  <label key={cls.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.classesAffected.includes(cls.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            classesAffected: [...prev.classesAffected, cls.id!]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            classesAffected: prev.classesAffected.filter(id => id !== cls.id)
                          }));
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                    <span className="text-sm text-white">{cls.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Date Range (for leave requests) */}
          {formData.type === 'leave_request' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pink-200">From Date</label>
                <input
                  type="date"
                  value={formData.dateFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-pink-500/30 rounded-xl text-white focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pink-200">To Date</label>
                <input
                  type="date"
                  value={formData.dateTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-pink-500/30 rounded-xl text-white focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pink-200">Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400"
                  placeholder="e.g., 3 days"
                />
              </div>
            </div>
          )}

          {/* Reason (for leave/busy) */}
          {(formData.type === 'leave_request' || formData.type === 'busy_notification') && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-yellow-200">Reason</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
                placeholder="Brief reason for leave/being busy..."
              />
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-teal-200">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={5}
              className="w-full px-4 py-3 bg-gray-800/50 border border-teal-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 resize-none"
              placeholder="Detailed message to admin..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700/50">
            <button
              onClick={() => setShowMessageModal(false)}
              disabled={sending}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSendMessage}
              disabled={sending || !formData.subject || !formData.message || !selectedAdmin}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}