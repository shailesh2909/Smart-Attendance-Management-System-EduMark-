import { NextRequest, NextResponse } from "next/server";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth, deleteUser } from "firebase/auth";

// This should match your Firebase config
const firebaseConfig = {
  // Your Firebase config will be loaded from environment
};

export async function POST(request: NextRequest) {
  try {
    console.log("🗑️ Starting simple cleanup...");
    
    const db = getFirestore();
    
    // Get all Firestore documents
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    
    console.log(`🗑️ Found ${snapshot.size} Firestore documents to delete`);
    
    let deletedCount = 0;
    let skippedCount = 0;
    
    // Delete documents one by one (skip admin)
    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      
      // Skip admin users
      if (data.email === 'shaileshsuryawanshi443103@gmail.com' || data.role === 'admin') {
        console.log(`🗑️ Skipping admin user: ${data.email}`);
        skippedCount++;
        continue;
      }
      
      try {
        await deleteDoc(doc(db, "users", userDoc.id));
        deletedCount++;
        console.log(`🗑️ Deleted document: ${userDoc.id} (${data.email})`);
      } catch (error: any) {
        console.error(`🗑️ Failed to delete document ${userDoc.id}:`, error.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed`,
      summary: {
        totalDocuments: snapshot.size,
        deletedDocuments: deletedCount,
        skippedDocuments: skippedCount
      }
    });
    
  } catch (error: any) {
    console.error("🗑️ Cleanup error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: "Make sure Firebase is properly configured"
      },
      { status: 500 }
    );
  }
}