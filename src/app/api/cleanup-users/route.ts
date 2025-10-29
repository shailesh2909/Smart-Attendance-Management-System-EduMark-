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

export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ Starting cleanup of all users...");
    
    // Get all Firestore documents
    const firestoreSnapshot = await db.collection("users").get();
    console.log(`🗑️ Found ${firestoreSnapshot.size} Firestore documents to delete`);
    
    // Delete all Firestore documents
    const batch = db.batch();
    firestoreSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`🗑️ Deleted ${firestoreSnapshot.size} Firestore documents`);
    
    // Get all Firebase Auth users
    const authUsers = await auth.listUsers();
    console.log(`🗑️ Found ${authUsers.users.length} Firebase Auth users to delete`);
    
    // Delete all Firebase Auth users (except admin)
    let deletedAuthUsers = 0;
    for (const user of authUsers.users) {
      try {
        // Skip admin users (you might want to adjust this logic)
        if (user.email?.includes('admin') || user.email === 'shaileshsuryawanshi443103@gmail.com') {
          console.log(`🗑️ Skipping admin user: ${user.email}`);
          continue;
        }
        
        await auth.deleteUser(user.uid);
        deletedAuthUsers++;
        console.log(`🗑️ Deleted auth user: ${user.email}`);
      } catch (error: any) {
        console.error(`🗑️ Failed to delete auth user ${user.uid}:`, error.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleanup complete`,
      summary: {
        deletedFirestoreDocuments: firestoreSnapshot.size,
        deletedAuthUsers: deletedAuthUsers,
        skippedAdminUsers: authUsers.users.length - deletedAuthUsers
      }
    });
    
  } catch (error: any) {
    console.error("🗑️ Cleanup error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}