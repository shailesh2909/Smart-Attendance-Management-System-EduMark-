import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export async function POST() {
  try {
    console.log('Creating admin account...');
    
    // Create admin user document in Firestore
    const adminData = {
      id: "admin-001",
      email: "admin@pict.edu",
      name: "System Administrator", 
      role: "admin",
      status: "approved",
      department: "Administration",
      employeeId: "ADM001",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const adminRef = doc(db, 'users', 'admin-001');
    await setDoc(adminRef, adminData);
    
    console.log('Admin account created successfully!');
    
    return NextResponse.json({
      message: 'Admin account created successfully!',
      admin: {
        email: 'admin@pict.edu',
        password: 'password123',
        role: 'admin',
        status: 'approved'
      },
      instructions: [
        '1. Go to Firebase Console > Authentication > Users',
        '2. Click "Add user"',
        '3. Email: admin@pict.edu',
        '4. Password: password123',
        '5. Then you can login!'
      ]
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error creating admin account:', error);
    return NextResponse.json({ 
      error: 'Failed to create admin account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Admin Setup Endpoint',
    instructions: 'POST to this endpoint to create admin account'
  });
}