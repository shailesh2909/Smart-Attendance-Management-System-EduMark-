import { collection, addDoc, getDocs, query, where, doc, setDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebaseClient";
import { UserRole } from "@/models/User";

export interface StudentCSVData {
  studentName: string;
  studyingYear: string;
  rollNo: string;
  division: string;
  batch: string;
  electiveSubject: string;
  sId: string;
  sPassword: string;
}

export interface FacultyCSVData {
  name: string;
  designation: string;
  emailID: string;
  subject: string;
  E_ID: string;
  E_password: string;
}

export interface UploadResult {
  success: number;
  errors: number;
  errorDetails: string[];
}

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry operations with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 3000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests' && attempt < maxRetries) {
        const delayTime = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 3s, 6s, 12s, 24s
        console.log(`Rate limited, retrying in ${delayTime}ms... (attempt ${attempt}/${maxRetries})`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
};

export const uploadStudentCSV = async (students: StudentCSVData[]): Promise<UploadResult> => {
  const result: UploadResult = {
    success: 0,
    errors: 0,
    errorDetails: []
  };

  console.log(`Starting CSV upload for ${students.length} students`);
  console.log(`⚠️  This will take approximately ${Math.ceil(students.length * 2)} seconds due to Firebase rate limits`);

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    try {
      console.log(`Processing student: ${student.sId}`);
      
      // Check if student already exists and delete old records
      const existingQuery = query(
        collection(db, "users"), 
        where("studentId", "==", student.sId)
      );
      const existingDocs = await getDocs(existingQuery);
      
      const email = `${student.sId}@student.pict.edu`;
      
      // Delete existing documents and auth users to avoid duplicates
      if (!existingDocs.empty) {
        console.log(`Student ${student.sId} already exists, deleting old records...`);
        for (const docToDelete of existingDocs.docs) {
          try {
            const oldData = docToDelete.data();
            // Try to delete the Firebase Auth user if it exists
            if (oldData.uid) {
              try {
                // First try to sign in to get the user, then delete
                const tempAuth = await signInWithEmailAndPassword(auth, email, student.sPassword);
                if (tempAuth.user) {
                  await deleteUser(tempAuth.user);
                  console.log(`Deleted old Firebase Auth user for ${student.sId}`);
                }
              } catch (authError: any) {
                console.log(`Auth user for ${student.sId} might not exist or already deleted:`, authError.code);
              }
            }
            
            await deleteDoc(doc(db, "users", docToDelete.id));
            console.log(`Deleted old Firestore document for ${student.sId}: ${docToDelete.id}`);
          } catch (deleteError) {
            console.error(`Error deleting old document for ${student.sId}:`, deleteError);
          }
        }
      }

      console.log(`Creating auth user for: ${email}`);
      
      // Create Firebase Auth user with retry logic
      const userCredential = await retryWithBackoff(async () => {
        try {
          return await createUserWithEmailAndPassword(auth, email, student.sPassword);
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            // If email exists, try to sign in and delete, then recreate
            console.log(`Email ${email} already in use, attempting to clean up...`);
            const existingUser = await signInWithEmailAndPassword(auth, email, student.sPassword);
            await deleteUser(existingUser.user);
            console.log(`Deleted existing auth user for ${email}`);
            // Add small delay after cleanup
            await delay(500);
            // Now create new user
            return await createUserWithEmailAndPassword(auth, email, student.sPassword);
          } else {
            throw authError;
          }
        }
      });

      console.log(`Auth user created, creating Firestore document`);

      // Create user document in Firestore using UID as document ID
      const docRef = doc(db, "users", userCredential.user.uid);
      await setDoc(docRef, {
        uid: userCredential.user.uid,
        name: student.studentName,
        email: email,
        role: "student" as UserRole,
        studentId: student.sId,
        year: student.studyingYear,
        rollNo: student.rollNo,
        division: student.division,
        batch: student.batch,
        electiveSubject: student.electiveSubject,
        department: "Computer Engineering", // Default
        phone: "",
        approved: true, // Use 'approved' instead of 'isApproved'
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`Student ${student.sId} saved to database with ID: ${docRef.id}`);
      result.success++;
    } catch (error: any) {
      console.error(`Error uploading student ${student.sId}:`, error);
      result.errors++;
      result.errorDetails.push(`Student ${student.sId}: ${error.message}`);
    }
    
    // Add delay between requests to avoid rate limiting (except for last item)
    if (i < students.length - 1) {
      console.log(`⏳ Waiting 2 seconds before next student... (${i + 1}/${students.length} completed)`);
      await delay(2000); // 2 second delay between students
    }
  }

  console.log(`CSV upload completed. Success: ${result.success}, Errors: ${result.errors}`);
  return result;
};

