# 🎓 Smart Attendance Management System

A comprehensive, real-time attendance management system built with **Next.js 14**, **Firebase**, and **TypeScript**. This system provides role-based dashboards for administrators, faculty, and students with advanced features like CSV bulk imports, real-time messaging, and detailed analytics.

## 🚀 Features

### 📊 **Admin Dashboard**
- **User Management**: View all users with role-based filtering
- **CSV Bulk Import**: Upload student and faculty data via CSV files
- **Class Management**: Create, edit, and manage academic classes
- **Attendance Overview**: Real-time attendance statistics and analytics
- **Activity Logging**: Track all system activities with timestamps
- **Dashboard Stats**: Comprehensive metrics and data visualization

### 👨‍🏫 **Faculty Dashboard**
- **Class Management**: View assigned classes and student enrollment
- **Attendance Marking**: Mark attendance with real-time student lists
- **Reports Generation**: Detailed attendance reports with analytics
- **Messaging System**: Send messages to admin for leave requests, schedule changes
- **Student Analytics**: Individual and class performance metrics

### 👨‍🎓 **Student Dashboard**
- **Attendance Tracking**: View personal attendance across all subjects
- **Class Overview**: See enrolled classes and schedules
- **Performance Analytics**: Attendance percentage and trends
- **Profile Management**: Update personal information

### 🔐 **Authentication & Security**
- **Firebase Authentication**: Secure login with email/password
- **Role-Based Access Control**: Admin, Faculty, Student roles
- **Protected Routes**: Role-specific page access
- **Session Management**: Automatic logout and token refresh

## 🏗️ Project Architecture

### 📁 **Directory Structure**

```
src/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # Backend API Routes
│   │   ├── admin/               # Admin-specific APIs
│   │   │   ├── stats/           # Dashboard statistics
│   │   │   ├── users/           # User management
│   │   │   └── activity/        # Activity logging
│   │   ├── cleanup-users/       # User cleanup utilities
│   │   ├── debug-users/         # User debugging tools
│   │   └── setup-demo/          # Demo data setup
│   ├── admin/                   # Admin dashboard pages
│   ├── faculty/                 # Faculty dashboard pages  
│   ├── student/                 # Student dashboard pages
│   └── login/                   # Authentication pages
├── components/                   # Reusable UI Components
│   ├── admin/                   # Admin-specific components
│   ├── faculty/                 # Faculty-specific components
│   ├── auth/                    # Authentication components
│   ├── ui/                      # Generic UI components
│   └── upload/                  # CSV upload components
├── context/                     # React Context for state management
├── hooks/                       # Custom React hooks
├── lib/                         # Configuration and utilities
├── models/                      # TypeScript data models
├── services/                    # Business logic and API calls
├── styles/                      # Global CSS styles
└── utils/                       # Utility functions and constants
```

## 🔧 Backend Architecture

### 📡 **API Routes (CRUD Operations)**

#### **1. Admin APIs (`/src/app/api/admin/`)**

##### **User Management API** (`users/route.ts`)
- **GET** `/api/admin/users` - Fetch all users with filters (role, department)
- Uses `UserService.getUsers(filters)` to retrieve user data from Firestore

##### **Statistics API** (`stats/route.ts`)
- **GET** `/api/admin/stats` - Get dashboard statistics
- Uses `AdminService.getDashboardStats()` to calculate metrics

##### **Activity Logging API** (`activity/route.ts`)
- **GET** `/api/admin/activity` - Fetch recent activities
- **POST** `/api/admin/activity` - Log new activity
- Uses Firestore to store and retrieve activity logs

### 🏢 **Services Layer (Business Logic)**

