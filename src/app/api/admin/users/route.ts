import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/userService";

// GET - Fetch all users with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as "student" | "faculty" | "admin" | null;
    const department = searchParams.get("department");

    const filters: any = {};
    if (role) filters.role = role;
    if (department) filters.department = department;

    const users = await UserService.getUsers(filters);

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}