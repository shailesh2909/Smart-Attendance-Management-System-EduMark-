export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: 'faculty' | 'admin';
  recipientId: string;
  recipientRole: 'faculty' | 'admin';
  subject: string;
  message: string;
  type: 'leave_request' | 'busy_notification' | 'technical_issue' | 'general' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'sent' | 'read' | 'acknowledged' | 'resolved';
  timestamp: Date;
  readAt?: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  adminResponse?: string;
  responseAt?: Date;
  attachments?: string[];
  metadata?: {
    classesAffected?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    duration?: string;
    reason?: string;
  };
}

export interface MessageStats {
  totalMessages: number;
  unreadMessages: number;
  urgentMessages: number;
  recentMessages: Message[];
}

export interface MessageFilter {
  senderId?: string;
  recipientId?: string;
  type?: Message['type'];
  status?: Message['status'];
  priority?: Message['priority'];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}