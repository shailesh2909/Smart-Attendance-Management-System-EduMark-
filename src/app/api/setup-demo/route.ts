import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseClient';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';

// Sample data inline to avoid import issues
const sampleData = {
  "users": [
    {
      "id": "admin-001",
      "email": "admin@pict.edu",
      "name": "System Administrator",
      "role": "admin",
      "status": "approved",
      "department": "Administration",
      "employeeId": "ADM001"
    },
    {
      "id": "faculty-001", 
      "email": "faculty@pict.edu",
      "name": "Dr. John Faculty",
      "role": "faculty",
      "status": "approved",
      "department": "Computer Engineering",
      "employeeId": "FAC001"
    },
    {
      "id": "student-001",
      "email": "student@pict.edu", 
      "name": "Jane Student",
      "role": "student",
      "status": "approved",
      "department": "Computer Engineering",
      "rollNumber": "STU001",
      "year": "TE",
      "division": "A"
    }
  ],
  "classes": [
    {
      "id": "class-001",
      "name": "Database Management Systems",
      "code": "DBMS",
      "department": "Computer Engineering",
      "year": "TE",
      "division": "A",
      "facultyId": "faculty-001",
      "students": ["student-001"]
    }
  ],
  "departments": [
    {
      "id": "dept-001", 
      "name": "Computer Engineering",
      "code": "COMP",
      "head": "Dr. Department Head"
    },
    {
      "id": "dept-002",
      "name": "Administration", 
      "code": "ADM",
      "head": "Admin Head"
    }
  ]
};

export async function POST() {
  try {
    console.log('Setting up demo data...');
    
    const batch = writeBatch(db);
    
    // Check if data already exists
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (!usersSnapshot.empty) {
      return NextResponse.json({ 
        message: 'Demo data already exists in database',
        existingUsers: usersSnapshot.size
      }, { status: 200 });
    }
    
    // Setup Users (documents only - you'll create auth accounts manually)
    console.log('Creating user documents...');
    for (const user of sampleData.users) {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Setup Classes
    console.log('Creating classes...');
    for (const classData of sampleData.classes) {
      const classRef = doc(db, 'classes', classData.id);
      batch.set(classRef, {
        ...classData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Setup Departments
    console.log('Creating departments...');
    for (const department of sampleData.departments) {
      const deptRef = doc(db, 'departments', department.id);
      batch.set(deptRef, {
        ...department,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Commit all changes
    await batch.commit();
    
    console.log('Demo data setup completed!');
    
    return NextResponse.json({
      message: 'Demo data setup completed successfully!',
      users: sampleData.users.length,
      classes: sampleData.classes.length,
      departments: sampleData.departments.length,
      credentials: [
        'Admin: admin@pict.edu / password123',
        'Faculty: faculty@pict.edu / password123', 
        'Student: student@pict.edu / password123'
      ]
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error setting up demo data:', error);
    return NextResponse.json({ 
      error: 'Failed to setup demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check what data currently exists
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const classesSnapshot = await getDocs(collection(db, 'classes'));
    const departmentsSnapshot = await getDocs(collection(db, 'departments'));
    
    const users: any[] = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return NextResponse.json({
      message: 'Current database status',
      counts: {
        users: usersSnapshot.size,
        classes: classesSnapshot.size,
        departments: departmentsSnapshot.size
      },
      users: users.map(u => ({ id: u.id, email: u.email, role: u.role, status: u.status }))
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json({ 
      error: 'Failed to check database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}