import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseClient';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();
    
    console.log('Creating admin profile for UID:', uid);
    
    // Create admin user document in Firestore with the provided UID
    const adminData = {
      id: uid,
      email: "admin@pict.edu",
      name: "System Administrator",
      role: "admin",
      status: "approved",
      approved: true, // Make sure this is set
      department: "Administration",
      employeeId: "ADM001",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const adminRef = doc(db, 'users', uid);
    await setDoc(adminRef, adminData, { merge: true });
    
    console.log('Admin profile created successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Admin profile created successfully!',
      uid: uid,
      email: 'admin@pict.edu'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error creating admin profile:', error);
    return NextResponse.json({ 
      error: 'Failed to create admin profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Admin Profile Creation Endpoint',
    instructions: 'POST with UID to create admin profile'
  });
}