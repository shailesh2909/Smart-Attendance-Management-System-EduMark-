import { useState, useEffect } from "react";
import { User, UserRole } from "@/models/User";
import { UserService } from "@/services/userService";

interface UseUserDataResult {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserData(filters?: {
  role?: UserRole;
  approved?: boolean;
  department?: string;
}): UseUserDataResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await UserService.getUsers(filters);
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters?.role, filters?.approved, filters?.department]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
}

// Hook for pending users
export function usePendingUsers(): UseUserDataResult {
  return useUserData({ approved: false });
}

// Hook for users by role
export function useUsersByRole(role: UserRole): UseUserDataResult {
  return useUserData({ role, approved: true });
}

// Hook for students by department
export function useStudentsByDepartment(department: string): UseUserDataResult {
  return useUserData({ role: "student", approved: true, department });
}