#### **1. UserService** (`/src/services/userService.ts`)
```typescript
export class UserService {
  // CREATE - Add new user to Firestore
  static async createUser(uid: string, userData: CreateUserData): Promise<void>
  
  // READ - Get user by ID from Firestore
  static async getUserById(uid: string): Promise<User | null>
  
  // READ - Get all users with optional filters
  static async getUsers(filters?: {role?, department?}): Promise<User[]>
  
  // UPDATE - Update user data in Firestore
  static async updateUser(uid: string, userData: Partial<User>): Promise<void>
  
  // DELETE - Remove user from Firestore and Firebase Auth
  static async deleteUser(uid: string): Promise<void>
  
  // SEARCH - Find users by search term
  static async searchUsers(searchTerm: string): Promise<User[]>
}
```

#### **2. ClassService** (`/src/services/classService.ts`)
```typescript
export class ClassService {
  // CREATE - Create new class in Firestore
  static async createClass(classData: CreateClassData): Promise<string>
  
  // READ - Get class by ID
  static async getClassById(classId: string): Promise<Class | null>
  
  // READ - Get all classes with filters (facultyId, department, etc.)
  static async getClasses(filters?: {facultyId?, department?}): Promise<Class[]>
  
  // UPDATE - Update class data
  static async updateClass(classId: string, classData: UpdateClassData): Promise<void>
  
  // DELETE - Remove class and all dependencies
  static async deleteClass(classId: string): Promise<void>
  
  // ASSIGN - Add/remove students from class
  static async addStudentToClass(classId: string, studentId: string): Promise<void>
  static async removeStudentFromClass(classId: string, studentId: string): Promise<void>
}
```

#### **3. AttendanceService** (`/src/services/attendanceService.ts`)
```typescript
export class AttendanceService {
  // CREATE - Mark attendance for a class session
  static async createAttendance(attendanceData: CreateAttendanceData): Promise<string>
  
  // READ - Get attendance by ID
  static async getAttendanceById(attendanceId: string): Promise<Attendance | null>
  
  // READ - Get attendance records with filters
  static async getAttendanceRecords(filters?: {
    classId?, facultyId?, studentId?, startDate?, endDate?
  }): Promise<Attendance[]>
  
  // UPDATE - Update attendance record (modify student status)
  static async updateAttendance(attendanceId: string, data: UpdateAttendanceData): Promise<void>
  
  // DELETE - Remove attendance record
  static async deleteAttendance(attendanceId: string): Promise<void>
  
  // ANALYTICS - Get comprehensive attendance statistics
  static async getStudentAttendanceStats(studentId: string): Promise<AttendanceStats[]>
  static async getClassAttendanceStats(classId: string): Promise<ClassAttendanceStats>
}
```

#### **4. MessageService** (`/src/services/messageService.ts`)
```typescript
export class MessageService {
  // CREATE - Send new message
  static async sendMessage(messageData: CreateMessageData): Promise<string>
  
  // READ - Get messages for user with pagination
  static async getMessages(userId: string, limit?: number): Promise<Message[]>
  
  // UPDATE - Mark message as read/acknowledged
  static async markAsRead(messageId: string): Promise<void>
  static async acknowledgeMessage(messageId: string): Promise<void>
  
  // REAL-TIME - Subscribe to message updates using Firestore listeners
  static subscribeToMessages(userId: string, callback: (messages: Message[]) => void)
}
```

### 🗄️ **Database Schema (Firestore Collections)**

#### **1. Users Collection** (`/users/{uid}`)
```typescript
interface User {
  uid: string;                    // Document ID (matches Firebase Auth UID)
  name: string;
  email: string;
  role: "admin" | "faculty" | "student";
  createdAt: Timestamp;
  
  // Student-specific fields
  studentId?: string;             // Unique student identifier
  year?: string;                  // Academic year (FE, SE, TE, BE)
  department?: string;            // Computer, IT, Electronics, etc.
  division?: string;              // Division (5 or 6)
  batch?: string;                 // Batch (K5, L5, M5, N5, K6, L6, M6, N6)
  rollNo?: string;
  electiveSubject?: string;
  
  // Faculty-specific fields
  employeeId?: string;            // Unique faculty identifier
  designation?: string;           // Professor, Associate Professor, etc.
  subject?: string;               // Primary subject
  assignedClasses?: string[];     // Array of class document IDs
}
```

