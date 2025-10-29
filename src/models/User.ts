import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "faculty" | "student";

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  // Student specific fields
  studentId?: string;
  year?: string;
  department?: string;
  division?: string;
  batch?: string;
  rollNo?: string;
  electiveSubject?: string;
  // Faculty specific fields
  employeeId?: string;
  designation?: string;
  subject?: string;
  assignedClasses?: string[]; // Array of class IDs
  // Contact information
  phone?: string;
  profileImage?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: UserRole;
  approved?: boolean;
  studentId?: string;
  year?: string;
  department?: string;
  division?: string;
  batch?: string;
  rollNo?: string;
  electiveSubject?: string;
  employeeId?: string;
  designation?: string;
  subject?: string;
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  studentId?: string;
  year?: string;
  department?: string;
  division?: string;
  batch?: string;
  rollNo?: string;
  electiveSubject?: string;
  employeeId?: string;
  designation?: string;
  subject?: string;
  assignedClasses?: string[];
  approved?: boolean;
}