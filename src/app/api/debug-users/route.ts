import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug API: Starting user debug check");
    
    // Get all users from Firebase Auth
    const authUsers = await auth.listUsers();
    console.log(`🔍 Found ${authUsers.users.length} Firebase Auth users`);
    
    // Get all users from Firestore
    const firestoreSnapshot = await db.collection("users").get();
    console.log(`🔍 Found ${firestoreSnapshot.size} Firestore user documents`);
    
    const result = {
      authUsers: authUsers.users.map(user => ({
        uid: user.uid,
        email: user.email,
        creationTime: user.metadata.creationTime,
      })),
      firestoreUsers: [] as any[],
      missingInFirestore: [] as any[],
      missingInAuth: [] as any[]
    };
    
    // Process Firestore users
    firestoreSnapshot.forEach(doc => {
      const data = doc.data();
      result.firestoreUsers.push({
        documentId: doc.id,
        uid: data.uid,
        email: data.email,
        role: data.role,
        studentId: data.studentId,
        employeeId: data.employeeId,
        approved: data.approved
      });
    });
    
    // Find Firebase Auth users without Firestore documents
    for (const authUser of authUsers.users) {
      const hasFirestoreDoc = result.firestoreUsers.some(
        fsUser => fsUser.documentId === authUser.uid
      );
      if (!hasFirestoreDoc) {
        result.missingInFirestore.push({
          uid: authUser.uid,
          email: authUser.email,
          creationTime: authUser.metadata.creationTime
        });
      }
    }
    
    // Find Firestore documents without Firebase Auth users
    for (const fsUser of result.firestoreUsers) {
      const hasAuthUser = authUsers.users.some(
        authUser => authUser.uid === fsUser.uid
      );
      if (!hasAuthUser) {
        result.missingInAuth.push(fsUser);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      summary: {
        totalAuthUsers: result.authUsers.length,
        totalFirestoreUsers: result.firestoreUsers.length,
        missingInFirestore: result.missingInFirestore.length,
        missingInAuth: result.missingInAuth.length
      }
    });
    
  } catch (error: any) {
    console.error("🔍 Debug API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "UID is required" },
        { status: 400 }
      );
    }
    
    console.log(`🗑️ Deleting Firebase Auth user: ${uid}`);
    
    // Delete from Firebase Auth
    await auth.deleteUser(uid);
    
    // Try to delete from Firestore (if exists)
    try {
      await db.collection("users").doc(uid).delete();
      console.log(`🗑️ Deleted Firestore document: ${uid}`);
    } catch (error) {
      console.log(`🗑️ No Firestore document to delete for: ${uid}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Deleted user ${uid} from Firebase Auth and Firestore`
    });
    
  } catch (error: any) {
    console.error("🗑️ Delete user error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}