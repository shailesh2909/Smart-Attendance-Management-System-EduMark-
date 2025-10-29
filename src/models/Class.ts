import { Timestamp } from "firebase/firestore";

export interface ClassSchedule {
  day: string; // Monday, Tuesday, etc.
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  room: string;
}

export interface Class {
  id: string;
  name: string;
  code: string; // Subject code like "CS101"
  type: 'class' | 'lab'; // Class or Lab
  subject: string; // Subject name
  department: string;
  year: string; // "FE", "SE", "TE", "BE"
  semester: string; // "1", "2"
  division?: string; // For classes: "5", "6"
  batch?: string; // For labs: "L5", "L6", "K5", "K6"
  facultyId: string; // UID of assigned faculty
  facultyName: string;
  room?: string; // Room/Lab location
  schedule: ClassSchedule[];
  students: string[]; // Array of student UIDs
  totalSessions: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isActive: boolean;
}

export interface CreateClassData {
  name: string;
  code: string;
  type: 'class' | 'lab';
  subject: string;
  department: string;
  year: string;
  semester: string;
  division?: string;
  batch?: string;
  facultyId: string;
  facultyName: string;
  room?: string;
  schedule: ClassSchedule[];
  students?: string[];
}

export interface UpdateClassData {
  name?: string;
  code?: string;
  type?: 'class' | 'lab';
  subject?: string;
  department?: string;
  year?: string;
  semester?: string;
  division?: string;
  batch?: string;
  facultyId?: string;
  facultyName?: string;
  room?: string;
  schedule?: ClassSchedule[];
  students?: string[];
  totalSessions?: number;
  isActive?: boolean;
}