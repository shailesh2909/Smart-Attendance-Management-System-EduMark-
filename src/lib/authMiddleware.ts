import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/lib/firebaseAdmin";

export async function verifyAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing or invalid authorization header" 
        },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing authentication token" 
        },
        { status: 401 }
      );
    }

    // Verify the token with Firebase Admin
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user has admin role
    if (!decodedToken.admin && decodedToken.role !== "admin") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Insufficient permissions. Admin access required." 
        },
        { status: 403 }
      );
    }

    // Store user info in request for use in the route
    (request as any).user = decodedToken;
    
    return null; // Continue to the route handler
    
  } catch (error) {
    console.error("Auth verification error:", error);
    
    if (error instanceof Error && error.message.includes("expired")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Authentication token has expired" 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid authentication token" 
      },
      { status: 401 }
    );
  }
}

// Simple auth check without admin verification (for basic authentication)
export async function verifyAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing or invalid authorization header" 
        },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing authentication token" 
        },
        { status: 401 }
      );
    }

    // Verify the token with Firebase Admin
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(token);
    
    // Store user info in request for use in the route
    (request as any).user = decodedToken;
    
    return null; // Continue to the route handler
    
  } catch (error) {
    console.error("Auth verification error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid authentication token" 
      },
      { status: 401 }
    );
  }
}