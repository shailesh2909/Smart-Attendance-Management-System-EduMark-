import { NextRequest, NextResponse } from "next/server";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

interface ActivityLog {
  id?: string;
  type: "approval" | "class" | "attendance" | "user" | "system";
  message: string;
  userId?: string;
  metadata?: any;
  timestamp: any;
}

const ACTIVITY_COLLECTION = "activity_logs";

// GET - Fetch recent activity logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const maxResults = limitParam ? parseInt(limitParam) : 20;

    const q = query(
      collection(db, ACTIVITY_COLLECTION),
      orderBy("timestamp", "desc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const activities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: activities,
      count: activities.length,
    });

  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch activity logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Add new activity log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, userId, metadata } = body;

    if (!type || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: type and message",
        },
        { status: 400 }
      );
    }

    const activityLog: ActivityLog = {
      type,
      message,
      userId,
      metadata,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, ACTIVITY_COLLECTION), activityLog);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...activityLog },
      message: "Activity logged successfully",
    });

  } catch (error) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create activity log",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}