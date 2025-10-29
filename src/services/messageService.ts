import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Message, MessageFilter, MessageStats } from '@/models/Message';

export class MessageService {
  private static readonly COLLECTION_NAME = 'messages';

  // Send a message from faculty to admin
  static async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'status'>): Promise<string> {
    try {
      const messageDoc = {
        ...messageData,
        timestamp: Timestamp.now(),
        status: 'sent' as const
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), messageDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  // Get messages with filters
  static async getMessages(filter: MessageFilter = {}): Promise<Message[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      // Apply filters
      if (filter.senderId) {
        q = query(q, where('senderId', '==', filter.senderId));
      }
      if (filter.recipientId) {
        q = query(q, where('recipientId', '==', filter.recipientId));
      }
      if (filter.type) {
        q = query(q, where('type', '==', filter.type));
      }
      if (filter.status) {
        q = query(q, where('status', '==', filter.status));
      }
      if (filter.priority) {
        q = query(q, where('priority', '==', filter.priority));
      }

      // Order by timestamp (newest first)
      q = query(q, orderBy('timestamp', 'desc'));

      // Apply limit
      if (filter.limit) {
        q = query(q, firestoreLimit(filter.limit));
      }

      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          readAt: data.readAt?.toDate(),
          acknowledgedAt: data.acknowledgedAt?.toDate(),
          resolvedAt: data.resolvedAt?.toDate(),
          responseAt: data.responseAt?.toDate(),
          metadata: {
            ...data.metadata,
            dateFrom: data.metadata?.dateFrom?.toDate(),
            dateTo: data.metadata?.dateTo?.toDate()
          }
        } as Message);
      });

      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  // Mark message as read
  static async markAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, this.COLLECTION_NAME, messageId);
      await updateDoc(messageRef, {
        status: 'read',
        readAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  // Admin acknowledges message
  static async acknowledgeMessage(messageId: string, response?: string): Promise<void> {
    try {
      const messageRef = doc(db, this.COLLECTION_NAME, messageId);
      const updateData: any = {
        status: 'acknowledged',
        acknowledgedAt: Timestamp.now()
      };

      if (response) {
        updateData.adminResponse = response;
        updateData.responseAt = Timestamp.now();
      }

      await updateDoc(messageRef, updateData);
    } catch (error) {
      console.error('Error acknowledging message:', error);
      throw new Error('Failed to acknowledge message');
    }
  }

  // Admin resolves message
  static async resolveMessage(messageId: string, response?: string): Promise<void> {
    try {
      const messageRef = doc(db, this.COLLECTION_NAME, messageId);
      const updateData: any = {
        status: 'resolved',
        resolvedAt: Timestamp.now()
      };

      if (response) {
        updateData.adminResponse = response;
        updateData.responseAt = Timestamp.now();
      }

      await updateDoc(messageRef, updateData);
    } catch (error) {
      console.error('Error resolving message:', error);
      throw new Error('Failed to resolve message');
    }
  }

  // Get message statistics for admin dashboard
  static async getMessageStats(adminId: string): Promise<MessageStats> {
    try {
      const messages = await this.getMessages({ recipientId: adminId });
      
      const unreadMessages = messages.filter(m => m.status === 'sent').length;
      const urgentMessages = messages.filter(m => m.priority === 'urgent' && m.status !== 'resolved').length;
      const recentMessages = messages.slice(0, 5);

      return {
        totalMessages: messages.length,
        unreadMessages,
        urgentMessages,
        recentMessages
      };
    } catch (error) {
      console.error('Error getting message stats:', error);
      throw new Error('Failed to fetch message statistics');
    }
  }

  // Get messages for faculty (sent by them)
  static async getFacultyMessages(facultyId: string): Promise<Message[]> {
    return this.getMessages({ senderId: facultyId });
  }

  // Get messages for admin (received by them)
  static async getAdminMessages(adminId: string): Promise<Message[]> {
    return this.getMessages({ recipientId: adminId });
  }

  // Subscribe to messages in real-time
  static subscribeToMessages(
    filter: MessageFilter,
    callback: (messages: Message[]) => void
  ): () => void {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      // Apply filters
      if (filter.senderId) {
        q = query(q, where('senderId', '==', filter.senderId));
      }
      if (filter.recipientId) {
        q = query(q, where('recipientId', '==', filter.recipientId));
      }
      if (filter.status) {
        q = query(q, where('status', '==', filter.status));
      }

      // Order by timestamp
      q = query(q, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            readAt: data.readAt?.toDate(),
            acknowledgedAt: data.acknowledgedAt?.toDate(),
            resolvedAt: data.resolvedAt?.toDate(),
            responseAt: data.responseAt?.toDate(),
            metadata: {
              ...data.metadata,
              dateFrom: data.metadata?.dateFrom?.toDate(),
              dateTo: data.metadata?.dateTo?.toDate()
            }
          } as Message);
        });
        callback(messages);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      throw new Error('Failed to subscribe to messages');
    }
  }

  // Delete a message
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }
}