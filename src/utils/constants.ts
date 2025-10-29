// App Configuration
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "EduMark",
  collegeName: process.env.NEXT_PUBLIC_COLLEGE_NAME || "PICT College",
  version: "1.0.0",
  description: "Student Attendance Management System",
};

// User Roles
export const USER_ROLES = {
  ADMIN: "admin" as const,
  FACULTY: "faculty" as const,
  STUDENT: "student" as const,
};

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: "present" as const,
  ABSENT: "absent" as const,
  LATE: "late" as const,
};

// Academic Configuration
export const ACADEMIC_CONFIG = {
  years: ["FE", "SE", "TE", "BE"],
  semesters: ["1", "2"],
  divisions: ["5", "6"],
  batches: {
    "5": ["K5", "L5", "M5", "N5"],
    "6": ["K6", "L6", "M6", "N6"]
  },
  departments: [
    "Computer Engineering",
    "Information Technology", 
    "Electronics & Telecommunication",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Instrumentation & Control",
  ],
  minimumAttendance: 75, // Minimum required attendance percentage
};

// Time Slots
export const TIME_SLOTS = [
  { label: "09:00 - 10:00", start: "09:00", end: "10:00" },
  { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
  { label: "11:15 - 12:15", start: "11:15", end: "12:15" },
  { label: "12:15 - 13:15", start: "12:15", end: "13:15" },
  { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
  { label: "15:00 - 16:00", start: "15:00", end: "16:00" },
  { label: "16:15 - 17:15", start: "16:15", end: "17:15" },
];

// Days of Week
export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Navigation Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  WAITING_APPROVAL: "/waiting-approval",
  
  // Admin Routes
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_CLASSES: "/admin/classes",
  ADMIN_REPORTS: "/admin/reports",
  
  // Faculty Routes
  FACULTY: "/faculty",
  FACULTY_CLASSES: "/faculty/classes",
  FACULTY_ATTENDANCE: "/faculty/mark-attendance",
  FACULTY_REPORTS: "/faculty/reports",
  
  // Student Routes
  STUDENT: "/student",
  STUDENT_ATTENDANCE: "/student/attendance",
  STUDENT_PROFILE: "/student/profile",
};

// Dashboard Card Colors
export const CARD_COLORS = {
  PRIMARY: "bg-gradient-to-br from-blue-500 to-blue-600",
  SUCCESS: "bg-gradient-to-br from-green-500 to-green-600",
  WARNING: "bg-gradient-to-br from-yellow-500 to-yellow-600",
  DANGER: "bg-gradient-to-br from-red-500 to-red-600",
  INFO: "bg-gradient-to-br from-purple-500 to-purple-600",
  SECONDARY: "bg-gradient-to-br from-gray-500 to-gray-600",
};

// Status Colors
export const STATUS_COLORS = {
  PRESENT: "text-green-600 bg-green-100",
  ABSENT: "text-red-600 bg-red-100", 
  LATE: "text-yellow-600 bg-yellow-100",
  PENDING: "text-orange-600 bg-orange-100",
  APPROVED: "text-green-600 bg-green-100",
  REJECTED: "text-red-600 bg-red-100",
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please fill in all required fields correctly.",
  GENERIC: "An unexpected error occurred. Please try again.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Successfully logged in!",
  LOGOUT: "Successfully logged out!",
  PROFILE_UPDATED: "Profile updated successfully!",
  ATTENDANCE_MARKED: "Attendance marked successfully!",
  CLASS_CREATED: "Class created successfully!",
  USER_APPROVED: "User approved successfully!",
  USER_REJECTED: "User rejected successfully!",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: "edumark_theme",
  SIDEBAR_COLLAPSED: "edumark_sidebar_collapsed",
  LAST_VISITED: "edumark_last_visited",
};

// API Limits
export const API_LIMITS = {
  MAX_BATCH_SIZE: 500,
  QUERY_LIMIT: 50,
  SEARCH_DEBOUNCE: 300,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "MMM DD, YYYY",
  INPUT: "YYYY-MM-DD",
  DATETIME: "MMM DD, YYYY HH:mm",
  TIME: "HH:mm",
};