export const uploadFacultyCSV = async (faculty: FacultyCSVData[]): Promise<UploadResult> => {
  const result: UploadResult = {
    success: 0,
    errors: 0,
    errorDetails: []
  };

  console.log(`Starting CSV upload for ${faculty.length} faculty members`);
  console.log(`⚠️  This will take approximately ${Math.ceil(faculty.length * 2)} seconds due to Firebase rate limits`);

  for (let i = 0; i < faculty.length; i++) {
    const facultyMember = faculty[i];
    try {
      console.log(`Processing faculty: ${facultyMember.E_ID}`);
      
      // Check if faculty already exists and delete old records
      const existingQuery = query(
        collection(db, "users"), 
        where("employeeId", "==", facultyMember.E_ID)
      );
      const existingDocs = await getDocs(existingQuery);
      
      // Use provided email or generate one
      const email = facultyMember.emailID || `${facultyMember.E_ID}@faculty.pict.edu`;
      
      // Delete existing documents and auth users to avoid duplicates
      if (!existingDocs.empty) {
        console.log(`Faculty ${facultyMember.E_ID} already exists, deleting old records...`);
        for (const docToDelete of existingDocs.docs) {
          try {
            const oldData = docToDelete.data();
            // Try to delete the Firebase Auth user if it exists
            if (oldData.uid) {
              try {
                const tempAuth = await signInWithEmailAndPassword(auth, email, facultyMember.E_password);
                if (tempAuth.user) {
                  await deleteUser(tempAuth.user);
                  console.log(`Deleted old Firebase Auth user for ${facultyMember.E_ID}`);
                }
              } catch (authError: any) {
                console.log(`Auth user for ${facultyMember.E_ID} might not exist or already deleted:`, authError.code);
              }
            }
            
            await deleteDoc(doc(db, "users", docToDelete.id));
            console.log(`Deleted old Firestore document for ${facultyMember.E_ID}: ${docToDelete.id}`);
          } catch (deleteError) {
            console.error(`Error deleting old document for ${facultyMember.E_ID}:`, deleteError);
          }
        }
      }

      console.log(`Creating auth user for: ${email}`);
      
      // Create Firebase Auth user with retry logic
      const userCredential = await retryWithBackoff(async () => {
        try {
          return await createUserWithEmailAndPassword(auth, email, facultyMember.E_password);
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            // If email exists, try to sign in and delete, then recreate
            console.log(`Email ${email} already in use, attempting to clean up...`);
            const existingUser = await signInWithEmailAndPassword(auth, email, facultyMember.E_password);
            await deleteUser(existingUser.user);
            console.log(`Deleted existing auth user for ${email}`);
            // Add small delay after cleanup
            await delay(1000);
            // Now create new user
            return await createUserWithEmailAndPassword(auth, email, facultyMember.E_password);
          } else {
            throw authError;
          }
        }
      });

      console.log(`Auth user created, creating Firestore document`);

      // Create user document in Firestore using UID as document ID
      const docRef = doc(db, "users", userCredential.user.uid);
      await setDoc(docRef, {
        uid: userCredential.user.uid,
        name: facultyMember.name,
        email: email,
        role: "faculty" as UserRole,
        employeeId: facultyMember.E_ID,
        designation: facultyMember.designation || "Professor", // Use provided designation or default
        subject: facultyMember.subject,
        phone: "",
        approved: true, // Use 'approved' instead of 'isApproved'
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`Faculty ${facultyMember.E_ID} saved to database with ID: ${docRef.id}`);
      result.success++;
    } catch (error: any) {
      console.error(`Error uploading faculty ${facultyMember.E_ID}:`, error);
      result.errors++;
      result.errorDetails.push(`Faculty ${facultyMember.E_ID}: ${error.message}`);
    }
    
    // Add delay between requests to avoid rate limiting (except for last item)
    if (i < faculty.length - 1) {
      console.log(`⏳ Waiting 2 seconds before next faculty... (${i + 1}/${faculty.length} completed)`);
      await delay(2000); // 2 second delay between faculty members
    }
  }

  console.log(`CSV upload completed. Success: ${result.success}, Errors: ${result.errors}`);
  return result;
};

export const parseCSV = (csvText: string): any[] => {
  // Remove BOM if present and normalize line endings
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return [];
  
  // Handle both comma and semicolon separators
  const firstLine = lines[0];
  const separator = firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
  
  const headers = lines[0].split(separator).map(h => h.trim().replace(/['"]/g, ''));
  
  return lines.slice(1).map((line, index) => {
    // Handle quoted values properly
    const values = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  }).filter(row => Object.values(row).some(val => val !== ''));
};

export const validateStudentCSV = (data: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredFields = ['studentName', 'studyingYear', 'rollNo', 'division', 'batch', 'electiveSubject', 'sId', 'sPassword'];
  const validDivisions = ['5', '6'];
  const validBatches: { [key: string]: string[] } = {
    '5': ['K5', 'L5', 'M5', 'N5'],
    '6': ['K6', 'L6', 'M6', 'N6']
  };
  
  if (data.length === 0) {
    errors.push('CSV file is empty or invalid');
    return { valid: false, errors };
  }

  const headers = Object.keys(data[0]);
  const missingFields = requiredFields.filter(field => !headers.includes(field));
  
  if (missingFields.length > 0) {
    errors.push(`Missing required columns: ${missingFields.join(', ')}`);
  }

  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Row ${index + 2}: Missing value for ${field}`);
      }
    });

    // Validate division and batch combination
    if (row.division && row.batch) {
      const division = row.division.trim();
      const batch = row.batch.trim();
      
      if (!validDivisions.includes(division)) {
        errors.push(`Row ${index + 2}: Invalid division '${division}'. Must be 5 or 6`);
      } else if (!validBatches[division]?.includes(batch)) {
        errors.push(`Row ${index + 2}: Invalid batch '${batch}' for division ${division}. Valid batches for division ${division}: ${validBatches[division]?.join(', ')}`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
};

export const validateFacultyCSV = (data: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredFields = ['name', 'designation', 'emailID', 'subject', 'E_ID', 'E_password'];
  
  if (data.length === 0) {
    errors.push('CSV file is empty or invalid');
    return { valid: false, errors };
  }

  const headers = Object.keys(data[0]);
  const missingFields = requiredFields.filter(field => !headers.includes(field));
  
  if (missingFields.length > 0) {
    errors.push(`Missing required columns: ${missingFields.join(', ')}`);
  }

  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Row ${index + 2}: Missing value for ${field}`);
      }
    });

    // Validate email format if provided
    if (row.emailID && row.emailID.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.emailID.trim())) {
        errors.push(`Row ${index + 2}: Invalid email format for emailID`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
};