#### **2. Classes Collection** (`/classes/{classId}`)
```typescript
interface Class {
  id: string;                     // Auto-generated document ID
  name: string;                   // Class name (e.g., "DBMS Theory", "Java Lab")
  code: string;                   // Class code (e.g., "CS301", "IT302")
  type: "class" | "lab";
  department: string;             // Department offering the class
  year: string;                   // Academic year for the class
  semester: string;               // Semester (I, II)
  facultyId: string;             // Reference to Users collection
  enrolledStudents: string[];     // Array of student UIDs
  schedule: {
    day: string;                  // Monday, Tuesday, etc.
    timeSlot: string;             // Time range (e.g., "09:00-10:00")
  };
  isActive: boolean;              // Whether class is currently active
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

#### **3. Attendance Collection** (`/attendance/{attendanceId}`)
```typescript
interface Attendance {
  id: string;                     // Auto-generated document ID
  classId: string;               // Reference to Classes collection
  facultyId: string;             // Reference to Users collection (faculty who marked)
  date: Timestamp;               // Date of attendance session
  timeSlot: string;              // Time slot of the session
  sessionNumber: number;          // Sequential session number
  
  // Attendance records for all students
  records: AttendanceRecord[];    // Array of student attendance
  
  // Summary statistics
  totalStudents: number;          // Total enrolled students
  presentCount: number;           // Students marked present
  absentCount: number;            // Students marked absent
  lateCount: number;              // Students marked late
  attendancePercentage: number;   // Calculated percentage
  
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

interface AttendanceRecord {
  studentId: string;             // Reference to Users collection
  status: "present" | "absent" | "late";
  markedAt: Timestamp;           // When attendance was marked
  remarks?: string;              // Optional remarks
}
```

#### **4. Messages Collection** (`/messages/{messageId}`)
```typescript
interface Message {
  id: string;                     // Auto-generated document ID
  senderId: string;              // Reference to Users collection (sender)
  recipientId: string;           // Reference to Users collection (recipient)
  subject: string;
  message: string;
  type: "leave" | "schedule_change" | "technical_issue" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  status: "sent" | "delivered" | "read" | "acknowledged";
  timestamp: Timestamp;
  
  // Additional metadata based on message type
  metadata?: {
    classesAffected?: string[];   // For schedule changes
    duration?: string;            // For leave requests
    reason?: string;              // General reason
    startDate?: Timestamp;        // For leave/schedule changes
    endDate?: Timestamp;
  };
}
```

#### **5. Activity Logs Collection** (`/activity_logs/{activityId}`)
```typescript
interface ActivityLog {
  id: string;                     // Auto-generated document ID
  type: "class" | "attendance" | "user" | "system";
  message: string;               // Human-readable activity description
  timestamp: Timestamp;
  userId?: string;               // Reference to Users collection (if applicable)
  metadata?: {
    entityId?: string;            // ID of related entity (class, attendance, etc.)
    entityType?: string;          // Type of related entity
    changes?: any;                // Data changes made
  };
}
```

### 🔥 **Firebase Configuration & Setup**

#### **Client-side Firebase** (`/src/lib/firebaseClient.ts`)
```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (prevent re-initialization on hot reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
```

#### **Server-side Firebase Admin** (`/src/lib/firebaseAdmin.ts`)
```typescript
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK for server-side operations
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
```

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.local` and add your Firebase configuration
   - Ensure Firebase project is created with Authentication and Firestore enabled

3. **Firebase Setup**
   - Enable Authentication with Email/Password
   - Create Firestore database
   - Apply security rules (see below)

4. **Run Development Server**
   ```bash
   npm run dev
   ```

### 📋 Firestore Security Rules

Copy these rules to your Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isApproved() {
      return isAuthenticated() && 
             resource.data.approved == true;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && 
             request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
    }
    
    function isFaculty() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'faculty' &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
    }
    
