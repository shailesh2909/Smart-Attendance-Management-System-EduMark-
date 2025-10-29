import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export type ActivityType = "approval" | "class" | "attendance" | "user" | "system";

export interface ActivityLog {
  id?: string;
  type: ActivityType;
  message: string;
  userId?: string;
  metadata?: any;
  timestamp: any;
}

const ACTIVITY_COLLECTION = "activity_logs";

/**
 * Log an activity to the activity_logs collection
 */
export async function logActivity(
  type: ActivityType,
  message: string,
  userId?: string,
  metadata?: any
): Promise<void> {
  try {
    const activityLog: ActivityLog = {
      type,
      message,
      userId,
      metadata,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, ACTIVITY_COLLECTION), activityLog);
    console.log(`✓ Activity logged: ${type} - ${message}`);
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
