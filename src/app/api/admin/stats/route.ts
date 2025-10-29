import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/services/adminService";

export async function GET(request: NextRequest) {
  try {
    // For now, we'll skip authentication to test functionality
    // TODO: Add authentication middleware
    // const authError = await verifyAdminAuth(request);
    // if (authError) return authError;

    const stats = await AdminService.getDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}