    function isStudent() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'student' &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
    }

    // Users collection
    match /users/{userId} {
      // Allow user to read their own profile
      allow read: if isOwner(userId);
      
      // Allow admin to read/write all users
      allow read, write: if isAdmin();
      
      // Allow user to create their own profile (signup)
      allow create: if isOwner(userId) && 
                       request.resource.data.uid == userId &&
                       request.resource.data.approved == false;
      
      // Allow user to update their own profile (limited fields)
      allow update: if isOwner(userId) && 
                       !('role' in request.resource.data.diff(resource.data).changedKeys()) &&
                       !('approved' in request.resource.data.diff(resource.data).changedKeys()) &&
                       !('uid' in request.resource.data.diff(resource.data).changedKeys());
    }

    // Classes collection
    match /classes/{classId} {
      // Admin can read/write all classes
      allow read, write: if isAdmin();
      
      // Faculty can read classes they're assigned to
      allow read: if isFaculty() && 
                     resource.data.facultyId == request.auth.uid;
      
      // Students can read classes they're enrolled in
      allow read: if isStudent() && 
                     request.auth.uid in resource.data.students;
    }

    // Attendance collection
    match /attendance/{attendanceId} {
      // Admin can read/write all attendance
      allow read, write: if isAdmin();
      
      // Faculty can read/write attendance for their classes
      allow read, write: if isFaculty() && 
                            resource.data.facultyId == request.auth.uid;
      
      // Students can read attendance records they're part of
      allow read: if isStudent() && 
                     request.auth.uid in resource.data.records[].studentId;
    }

    // Reports collection (if you decide to store generated reports)
    match /reports/{reportId} {
      // Admin can read/write all reports
      allow read, write: if isAdmin();
      
      // Faculty can read reports for their classes
      allow read: if isFaculty() && 
                     resource.data.facultyId == request.auth.uid;
      
      // Students can read their own reports
      allow read: if isStudent() && 
                     resource.data.studentId == request.auth.uid;
    }
  }
}
```

### 🗄️ Firestore Data Structure

#### Users Collection (`/users/{uid}`)
```json
{
  "uid": "user_firebase_uid",
  "name": "John Doe",
  "email": "john@pict.edu",
  "role": "student", // "admin" | "faculty" | "student"
  "approved": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  // Student specific
  "studentId": "S001",
  "year": "TE",
  "department": "Computer Engineering",
  // Faculty specific
  "employeeId": "E001",
  "designation": "Assistant Professor",
  "assignedClasses": ["class_id_1", "class_id_2"],
  // Optional
  "phone": "+91 9876543210",
  "profileImage": "url_to_image"
}
```

#### Classes Collection (`/classes/{class_id}`)
```json
{
  "id": "class_auto_generated_id",
  "name": "Data Structures and Algorithms",
  "code": "CS301",
  "department": "Computer Engineering",
  "year": "TE",
  "semester": "1",
  "facultyId": "faculty_uid",
  "facultyName": "Dr. Smith",
  "schedule": [
    {
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "10:00",
      "room": "Room 101"
    }
  ],
  "students": ["student_uid_1", "student_uid_2"],
  "totalSessions": 25,
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Attendance Collection (`/attendance/{attendance_id}`)
```json
{
  "id": "attendance_auto_generated_id",
  "classId": "class_id",
  "className": "Data Structures and Algorithms",
  "classCode": "CS301",
  "facultyId": "faculty_uid",
  "facultyName": "Dr. Smith",
  "date": "timestamp",
  "sessionNumber": 1,
  "topic": "Introduction to Arrays",
  "duration": 60,
  "records": [
    {
      "studentId": "student_uid",
      "studentName": "John Doe",
      "status": "present", // "present" | "absent" | "late"
      "remarks": "Optional notes"
    }
  ],
  "totalStudents": 30,
  "presentCount": 28,
  "absentCount": 2,
  "lateCount": 0,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 🔧 Sample Data Creation

You can create sample data using Firebase Console or run this in your browser console after login:

```javascript
// Create Admin User (manually through Firebase Console)
// UID: admin_uid
{
  "uid": "admin_uid",
  "name": "System Admin",
  "email": "admin@pict.edu",
  "role": "admin",
  "approved": true,
  "createdAt": new Date()
}

// Create Faculty User
{
  "uid": "faculty_uid", 
  "name": "Dr. John Smith",
  "email": "faculty@pict.edu",
  "role": "faculty",
  "approved": true,
  "employeeId": "F001",
  "designation": "Assistant Professor",
  "phone": "+91 9876543210",
  "createdAt": new Date()
}

// Create Student User
{
  "uid": "student_uid",
  "name": "Alice Johnson", 
  "email": "student@pict.edu",
  "role": "student",
  "approved": true,
  "studentId": "S001",
  "year": "TE",
  "department": "Computer Engineering",
  "phone": "+91 9876543211",
  "createdAt": new Date()
}
```

### 🎨 Features Implemented

#### ✅ Authentication & Authorization
- Firebase Authentication with email/password
- Role-based access control (Admin, Faculty, Student)
- Account approval workflow
- Protected routes and components

#### ✅ User Management (Admin)
- View all users with filtering
- Approve/reject user registrations
- User search and bulk operations
- Real-time user statistics

#### ✅ Class Management (Admin)
- Create and manage classes
- Assign faculty to classes
- Auto-enroll students by department/year
- Class scheduling and room management

#### ✅ Attendance Management (Faculty)
- Mark attendance for assigned classes
- View attendance history and reports
- Bulk attendance operations
- Session management with topics

#### ✅ Student Dashboard
- View personal attendance across all classes
- Attendance percentage and statistics
- Profile management
- Class schedule viewing

#### ✅ Reporting System
- Comprehensive attendance reports
- Export functionality (CSV/PDF ready)
- Statistical analysis and trends
- Low attendance alerts

### 🚀 Advanced Features

#### Real-time Updates
- Uses Firestore real-time listeners
- Instant updates across all connected clients
- Live dashboard statistics

#### Responsive Design
- Mobile-first approach
- Optimized for tablets and desktops
- Touch-friendly interface

#### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Retry mechanisms and loading states

### 📱 Mobile Responsiveness

The application is fully responsive and works on:
- ✅ Mobile phones (320px+)
- ✅ Tablets (768px+)
- ✅ Desktops (1024px+)
- ✅ Large screens (1440px+)

### 🔒 Security Features

- Firestore security rules
- Client-side input validation
- XSS protection
- CSRF protection via Firebase
- Rate limiting (Firebase default)

### 🎯 Performance Optimizations

- Code splitting with Next.js
- Image optimization
- Bundle optimization
- Firestore query optimization
- Caching strategies

### 📊 Analytics (Optional)

Firebase Analytics is configured but only loads on client-side:
- User engagement tracking
- Feature usage analytics
- Performance monitoring

### 🐛 Troubleshooting

#### Common Issues:

1. **Firebase Config Error**
   - Ensure all environment variables are set
   - Check Firebase project settings

2. **Authentication Issues**
   - Verify email/password authentication is enabled
   - Check Firestore security rules

3. **Permission Denied**
   - Verify user approval status
   - Check role-based access in security rules

4. **Build Errors**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `npm ci`

### 🚀 Deployment

#### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

#### Other Platforms
```bash
npm run build
npm start
```

### 📞 Support

For issues and questions:
- Email: support@pict.edu
- Phone: +91 20 2769 0062
- Office Hours: Mon-Fri, 9:00 AM - 5:00 PM

---

**EduMark v1.0.0** - Built with Next.js 15, React 18, TypeScript, Tailwind CSS, and Firebase.